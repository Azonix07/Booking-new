import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../modules/bookings/bookings.service';

/**
 * Scheduled tasks that run periodically.
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Every 5 minutes: expire pending bookings that haven't been paid within 15 minutes.
   * Releases held slot capacity back to the pool.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleBookings() {
    try {
      const expired = await this.bookingsService.expirePendingBookings(15);
      if (expired > 0) {
        this.logger.log(`Expired ${expired} stale pending booking(s)`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to expire pending bookings: ${err.message}`);
    }
  }
}
