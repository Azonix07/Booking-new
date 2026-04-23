import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, GetAvailabilityDto, GetDateRangeAvailabilityDto, CancelBookingDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../users/schemas/user.schema';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ─── Slot availability (public — storefront) ───────────────────────────────

  /**
   * GET /bookings/availability?serviceId=...&date=2026-03-20&duration=120&numberOfPersons=3
   *
   * Returns the full slot grid for a service on a date, with:
   *   - status colors (green / yellow / red)
   *   - available player count per slot
   *   - canBook flag per slot (considering duration + persons)
   */
  @Public()
  @Get('availability')
  async getAvailability(
    @CurrentTenant() tenantId: string,
    @Query() query: GetAvailabilityDto,
  ) {
    const slots = await this.bookingsService.getAvailability(
      tenantId,
      query.serviceId,
      query.date,
      query.duration,
      query.numberOfPersons,
    );

    return {
      success: true,
      data: {
        date: query.date,
        serviceId: query.serviceId,
        duration: query.duration,
        numberOfPersons: query.numberOfPersons,
        slots,
      },
    };
  }

  // ─── Date-range availability (public — rooms/hotels) ────────────────────────

  /**
   * GET /bookings/date-availability?serviceId=...&startDate=2026-03-20&endDate=2026-03-25
   *
   * Returns per-day availability (total units, booked units, available)
   * for date-range based services (hotels, rooms, resorts).
   */
  @Public()
  @Get('date-availability')
  async getDateRangeAvailability(
    @CurrentTenant() tenantId: string,
    @Query() query: GetDateRangeAvailabilityDto,
  ) {
    const availability = await this.bookingsService.getDateRangeAvailability(
      tenantId,
      query.serviceId,
      query.startDate,
      query.endDate,
    );

    return {
      success: true,
      data: {
        serviceId: query.serviceId,
        startDate: query.startDate,
        endDate: query.endDate,
        availability,
      },
    };
  }

  // ─── Create booking (authenticated customer) ──────────────────────────────

  /**
   * POST /bookings
   *
   * Creates a booking with the customer's selected date, time, duration,
   * and number of players. Blocks the required consecutive slots atomically.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    const booking = await this.bookingsService.createBooking(
      tenantId,
      user,
      dto,
    );

    return {
      success: true,
      message: 'Booking created — proceed to payment',
      data: booking,
    };
  }

  // ─── Cancel booking ───────────────────────────────────────────────────────

  /**
   * PUT /bookings/:id/cancel
   *
   * Cancels a booking and releases all occupied slots.
   */
  @Put(':id/cancel')
  async cancelBooking(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseObjectIdPipe) bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    const booking = await this.bookingsService.cancelBooking(
      tenantId,
      bookingId,
      user,
      dto,
    );

    return {
      success: true,
      message: 'Booking cancelled',
      data: booking,
    };
  }

  // ─── Get single booking ───────────────────────────────────────────────────

  @Get(':id')
  async getBooking(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseObjectIdPipe) bookingId: string,
  ) {
    const booking = await this.bookingsService.getBookingById(
      tenantId,
      bookingId,
    );

    return { success: true, data: booking };
  }

  // ─── List bookings by date (client admin dashboard) ───────────────────────

  @Get('date/:date')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async getBookingsByDate(
    @CurrentTenant() tenantId: string,
    @Param('date') date: string,
  ) {
    const bookings = await this.bookingsService.getBookingsByDate(
      tenantId,
      date,
    );

    return { success: true, data: bookings };
  }

  // ─── My bookings (customer) ───────────────────────────────────────────────

  @Get('my/list')
  async getMyBookings(@CurrentUser() user: AuthenticatedUser) {
    const bookings = await this.bookingsService.getMyBookings(user.userId);
    return { success: true, data: bookings };
  }
}
