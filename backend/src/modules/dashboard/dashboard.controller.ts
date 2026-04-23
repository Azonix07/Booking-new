import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardStatsQueryDto, DashboardPeriod, BookingsFilterDto } from './dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('dashboard')
@Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** GET /dashboard/stats?period=today|week|month — key metrics cards */
  @Get('stats')
  async getStats(
    @CurrentTenant() tenantId: string,
    @Query() query: DashboardStatsQueryDto,
  ) {
    const stats = await this.dashboardService.getStats(
      tenantId,
      query.period || DashboardPeriod.TODAY,
    );
    return { success: true, data: stats };
  }

  /** GET /dashboard/bookings?startDate=...&endDate=...&serviceId=...&status=...&page=1&limit=20 */
  @Get('bookings')
  async getBookings(
    @CurrentTenant() tenantId: string,
    @Query() filter: BookingsFilterDto,
  ) {
    const result = await this.dashboardService.getBookings(tenantId, filter);
    return { success: true, data: result };
  }

  /** GET /dashboard/recent?count=10 — latest bookings */
  @Get('recent')
  async getRecent(
    @CurrentTenant() tenantId: string,
    @Query('count') count?: string,
  ) {
    const bookings = await this.dashboardService.getRecentBookings(
      tenantId,
      count ? parseInt(count, 10) : 10,
    );
    return { success: true, data: bookings };
  }

  /** GET /dashboard/revenue-by-service?period=month — per-service revenue */
  @Get('revenue-by-service')
  async getRevenueByService(
    @CurrentTenant() tenantId: string,
    @Query('period') period?: DashboardPeriod,
  ) {
    const data = await this.dashboardService.getRevenueByService(
      tenantId,
      period || DashboardPeriod.MONTH,
    );
    return { success: true, data };
  }

  /** GET /dashboard/trend?days=30 — daily booking trend for charts */
  @Get('trend')
  async getDailyTrend(
    @CurrentTenant() tenantId: string,
    @Query('days') days?: string,
  ) {
    const data = await this.dashboardService.getDailyTrend(
      tenantId,
      days ? parseInt(days, 10) : 30,
    );
    return { success: true, data };
  }
}
