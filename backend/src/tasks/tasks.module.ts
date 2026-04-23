import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { BookingsModule } from '../modules/bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  providers: [TasksService],
})
export class TasksModule {}
