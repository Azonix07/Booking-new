import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';

import {
  Booking,
  BookingDocument,
  BookingStatus,
} from './schemas/booking.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { SlotEngineService, SlotView, AvailabilityQuery } from './slot-engine.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { computeEndTime, timeToMinutes, slotsNeeded, minutesToTime, SLOT_START, SLOT_END, SLOT_SIZE_MINUTES } from '../../common/utils/slot-generator.util';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { RedisLockService } from '../../redis/redis-lock.service';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectConnection() private connection: Connection,
    private slotEngine: SlotEngineService,
    private redisLock: RedisLockService,
  ) {}

  /** Get tenant's configured slot interval, falling back to 60 */
  private async getSlotInterval(tenantId: string): Promise<number> {
    const tenant = await this.tenantModel
      .findOne({ _id: new Types.ObjectId(tenantId) })
      .select('shopSettings.slotInterval')
      .lean();
    return tenant?.shopSettings?.slotInterval || SLOT_SIZE_MINUTES;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  GET AVAILABILITY  — public endpoint, returns the color-coded slot grid
  // ═══════════════════════════════════════════════════════════════════════════════

  async getAvailability(
    tenantId: string,
    serviceId: string,
    date: string,
    duration: number,
    numberOfPersons: number,
  ): Promise<SlotView[]> {
    const dateObj = this.parseDate(date);

    return this.slotEngine.getAvailability({
      tenantId,
      serviceId,
      date: dateObj,
      duration,
      numberOfPersons,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  CREATE BOOKING  — the core transactional booking flow
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Full booking creation flow:
   *
   *  1. Validate inputs (service, duration, persons, time bounds)
   *  2. Check for duplicate booking by this customer
   *  3. START TRANSACTION
   *  4.   SlotEngine.reserveSlots() — atomic capacity check + increment
   *  5.   Create Booking document
   *  6. COMMIT TRANSACTION
   *
   * If any slot lacks capacity → ConflictException → transaction rolls back
   * → all slot counters remain unchanged. Zero inconsistency.
   */
  async createBooking(
    tenantId: string,
    user: AuthenticatedUser,
    dto: CreateBookingDto,
  ): Promise<BookingDocument> {
    const { serviceId, date, numberOfPersons, customerNotes } = dto;
    const dateObj = this.parseDate(date);

    // ── 1. Load & validate service ──────────────────────────────────────────────

    const service = await this.serviceModel.findOne({
      _id: new Types.ObjectId(serviceId),
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    });

    if (!service) {
      throw new NotFoundException('Service not found or inactive');
    }

    // Validate person count
    if (numberOfPersons < service.minPersons || numberOfPersons > service.maxPersons) {
      throw new BadRequestException(
        `Guests must be between ${service.minPersons} and ${service.maxPersons} for ${service.name}`,
      );
    }

    // ── Route to the appropriate booking flow based on mode ──────────────────────

    if (service.bookingMode === 'date-range') {
      return this.createDateRangeBooking(tenantId, user, dto, service, dateObj);
    }

    // ── SLOT MODE (existing flow) ───────────────────────────────────────────────

    const { startTime, duration } = dto;
    if (!startTime || !duration) {
      throw new BadRequestException('startTime and duration are required for slot-based services');
    }

    // Validate duration
    this.validateDuration(service, duration);

    // Get the tenant's configured slot interval
    const slotInterval = await this.getSlotInterval(tenantId);

    // Validate time boundaries
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + duration;
    const openMin = timeToMinutes(SLOT_START);
    const closeMin = timeToMinutes(SLOT_END);

    if (startMin < openMin || endMin > closeMin) {
      throw new BadRequestException(
        `Booking must be within operating hours (${SLOT_START}–${SLOT_END})`,
      );
    }

    // Start time must align to the slot grid
    if ((startMin - openMin) % slotInterval !== 0) {
      throw new BadRequestException(
        `Start time must align to a ${slotInterval}-minute slot boundary`,
      );
    }

    // Prevent booking in the past
    const now = new Date();
    const bookingDateTime = new Date(dateObj);
    bookingDateTime.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    if (bookingDateTime < now) {
      throw new BadRequestException('Cannot book a slot in the past');
    }

    const endTime = computeEndTime(startTime, duration);

    // ── 2. Duplicate check ──────────────────────────────────────────────────────

    const existingBooking = await this.bookingModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      serviceId: new Types.ObjectId(serviceId),
      customerId: new Types.ObjectId(user.userId),
      date: dateObj,
      startTime,
      status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
    });

    if (existingBooking) {
      throw new ConflictException(
        'You already have a booking for this service at this time',
      );
    }

    // ── 3. Check for overlapping bookings by the same customer ──────────────────

    await this.checkCustomerOverlap(tenantId, user.userId, serviceId, dateObj, startTime, duration);

    // ── 4. Calculate price ──────────────────────────────────────────────────────

    const totalAmount = this.calculatePrice(service, duration, numberOfPersons);

    // ── 5. Acquire distributed lock → Transaction → reserve slots + create ──────
    //
    //  The Redis lock serializes concurrent requests to the SAME slot group.
    //  If Redis is unavailable, the MongoDB $expr atomic guard in
    //  SlotEngine.reserveSlots() still prevents overbooking.

    const lockKeys = this.buildSlotLockKeys(tenantId, serviceId, date, startTime, duration, slotInterval);
    let booking: BookingDocument;

    const executeBooking = async (): Promise<void> => {
      const session = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          // Ensure slot docs exist
          await this.slotEngine.ensureSlotsExist(tenantId, service, dateObj);

          // Create the booking doc first (we need its _id for slot bookingIds)
          const [created] = await this.bookingModel.create(
            [
              {
                tenantId: new Types.ObjectId(tenantId),
                serviceId: new Types.ObjectId(serviceId),
                customerId: new Types.ObjectId(user.userId),
                date: dateObj,
                startTime,
                endTime,
                duration,
                numberOfPersons,
                totalAmount,
                currency: service.currency,
                customerNotes: customerNotes || '',
                status: BookingStatus.PENDING,
                slotIds: [], // will be updated
              },
            ],
            { session },
          );

          // Reserve all required slots atomically
          const slotIds = await this.slotEngine.reserveSlots(
            tenantId,
            serviceId,
            dateObj,
            startTime,
            duration,
            numberOfPersons,
            created._id as Types.ObjectId,
            session,
          );

          // Link slot IDs back to booking
          await this.bookingModel.updateOne(
            { _id: created._id },
            { $set: { slotIds } },
            { session },
          );

          created.slotIds = slotIds;
          booking = created;
        });
      } finally {
        await session.endSession();
      }
    };

    // Acquire locks on ALL slot keys this booking touches, then run the transaction
    await this.withMultiLock(lockKeys, executeBooking);

    this.logger.log(
      `Booking ${booking!.bookingRef} created: ${service.name}, ` +
      `${numberOfPersons} player(s), ${startTime}–${endTime} on ${date}`,
    );

    return booking!;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  DATE-RANGE BOOKING  — for rooms, hotels, accommodations
  // ═══════════════════════════════════════════════════════════════════════════════

  private async createDateRangeBooking(
    tenantId: string,
    user: AuthenticatedUser,
    dto: CreateBookingDto,
    service: ServiceDocument,
    checkInDate: Date,
  ): Promise<BookingDocument> {
    if (!dto.checkOutDate) {
      throw new BadRequestException('checkOutDate is required for room/accommodation booking');
    }

    const checkOutDate = this.parseDate(dto.checkOutDate);
    const numberOfUnits = dto.numberOfUnits || 1;

    // Validate dates
    if (checkOutDate <= checkInDate) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (checkInDate < now) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Calculate nights
    const msPerDay = 24 * 60 * 60 * 1000;
    const numberOfNights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay);
    if (numberOfNights < 1 || numberOfNights > 365) {
      throw new BadRequestException('Stay must be between 1 and 365 nights');
    }

    if (numberOfUnits > service.totalUnits) {
      throw new BadRequestException(
        `Only ${service.totalUnits} ${service.unitType || 'unit'}(s) available`,
      );
    }

    // Check availability for each night in the range
    const unavailableDates: string[] = [];
    for (let i = 0; i < numberOfNights; i++) {
      const nightDate = new Date(checkInDate);
      nightDate.setDate(nightDate.getDate() + i);

      const bookedUnits = await this.bookingModel.countDocuments({
        tenantId: new Types.ObjectId(tenantId),
        serviceId: service._id,
        bookingMode: 'date-range',
        status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
        checkInDate: { $lte: nightDate },
        checkOutDate: { $gt: nightDate },
      });

      if (bookedUnits + numberOfUnits > service.totalUnits) {
        unavailableDates.push(nightDate.toISOString().split('T')[0]);
      }
    }

    if (unavailableDates.length > 0) {
      throw new ConflictException(
        `Not enough units available on: ${unavailableDates.join(', ')}`,
      );
    }

    // Duplicate check
    const duplicate = await this.bookingModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      serviceId: service._id,
      customerId: new Types.ObjectId(user.userId),
      bookingMode: 'date-range',
      checkInDate,
      checkOutDate,
      status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
    });

    if (duplicate) {
      throw new ConflictException('You already have a booking for these dates');
    }

    // Calculate price
    const pricePerNight = service.pricePerNight || service.price;
    const totalAmount = pricePerNight * numberOfNights * numberOfUnits;

    const booking = await this.bookingModel.create({
      tenantId: new Types.ObjectId(tenantId),
      serviceId: service._id,
      customerId: new Types.ObjectId(user.userId),
      bookingMode: 'date-range',
      date: checkInDate,
      checkInDate,
      checkOutDate,
      numberOfNights,
      numberOfPersons: dto.numberOfPersons,
      numberOfUnits,
      totalAmount,
      currency: service.currency,
      customerNotes: dto.customerNotes || '',
      status: BookingStatus.PENDING,
      slotIds: [],
      startTime: service.checkInTime || '14:00',
      endTime: service.checkOutTime || '11:00',
      duration: numberOfNights * 24 * 60,
    });

    this.logger.log(
      `Room booking ${booking.bookingRef} created: ${service.name}, ` +
      `${numberOfNights} night(s), ${numberOfUnits} unit(s), ` +
      `${checkInDate.toISOString().split('T')[0]} → ${checkOutDate.toISOString().split('T')[0]}`,
    );

    return booking;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  DATE-RANGE AVAILABILITY — check which dates have rooms free
  // ═══════════════════════════════════════════════════════════════════════════════

  async getDateRangeAvailability(
    tenantId: string,
    serviceId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ date: string; totalUnits: number; bookedUnits: number; available: number }[]> {
    const service = await this.serviceModel.findOne({
      _id: new Types.ObjectId(serviceId),
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    });

    if (!service) throw new NotFoundException('Service not found');

    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.round((end.getTime() - start.getTime()) / msPerDay);

    if (days < 1 || days > 90) {
      throw new BadRequestException('Date range must be 1–90 days');
    }

    const results: { date: string; totalUnits: number; bookedUnits: number; available: number }[] = [];

    for (let i = 0; i < days; i++) {
      const nightDate = new Date(start);
      nightDate.setDate(nightDate.getDate() + i);
      const dateStr = nightDate.toISOString().split('T')[0];

      const bookedUnits = await this.bookingModel.countDocuments({
        tenantId: new Types.ObjectId(tenantId),
        serviceId: service._id,
        bookingMode: 'date-range',
        status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
        checkInDate: { $lte: nightDate },
        checkOutDate: { $gt: nightDate },
      });

      results.push({
        date: dateStr,
        totalUnits: service.totalUnits,
        bookedUnits,
        available: Math.max(0, service.totalUnits - bookedUnits),
      });
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  CANCEL BOOKING  — releases slots inside a transaction
  // ═══════════════════════════════════════════════════════════════════════════════

  async cancelBooking(
    tenantId: string,
    bookingId: string,
    user: AuthenticatedUser,
    dto: CancelBookingDto,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findOne({
      _id: new Types.ObjectId(bookingId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Only the customer who booked, or a client_admin of this tenant, can cancel
    if (
      user.role === 'customer' &&
      booking.customerId.toString() !== user.userId
    ) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REFUNDED
    ) {
      throw new BadRequestException('Booking is already cancelled');
    }

    // Build lock keys for the slots this booking covers
    const cancelSlotInterval = await this.getSlotInterval(tenantId);
    const lockKeys = this.buildSlotLockKeys(
      tenantId,
      booking.serviceId.toString(),
      booking.date.toISOString().slice(0, 10),
      booking.startTime,
      booking.duration,
      cancelSlotInterval,
    );

    const executeCancellation = async (): Promise<void> => {
      const session = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          // Release all slot capacity
          await this.slotEngine.releaseSlots(
            booking.slotIds,
            booking.numberOfPersons,
            booking._id as Types.ObjectId,
            session,
          );

          // Update booking status
          await this.bookingModel.updateOne(
            { _id: booking._id },
            {
              $set: {
                status: BookingStatus.CANCELLED,
                cancellationReason: dto.reason || '',
                cancelledAt: new Date(),
              },
            },
            { session },
          );
        });
      } finally {
        await session.endSession();
      }
    };

    await this.withMultiLock(lockKeys, executeCancellation);

    this.logger.log(`Booking ${booking.bookingRef} cancelled`);

    return this.bookingModel.findById(booking._id).lean() as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  CONFIRM BOOKING  — called after successful payment verification
  // ═══════════════════════════════════════════════════════════════════════════════

  async confirmBooking(
    bookingId: string,
    paymentId: Types.ObjectId,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot confirm booking with status "${booking.status}"`,
      );
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.paymentId = paymentId;
    await booking.save();

    this.logger.log(`Booking ${booking.bookingRef} confirmed after payment`);

    return booking;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  EXPIRE STALE PENDING BOOKINGS  — release slots if payment not completed
  // ═══════════════════════════════════════════════════════════════════════════════

  async expirePendingBookings(maxAgeMinutes = 15): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const stalePending = await this.bookingModel.find({
      status: BookingStatus.PENDING,
      createdAt: { $lt: cutoff },
    });

    let expired = 0;

    for (const booking of stalePending) {
      try {
        const session = await this.connection.startSession();
        try {
          await session.withTransaction(async () => {
            await this.slotEngine.releaseSlots(
              booking.slotIds,
              booking.numberOfPersons,
              booking._id as Types.ObjectId,
              session,
            );

            await this.bookingModel.updateOne(
              { _id: booking._id },
              {
                $set: {
                  status: BookingStatus.CANCELLED,
                  cancellationReason: 'Payment not completed within time limit',
                  cancelledAt: new Date(),
                },
              },
              { session },
            );
          });
        } finally {
          await session.endSession();
        }

        this.logger.warn(`Expired pending booking ${booking.bookingRef}`);
        expired++;
      } catch (err) {
        this.logger.error(
          `Failed to expire booking ${booking.bookingRef}: ${err.message}`,
        );
      }
    }

    return expired;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  READ OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getBookingById(tenantId: string, bookingId: string) {
    const booking = await this.bookingModel
      .findOne({
        _id: new Types.ObjectId(bookingId),
        tenantId: new Types.ObjectId(tenantId),
      })
      .populate('serviceId', 'name category images')
      .lean();

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getBookingsByDate(tenantId: string, date: string) {
    const dateObj = this.parseDate(date);
    return this.bookingModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        date: dateObj,
        status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
      })
      .populate('serviceId', 'name category')
      .populate('customerId', 'name email phone')
      .sort({ startTime: 1 })
      .lean();
  }

  async getMyBookings(userId: string) {
    return this.bookingModel
      .find({
        customerId: new Types.ObjectId(userId),
      })
      .populate('serviceId', 'name category images')
      .sort({ date: -1, startTime: -1 })
      .lean();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  Private helpers
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Prevent the same customer from having overlapping bookings on the
   * same service on the same date.
   *
   * Example: Customer has PS5 14:00–16:00. They try to book PS5 15:00–16:00.
   * The time ranges overlap → reject.
   */
  private async checkCustomerOverlap(
    tenantId: string,
    customerId: string,
    serviceId: string,
    date: Date,
    startTime: string,
    duration: number,
  ): Promise<void> {
    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + duration;

    const existing = await this.bookingModel.find({
      tenantId: new Types.ObjectId(tenantId),
      serviceId: new Types.ObjectId(serviceId),
      customerId: new Types.ObjectId(customerId),
      date,
      status: { $nin: [BookingStatus.CANCELLED, BookingStatus.REFUNDED] },
    }).lean();

    for (const bk of existing) {
      const bkStart = timeToMinutes(bk.startTime);
      const bkEnd = bkStart + bk.duration;

      // Two intervals overlap if one starts before the other ends
      if (newStart < bkEnd && newEnd > bkStart) {
        throw new ConflictException(
          `Overlaps with your existing booking ${bk.bookingRef} (${bk.startTime}–${bk.endTime})`,
        );
      }
    }
  }

  private calculatePrice(
    service: ServiceDocument,
    duration: number,
    numberOfPersons: number,
  ): number {
    let basePrice = service.price;

    // Use duration-specific price if available
    if (service.durationOptions?.length > 0) {
      const opt = service.durationOptions.find((o) => o.minutes === duration);
      if (opt) basePrice = opt.price;
    }

    const extraPersons = Math.max(0, numberOfPersons - 1);
    return basePrice + extraPersons * service.pricePerAdditionalPerson;
  }

  private validateDuration(service: ServiceDocument, duration: number): void {
    if (service.durationOptions?.length > 0) {
      const allowed = service.durationOptions.map((o) => o.minutes);
      if (!allowed.includes(duration)) {
        throw new BadRequestException(
          `Duration must be one of: ${allowed.join(', ')} minutes`,
        );
      }
    } else {
      if (duration !== service.defaultDuration) {
        throw new BadRequestException(
          `Duration must be ${service.defaultDuration} minutes for ${service.name}`,
        );
      }
    }
  }

  private parseDate(date: string): Date {
    const d = new Date(date + 'T00:00:00.000Z');
    if (isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }
    return d;
  }

  // ─── Redis Lock Helpers ──────────────────────────────────────────────────────

  /**
   * Build one lock key PER slot that a booking spans.
   * A 2-hour booking at 14:00 on 60-min slots → keys for 14:00 and 15:00.
   * This allows non-overlapping bookings to proceed in parallel.
   */
  private buildSlotLockKeys(
    tenantId: string,
    serviceId: string,
    date: string,
    startTime: string,
    duration: number,
    slotInterval = SLOT_SIZE_MINUTES,
  ): string[] {
    const count = slotsNeeded(duration, slotInterval);
    const startMin = timeToMinutes(startTime);
    const keys: string[] = [];

    for (let i = 0; i < count; i++) {
      const slotTime = minutesToTime(startMin + i * slotInterval);
      keys.push(this.redisLock.slotLockKey(tenantId, serviceId, date, slotTime));
    }

    // Sort keys to prevent deadlocks when two bookings overlap partially
    return keys.sort();
  }

  /**
   * Acquire multiple locks in order (deadlock-safe), run callback, release all.
   * If Redis is unavailable, runs callback without locks (DB-level fallback).
   */
  private async withMultiLock<T>(
    keys: string[],
    callback: () => Promise<T>,
  ): Promise<T> {
    const tokens: Array<{ key: string; token: string | null }> = [];

    try {
      // Acquire all locks in sorted order
      for (const key of keys) {
        const token = await this.redisLock.acquireLock(key);
        tokens.push({ key, token });
      }

      return await callback();
    } finally {
      // Release all acquired locks in reverse order
      for (const { key, token } of tokens.reverse()) {
        await this.redisLock.releaseLock(key, token);
      }
    }
  }
}
