import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../database/schemas.index';
import { ServiceRequestsService } from './service-requests.service';
import {
  CreateServiceRequestDto,
  AcceptServiceRequestDto,
  UpdateStatusDto,
  RateServiceDto,
} from './dto/service-request.dto';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}

  // ─── Customer endpoints ──────────────────────────────────────────────────────

  /** Customer creates a new on-demand service request */
  @Post()
  @Roles(UserRole.CUSTOMER)
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateServiceRequestDto,
  ) {
    const data = await this.service.createRequest(tenantId, user.userId, dto);
    return { success: true, data };
  }

  /** Customer views their requests */
  @Get('my-requests')
  @Roles(UserRole.CUSTOMER)
  async myRequests(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    const data = await this.service.getCustomerRequests(tenantId, user.userId, status);
    return { success: true, data };
  }

  /** Customer rates a completed request */
  @Patch('rate')
  @Roles(UserRole.CUSTOMER)
  async rate(@CurrentUser() user: any, @Body() dto: RateServiceDto) {
    const data = await this.service.rateService(user.userId, dto);
    return { success: true, data };
  }

  // ─── Provider / Admin endpoints ──────────────────────────────────────────────

  /** Provider/admin views pending requests to accept */
  @Get('pending')
  @Roles(UserRole.CLIENT_ADMIN)
  async pending(@CurrentTenant() tenantId: string) {
    const data = await this.service.getPendingRequests(tenantId);
    return { success: true, data };
  }

  /** Provider/admin accepts a request */
  @Post('accept')
  @Roles(UserRole.CLIENT_ADMIN)
  async accept(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: AcceptServiceRequestDto,
  ) {
    const data = await this.service.acceptRequest(tenantId, user.userId, dto);
    return { success: true, data };
  }

  /** Provider updates request status */
  @Patch('status')
  @Roles(UserRole.CLIENT_ADMIN)
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStatusDto,
  ) {
    const data = await this.service.updateStatus(tenantId, user.userId, dto);
    return { success: true, data };
  }

  /** Provider views their assigned requests */
  @Get('provider-requests')
  @Roles(UserRole.CLIENT_ADMIN)
  async providerRequests(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    const data = await this.service.getProviderRequests(tenantId, user.userId, status);
    return { success: true, data };
  }

  // ─── Shared endpoints ────────────────────────────────────────────────────────

  /** Get a specific request with tracking info */
  @Get(':id')
  async getRequest(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.service.getRequestById(id, user.userId);
    return { success: true, data };
  }

  /** Get tracking session for a request */
  @Get(':id/tracking')
  async getTracking(@Param('id') id: string) {
    const tracking = await this.service.getTrackingSession(id);
    const location = await this.service.getLocationFromCache(id);
    return { success: true, data: { tracking, liveLocation: location } };
  }
}
