import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FullServiceService } from './full-service.service';
import {
  AssignFullServiceDto,
  CreateFullServiceRequestDto,
  UpdateFullServiceStatusDto,
} from './dto/full-service.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../users/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { FullServiceRequestStatus } from './schemas/full-service-request.schema';

@Controller('full-service-requests')
export class FullServiceController {
  constructor(private readonly service: FullServiceService) {}

  /**
   * POST /full-service-requests
   * Public — any visitor (logged-in or not) can submit a full-service request.
   * If logged in, the request is linked to the user / tenant.
   */
  @Public()
  @Post()
  async create(
    @Body() dto: CreateFullServiceRequestDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const data = await this.service.create(dto, {
      userId: user?.userId ?? null,
      tenantId: user?.tenantId ?? null,
    });
    return {
      success: true,
      message:
        'Your full-service request has been submitted. Our team will contact you shortly.',
      data: { id: data._id, status: data.status },
    };
  }

  /** GET /full-service-requests/mine — logged-in user's own requests */
  @Get('mine')
  async mine(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.service.findByUser(user.userId);
    return { success: true, data };
  }

  /** GET /full-service-requests/mine/:id — single request status lookup */
  @Get('mine/:id')
  async mineOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.service.findOneForUser(id, user.userId);
    return { success: true, data };
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  /** GET /full-service-requests/admin — list & filter all requests */
  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN)
  async adminList(
    @Query('status') status?: FullServiceRequestStatus,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.adminList({
      status,
      assignedTo,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
    return { success: true, data: result };
  }

  /** GET /full-service-requests/admin/:id — detail */
  @Get('admin/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async adminGet(@Param('id', ParseObjectIdPipe) id: string) {
    const data = await this.service.adminGet(id);
    return { success: true, data };
  }

  /** PUT /full-service-requests/admin/:id/status — update workflow status */
  @Put('admin/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  async adminUpdateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateFullServiceStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.service.updateStatus(id, dto, user.userId);
    return { success: true, message: `Status updated to ${dto.status}`, data };
  }

  /** PUT /full-service-requests/admin/:id/assign — assign to a developer/admin */
  @Put('admin/:id/assign')
  @Roles(UserRole.SUPER_ADMIN)
  async adminAssign(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: AssignFullServiceDto,
  ) {
    const data = await this.service.assign(id, dto.assigneeId);
    return { success: true, data };
  }
}
