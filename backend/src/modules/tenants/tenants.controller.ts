import {
  Body,
  Controller,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import {
  UpdateShopDetailsDto,
  UpdateAddressDto,
  UpdateLocationDto,
  UpdateBrandingDto,
  UpdateBusinessHoursDto,
  UpdateShopSettingsDto,
  UpdatePublishDto,
} from './dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('shop')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ─── Public: storefront reads shop info ────────────────────────────────────

  /** GET /shop/public — public-facing shop profile for storefront */
  @Public()
  @Get('public')
  async getPublicProfile(@CurrentTenant() tenantId: string) {
    const tenant = await this.tenantsService.getTenantPublic(tenantId);
    return { success: true, data: tenant };
  }

  /** GET /shop/by-slug/:slug — resolve tenant by slug (booking page) */
  @Public()
  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const tenant = await this.tenantsService.findBySlug(slug);
    return { success: true, data: tenant };
  }

  // ─── Admin: full shop management ───────────────────────────────────────────

  /** GET /shop — full tenant data for admin dashboard */
  @Get()
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async getShop(@CurrentTenant() tenantId: string) {
    const tenant = await this.tenantsService.getTenant(tenantId);
    return { success: true, data: tenant };
  }

  /** GET /shop/overview — condensed dashboard overview */
  @Get('overview')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async getOverview(@CurrentTenant() tenantId: string) {
    const data = await this.tenantsService.getDashboardOverview(tenantId);
    return { success: true, data };
  }

  /** PUT /shop/details — update name, description, category, tags */
  @Put('details')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateDetails(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateShopDetailsDto,
  ) {
    const tenant = await this.tenantsService.updateShopDetails(tenantId, dto);
    return { success: true, data: tenant };
  }

  /** PUT /shop/address — update physical address */
  @Put('address')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateAddress(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const tenant = await this.tenantsService.updateAddress(tenantId, dto);
    return { success: true, data: tenant };
  }

  /** PUT /shop/location — update GPS coordinates */
  @Put('location')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateLocation(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    const tenant = await this.tenantsService.updateLocation(tenantId, dto);
    return { success: true, data: tenant };
  }

  /** PUT /shop/branding — update logo, cover, colors */
  @Put('branding')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateBranding(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateBrandingDto,
  ) {
    const tenant = await this.tenantsService.updateBranding(tenantId, dto);
    return { success: true, data: tenant };
  }

  /** PUT /shop/hours — update all 7 days of operating hours */
  @Put('hours')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateBusinessHours(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateBusinessHoursDto,
  ) {
    const tenant = await this.tenantsService.updateBusinessHours(tenantId, dto);
    return { success: true, data: tenant };
  }

  /** PUT /shop/settings — update slot interval, cancellation policy, etc. */
  @Put('settings')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateShopSettingsDto,
  ) {
    const tenant = await this.tenantsService.updateShopSettings(tenantId, dto);
    return { success: true, data: tenant };
  }

  /** PUT /shop/publish — publish or unpublish the storefront */
  @Put('publish')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async setPublish(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdatePublishDto,
  ) {
    const tenant = await this.tenantsService.setPublished(tenantId, dto.isPublished);
    return {
      success: true,
      message: dto.isPublished ? 'Storefront published' : 'Storefront unpublished',
      data: tenant,
    };
  }
}
