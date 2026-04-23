import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, ClientSession } from 'mongoose';
import {
  TimeSlot,
  TimeSlotDocument,
  SlotStatus,
} from '../time-slots/schemas/time-slot.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import {
  allSlotStartTimes,
  minutesToTime,
  timeToMinutes,
  slotsNeeded,
  SLOT_SIZE_MINUTES,
  SLOT_START,
  SLOT_END,
} from '../../common/utils/slot-generator.util';

// ─── Public types returned to the controller ─────────────────────────────────

export interface SlotView {
  slotId: string;
  startTime: string;          // "10:00"
  endTime: string;            // "11:00"
  maxPlayers: number;         // 8  (for PS5)
  bookedPlayers: number;      // 5
  availablePlayers: number;   // 3
  status: SlotStatus;         // green / yellow / red / grey
  /** Can a booking of `requestedPlayers` fit starting from this slot
   *  for the given `duration`? Pre-computed for the UI. */
  canBook: boolean;
}

export interface AvailabilityQuery {
  tenantId: string;
  serviceId: string;
  date: Date;            // midnight UTC
  duration: number;      // minutes — e.g. 60, 120
  numberOfPersons: number;
}

@Injectable()
export class SlotEngineService {
  private readonly logger = new Logger(SlotEngineService.name);

  constructor(
    @InjectModel(TimeSlot.name) private slotModel: Model<TimeSlotDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  /**
   * Get the slot interval for a tenant from their shopSettings,
   * falling back to the hardcoded default.
   */
  private async getSlotInterval(tenantId: string): Promise<number> {
    const tenant = await this.tenantModel
      .findOne({ _id: new Types.ObjectId(tenantId) })
      .select('shopSettings.slotInterval')
      .lean();
    return tenant?.shopSettings?.slotInterval || SLOT_SIZE_MINUTES;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  1.  GET AVAILABILITY — Called when customer opens the calendar
  // ═══════════════════════════════════════════════════════════════════════════════

  async getAvailability(query: AvailabilityQuery): Promise<SlotView[]> {
    const { tenantId, serviceId, date, duration, numberOfPersons } = query;

    const service = await this.serviceModel.findOne({
      _id: new Types.ObjectId(serviceId),
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    });

    if (!service) {
      throw new BadRequestException('Service not found or inactive');
    }

    // Validate person count against service limits
    if (numberOfPersons < service.minPersons || numberOfPersons > service.maxPersons) {
      throw new BadRequestException(
        `Number of persons must be between ${service.minPersons} and ${service.maxPersons}`,
      );
    }

    // Validate duration against allowed options (or default)
    this.validateDuration(service, duration);

    // Get the tenant's configured slot interval
    const slotInterval = await this.getSlotInterval(tenantId);

    // Ensure slots exist for this date (lazy generation)
    await this.ensureSlotsExist(tenantId, service, date, slotInterval);

    // Fetch all slots for this service+date
    const slots = await this.slotModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        serviceId: new Types.ObjectId(serviceId),
        date,
      })
      .sort({ startTime: 1 })
      .lean();

    const requiredSlots = slotsNeeded(duration, slotInterval);

    // Build the view for each slot
    return slots.map((slot, index) => {
      const available = slot.maxPlayers - slot.bookedPlayers;

      // Can this slot be the START of a booking of `duration` for `numberOfPersons`?
      const canBook = this.canStartBookingAt(
        slots,
        index,
        requiredSlots,
        numberOfPersons,
      );

      return {
        slotId: (slot._id as Types.ObjectId).toString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxPlayers: slot.maxPlayers,
        bookedPlayers: slot.bookedPlayers,
        availablePlayers: Math.max(0, available),
        status: slot.status,
        canBook,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  2.  RESERVE SLOTS — Called during booking creation (inside transaction)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Atomically increment counters on all slots this booking spans.
   * Returns the slot IDs or throws ConflictException if capacity exceeded.
   *
   * MUST be called inside a Mongoose session (transaction) so all slot
   * updates succeed or fail together.
   */
  async reserveSlots(
    tenantId: string,
    serviceId: string,
    date: Date,
    startTime: string,
    duration: number,
    numberOfPersons: number,
    bookingId: Types.ObjectId,
    session: ClientSession,
  ): Promise<Types.ObjectId[]> {
    const slotInterval = await this.getSlotInterval(tenantId);
    const requiredCount = slotsNeeded(duration, slotInterval);
    const startMinutes = timeToMinutes(startTime);
    const slotIds: Types.ObjectId[] = [];

    for (let i = 0; i < requiredCount; i++) {
      const slotStart = minutesToTime(startMinutes + i * slotInterval);
      const slotEnd = minutesToTime(startMinutes + (i + 1) * slotInterval);

      // Atomic update: only succeeds if capacity allows
      const result = await this.slotModel.findOneAndUpdate(
        {
          tenantId: new Types.ObjectId(tenantId),
          serviceId: new Types.ObjectId(serviceId),
          date,
          startTime: slotStart,
          isManuallyBlocked: false,
          // The key conflict check — ensures we don't overshoot capacity
          $expr: {
            $lte: [
              { $add: ['$bookedPlayers', numberOfPersons] },
              '$maxPlayers',
            ],
          },
        },
        {
          $inc: { bookedPlayers: numberOfPersons, version: 1 },
          $push: { bookingIds: bookingId },
        },
        { new: true, session },
      );

      if (!result) {
        // This slot is full or blocked → entire booking fails
        throw new ConflictException(
          `Slot ${slotStart}–${slotEnd} does not have enough capacity for ${numberOfPersons} player(s). ` +
          `Please choose a different time or reduce the number of players.`,
        );
      }

      // Update status color based on new counts
      const newStatus = this.computeStatus(
        result.bookedPlayers,
        result.maxPlayers,
        result.isManuallyBlocked,
      );
      if (result.status !== newStatus) {
        await this.slotModel.updateOne(
          { _id: result._id },
          { $set: { status: newStatus } },
          { session },
        );
      }

      slotIds.push(result._id as Types.ObjectId);
    }

    return slotIds;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  3.  RELEASE SLOTS — Called on booking cancellation
  // ═══════════════════════════════════════════════════════════════════════════════

  async releaseSlots(
    slotIds: Types.ObjectId[],
    numberOfPersons: number,
    bookingId: Types.ObjectId,
    session: ClientSession,
  ): Promise<void> {
    for (const slotId of slotIds) {
      const result = await this.slotModel.findOneAndUpdate(
        { _id: slotId },
        {
          $inc: { bookedPlayers: -numberOfPersons, version: 1 },
          $pull: { bookingIds: bookingId },
        },
        { new: true, session },
      );

      if (result) {
        const newStatus = this.computeStatus(
          result.bookedPlayers,
          result.maxPlayers,
          result.isManuallyBlocked,
        );
        await this.slotModel.updateOne(
          { _id: result._id },
          { $set: { status: newStatus } },
          { session },
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  4.  ENSURE SLOTS EXIST — Lazy slot generation
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Generate blank time-slot documents for a service on a date
   * if they don't already exist. Idempotent.
   */
  async ensureSlotsExist(
    tenantId: string,
    service: ServiceDocument,
    date: Date,
    slotInterval?: number,
  ): Promise<void> {
    const serviceId = service._id as Types.ObjectId;

    const existing = await this.slotModel.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      serviceId,
      date,
    });

    if (existing > 0) return; // Already generated

    const interval = slotInterval || SLOT_SIZE_MINUTES;
    const startTimes = allSlotStartTimes(SLOT_START, SLOT_END, interval);

    const docs = startTimes.map((startTime) => ({
      tenantId: new Types.ObjectId(tenantId),
      serviceId,
      date,
      startTime,
      endTime: minutesToTime(timeToMinutes(startTime) + interval),
      maxPlayers: service.maxTotalPlayers,
      maxDevices: service.numberOfDevices,
      playersPerDevice: service.maxPlayersPerDevice,
      bookedPlayers: 0,
      bookedDevices: 0,
      status: SlotStatus.AVAILABLE,
      version: 0,
      bookingIds: [],
    }));

    // Use ordered:false so duplicates (from concurrent requests) are
    // silently skipped instead of failing the entire batch.
    try {
      await this.slotModel.insertMany(docs, { ordered: false });
    } catch (err: any) {
      // Code 11000 = duplicate key — fine, means concurrent generation
      if (err.code !== 11000 && !err.writeErrors?.every((e: any) => e.err?.code === 11000)) {
        throw err;
      }
    }

    this.logger.debug(
      `Generated ${startTimes.length} slots for service ${serviceId.toString()} on ${date.toISOString().slice(0, 10)}`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  Private helpers
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Check whether a booking of `requiredSlots` consecutive slots starting
   * at `startIndex` can fit `numberOfPersons` into every slot.
   */
  private canStartBookingAt(
    slots: any[],
    startIndex: number,
    requiredSlots: number,
    numberOfPersons: number,
  ): boolean {
    if (startIndex + requiredSlots > slots.length) return false;

    for (let i = startIndex; i < startIndex + requiredSlots; i++) {
      const s = slots[i];
      if (s.isManuallyBlocked) return false;
      if (s.status === SlotStatus.BLOCKED) return false;
      if (s.bookedPlayers + numberOfPersons > s.maxPlayers) return false;
    }
    return true;
  }

  /** GameSpot-style color: green → yellow → red */
  private computeStatus(
    bookedPlayers: number,
    maxPlayers: number,
    isBlocked: boolean,
  ): SlotStatus {
    if (isBlocked) return SlotStatus.BLOCKED;
    if (bookedPlayers <= 0) return SlotStatus.AVAILABLE;
    if (bookedPlayers >= maxPlayers) return SlotStatus.FULL;
    return SlotStatus.FILLING;
  }

  /** Validate the requested duration against service config */
  private validateDuration(service: ServiceDocument, duration: number): void {
    if (service.durationOptions && service.durationOptions.length > 0) {
      const allowed = service.durationOptions.map((o) => o.minutes);
      if (!allowed.includes(duration)) {
        throw new BadRequestException(
          `Duration must be one of: ${allowed.join(', ')} minutes`,
        );
      }
    } else {
      if (duration !== service.defaultDuration) {
        throw new BadRequestException(
          `Duration must be ${service.defaultDuration} minutes for this service`,
        );
      }
    }
  }
}
