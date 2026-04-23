import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, ReorderServicesDto } from './dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ─── Public — storefront ──────────────────────────────────────────────────

  /** GET /services — list all active services for the tenant (public storefront) */
  @Public()
  @Get()
  async listServices(@CurrentTenant() tenantId: string) {
    const services = await this.servicesService.findAllByTenant(tenantId);
    return { success: true, data: services };
  }

  /** GET /services/:id — single service detail */
  @Public()
  @Get(':id')
  async getService(
    @CurrentTenant() tenantId: string,
    @Param('id') serviceId: string,
  ) {
    const service = await this.servicesService.findById(tenantId, serviceId);
    return { success: true, data: service };
  }

  // ─── Admin — full CRUD ────────────────────────────────────────────────────

  /** GET /services/admin/all — list ALL services including inactive (admin) */
  @Get('admin/all')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async listAllForAdmin(@CurrentTenant() tenantId: string) {
    const services = await this.servicesService.findAllForAdmin(tenantId);
    return { success: true, data: services };
  }

  /** POST /services — create new service/device */
  @Post()
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createService(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateServiceDto,
  ) {
    const service = await this.servicesService.create(tenantId, dto);
    return { success: true, message: 'Service created', data: service };
  }

  /** PUT /services/:id — update service/device */
  @Put(':id')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateService(
    @CurrentTenant() tenantId: string,
    @Param('id') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const service = await this.servicesService.update(tenantId, serviceId, dto);
    return { success: true, data: service };
  }

  /** DELETE /services/:id — soft delete (deactivate) */
  @Delete(':id')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async deleteService(
    @CurrentTenant() tenantId: string,
    @Param('id') serviceId: string,
  ) {
    const service = await this.servicesService.softDelete(tenantId, serviceId);
    return { success: true, message: 'Service deactivated', data: service };
  }

  /** PUT /services/admin/reorder — reorder services */
  @Put('admin/reorder')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async reorderServices(
    @CurrentTenant() tenantId: string,
    @Body() dto: ReorderServicesDto,
  ) {
    await this.servicesService.reorder(tenantId, dto);
    return { success: true, message: 'Services reordered' };
  }
}
