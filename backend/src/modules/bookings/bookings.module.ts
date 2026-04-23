import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { TimeSlot, TimeSlotSchema } from '../time-slots/schemas/time-slot.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SlotEngineService } from './slot-engine.service';
import { RedisLockService } from '../../redis/redis-lock.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: TimeSlot.name, schema: TimeSlotSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, SlotEngineService, RedisLockService],
  exports: [BookingsService, SlotEngineService],
})
export class BookingsModule {}
