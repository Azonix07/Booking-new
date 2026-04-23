import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SelectPlanDto, RejectSubscriptionDto } from './dto/subscription.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../users/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  /** POST /subscriptions/select-plan — client_admin selects a plan after setup wizard */
  @Post('select-plan')
  @Roles(UserRole.CLIENT_ADMIN)
  async selectPlan(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SelectPlanDto,
  ) {
    const data = await this.service.selectPlan(
      tenantId,
      user.userId,
      dto.plan,
    );
    return { success: true, data };
  }

  /** GET /subscriptions/current — get current tenant's subscription */
  @Get('current')
  @Roles(UserRole.CLIENT_ADMIN)
  async getCurrent(@CurrentTenant() tenantId: string) {
    const data = await this.service.getByTenant(tenantId);
    return { success: true, data };
  }

  // ─── Super Admin endpoints ────────────────────────────────────────────────

  /** GET /subscriptions/admin/requests — list all subscription requests */
  @Get('admin/requests')
  @Roles(UserRole.SUPER_ADMIN)
  async listRequests(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.listRequests({
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    return { success: true, data: result };
  }

  /** PUT /subscriptions/admin/:id/approve — approve a subscription request */
  @Put('admin/:id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  async approve(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.service.approve(id, user.userId);
    return { success: true, data };
  }

  /** PUT /subscriptions/admin/:id/reject — reject a subscription request */
  @Put('admin/:id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  async reject(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectSubscriptionDto,
  ) {
    const data = await this.service.reject(id, user.userId, dto.reason);
    return { success: true, data };
  }
}
