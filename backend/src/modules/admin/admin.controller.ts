import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('admin')
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Platform Stats ──────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    const data = await this.adminService.getPlatformStats();
    return { success: true, data };
  }

  // ─── Recent Activity ─────────────────────────────────────────────────────────

  @Get('activity')
  async getActivity() {
    const data = await this.adminService.getRecentActivity();
    return { success: true, data };
  }

  // ─── Users ────────────────────────────────────────────────────────────────────

  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.adminService.listUsers({
      search,
      role,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    return { success: true, data: result };
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string): Promise<any> {
    const data = await this.adminService.getUserDetail(id);
    return { success: true, data };
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean },
  ) {
    const data = await this.adminService.updateUser(id, body);
    return { success: true, data };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const data = await this.adminService.deleteUser(id);
    return { success: true, ...data };
  }

  // ─── Tenants ──────────────────────────────────────────────────────────────────

  @Get('tenants')
  async listTenants(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.adminService.listTenants({
      search,
      status,
      plan,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    return { success: true, data: result };
  }

  @Get('tenants/:id')
  async getTenantDetail(@Param('id') id: string): Promise<any> {
    const data = await this.adminService.getTenantDetail(id);
    return { success: true, data };
  }

  @Put('tenants/:id')
  async updateTenant(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      category?: string;
      status?: string;
      plan?: string;
      isPublished?: boolean;
      description?: string;
    },
  ) {
    const data = await this.adminService.updateTenant(id, body);
    return { success: true, data };
  }

  @Put('tenants/:id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const data = await this.adminService.updateTenantStatus(id, body.status);
    return { success: true, data };
  }

  @Delete('tenants/:id')
  async deleteTenant(@Param('id') id: string) {
    const data = await this.adminService.deleteTenant(id);
    return { success: true, ...data };
  }
}
