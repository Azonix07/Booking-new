import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TimeSlotsService } from './time-slots.service';
import {
  AdminSlotsQueryDto,
  BlockSlotDto,
  BulkBlockSlotsDto,
  GenerateSlotsDto,
} from './dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('slots')
@Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
export class TimeSlotsController {
  constructor(private readonly slotsService: TimeSlotsService) {}

  /** GET /slots/admin?serviceId=...&date=2026-03-20 — detailed slot grid */
  @Get('admin')
  async getSlotGrid(
    @CurrentTenant() tenantId: string,
    @Query() query: AdminSlotsQueryDto,
  ) {
    const slots = await this.slotsService.getAdminSlotGrid(
      tenantId,
      query.serviceId,
      query.date,
    );
    return { success: true, data: slots };
  }

  /** GET /slots/admin/weekly?serviceId=...&startDate=...&endDate=... — weekly overview */
  @Get('admin/weekly')
  async getWeekly(
    @CurrentTenant() tenantId: string,
    @Query('serviceId') serviceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const data = await this.slotsService.getWeeklyOverview(
      tenantId,
      serviceId,
      startDate,
      endDate,
    );
    return { success: true, data };
  }

  /** PUT /slots/block — block a single slot */
  @Put('block')
  async blockSlot(
    @CurrentTenant() tenantId: string,
    @Body() dto: BlockSlotDto,
  ) {
    const slot = await this.slotsService.blockSlot(tenantId, dto);
    return { success: true, message: 'Slot blocked', data: slot };
  }

  /** PUT /slots/unblock — unblock a single slot */
  @Put('unblock')
  async unblockSlot(
    @CurrentTenant() tenantId: string,
    @Body() dto: BlockSlotDto,
  ) {
    const slot = await this.slotsService.unblockSlot(tenantId, dto);
    return { success: true, message: 'Slot unblocked', data: slot };
  }

  /** PUT /slots/bulk — block or unblock multiple slots at once */
  @Put('bulk')
  async bulkBlock(
    @CurrentTenant() tenantId: string,
    @Body() dto: BulkBlockSlotsDto,
  ) {
    const results = await this.slotsService.bulkBlockSlots(tenantId, dto);
    return { success: true, data: results };
  }

  /** POST /slots/generate — pre-generate slots for a date range */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateSlots(
    @CurrentTenant() tenantId: string,
    @Body() dto: GenerateSlotsDto,
  ) {
    const result = await this.slotsService.generateSlots(tenantId, dto);
    return {
      success: true,
      message: `Slots generated for ${result.daysGenerated} day(s)`,
      data: result,
    };
  }
}
