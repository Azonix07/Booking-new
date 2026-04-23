import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TimeSlot,
  TimeSlotDocument,
  SlotStatus,
} from './schemas/time-slot.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import {
  allSlotStartTimes,
  timeToMinutes,
  minutesToTime,
  SLOT_SIZE_MINUTES,
} from '../../common/utils/slot-generator.util';
import {
  BlockSlotDto,
  BulkBlockSlotsDto,
  GenerateSlotsDto,
} from './dto';

@Injectable()
export class TimeSlotsService {
  private readonly logger = new Logger(TimeSlotsService.name);

  constructor(
    @InjectModel(TimeSlot.name) private slotModel: Model<TimeSlotDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  //  ADMIN — Get slot grid for a service + date
  // ═══════════════════════════════════════════════════════════════════════════════

  async getAdminSlotGrid(
    tenantId: string,
    serviceId: string,
    date: string,
  ) {
    const dateObj = this.parseDate(date);

    // Ensure slots exist
    const service = await this.serviceModel.findOne({
      _id: new Types.ObjectId(serviceId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!service) throw new NotFoundException('Service not found');

    await this.ensureSlotsExist(tenantId, service, dateObj);

    const slots = await this.slotModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        serviceId: new Types.ObjectId(serviceId),
        date: dateObj,
      })
      .sort({ startTime: 1 })
      .populate('bookingIds', 'bookingRef customerId numberOfPersons startTime endTime status')
      .lean();

    return slots.map((slot) => ({
      slotId: (slot._id as Types.ObjectId).toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxPlayers: slot.maxPlayers,
      bookedPlayers: slot.bookedPlayers,
      availablePlayers: Math.max(0, slot.maxPlayers - slot.bookedPlayers),
      status: slot.status,
      isManuallyBlocked: slot.isManuallyBlocked,
      bookings: slot.bookingIds,
      version: slot.version,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  BLOCK a single slot
  // ═══════════════════════════════════════════════════════════════════════════════

  async blockSlot(tenantId: string, dto: BlockSlotDto) {
    const dateObj = this.parseDate(dto.date);

    const slot = await this.slotModel.findOneAndUpdate(
      {
        tenantId: new Types.ObjectId(tenantId),
        serviceId: new Types.ObjectId(dto.serviceId),
        date: dateObj,
        startTime: dto.startTime,
      },
      {
        $set: {
          isManuallyBlocked: true,
          status: SlotStatus.BLOCKED,
        },
      },
      { new: true },
    );

    if (!slot) throw new NotFoundException('Slot not found — generate slots first');
    return slot;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UNBLOCK a single slot
  // ═══════════════════════════════════════════════════════════════════════════════

  async unblockSlot(tenantId: string, dto: BlockSlotDto) {
    const dateObj = this.parseDate(dto.date);

    const slot = await this.slotModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      serviceId: new Types.ObjectId(dto.serviceId),
      date: dateObj,
      startTime: dto.startTime,
    });

    if (!slot) throw new NotFoundException('Slot not found');

    slot.isManuallyBlocked = false;
    // Recompute status from actual booking count
    if (slot.bookedPlayers <= 0) {
      slot.status = SlotStatus.AVAILABLE;
    } else if (slot.bookedPlayers >= slot.maxPlayers) {
      slot.status = SlotStatus.FULL;
    } else {
      slot.status = SlotStatus.FILLING;
    }

    return slot.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  BULK BLOCK / UNBLOCK
  // ═══════════════════════════════════════════════════════════════════════════════

  async bulkBlockSlots(tenantId: string, dto: BulkBlockSlotsDto) {
    const dateObj = this.parseDate(dto.date);
    const results: any[] = [];

    for (const startTime of dto.startTimes) {
      if (dto.block) {
        const slot = await this.slotModel.findOneAndUpdate(
          {
            tenantId: new Types.ObjectId(tenantId),
            serviceId: new Types.ObjectId(dto.serviceId),
            date: dateObj,
            startTime,
          },
          {
            $set: {
              isManuallyBlocked: true,
              status: SlotStatus.BLOCKED,
            },
          },
          { new: true },
        );
        results.push({ startTime, blocked: !!slot });
      } else {
        const itemDto: BlockSlotDto = {
          serviceId: dto.serviceId,
          date: dto.date,
          startTime,
        };
        try {
          await this.unblockSlot(tenantId, itemDto);
          results.push({ startTime, unblocked: true });
        } catch {
          results.push({ startTime, unblocked: false });
        }
      }
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  GENERATE SLOTS — pre-generate for a date range
  // ═══════════════════════════════════════════════════════════════════════════════

  async generateSlots(tenantId: string, dto: GenerateSlotsDto) {
    const service = await this.serviceModel.findOne({
      _id: new Types.ObjectId(dto.serviceId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!service) throw new NotFoundException('Service not found');

    const start = this.parseDate(dto.startDate);
    const end = this.parseDate(dto.endDate);

    if (start > end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Max 90 days at a time
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 90) {
      throw new BadRequestException('Cannot generate more than 90 days at once');
    }

    let totalGenerated = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateObj = new Date(d);
      await this.ensureSlotsExist(tenantId, service, dateObj);
      totalGenerated++;
    }

    return { daysGenerated: totalGenerated };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  WEEKLY OVERVIEW — all service slots for a date range
  // ═══════════════════════════════════════════════════════════════════════════════

  async getWeeklyOverview(
    tenantId: string,
    serviceId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    const slots = await this.slotModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        serviceId: new Types.ObjectId(serviceId),
        date: { $gte: start, $lte: end },
      })
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Group by date
    const grouped: Record<string, any[]> = {};
    for (const slot of slots) {
      const key = slot.date.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
        bookedPlayers: slot.bookedPlayers,
        maxPlayers: slot.maxPlayers,
        isManuallyBlocked: slot.isManuallyBlocked,
      });
    }

    return grouped;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  Helpers
  // ═══════════════════════════════════════════════════════════════════════════════

  private async ensureSlotsExist(
    tenantId: string,
    service: ServiceDocument,
    date: Date,
  ) {
    const serviceId = service._id as Types.ObjectId;
    const existing = await this.slotModel.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      serviceId,
      date,
    });

    if (existing > 0) return;

    const startTimes = allSlotStartTimes();
    const docs = startTimes.map((startTime) => ({
      tenantId: new Types.ObjectId(tenantId),
      serviceId,
      date,
      startTime,
      endTime: minutesToTime(timeToMinutes(startTime) + SLOT_SIZE_MINUTES),
      maxPlayers: service.maxTotalPlayers,
      maxDevices: service.numberOfDevices,
      playersPerDevice: service.maxPlayersPerDevice,
      bookedPlayers: 0,
      bookedDevices: 0,
      status: SlotStatus.AVAILABLE,
      version: 0,
      bookingIds: [],
    }));

    try {
      await this.slotModel.insertMany(docs, { ordered: false });
    } catch (err: any) {
      if (err.code !== 11000 && !err.writeErrors?.every((e: any) => e.err?.code === 11000)) {
        throw err;
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
}
