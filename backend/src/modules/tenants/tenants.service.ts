import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument, TenantStatus } from './schemas/tenant.schema';
import {
  UpdateShopDetailsDto,
  UpdateAddressDto,
  UpdateLocationDto,
  UpdateBrandingDto,
  UpdateBusinessHoursDto,
  UpdateShopSettingsDto,
} from './dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  //  GET TENANT (admin view — full details)
  // ═══════════════════════════════════════════════════════════════════════════════

  async getTenant(tenantId: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel.findById(
      new Types.ObjectId(tenantId),
    );
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async getTenantPublic(tenantId: string) {
    const tenant = await this.tenantModel
      .findOne({
        _id: new Types.ObjectId(tenantId),
        status: TenantStatus.ACTIVE,
        isPublished: true,
      })
      .select('-paymentAccountId -shopSettings.cancellationPolicy')
      .lean();

    if (!tenant) throw new NotFoundException('Business not found');
    return tenant;
  }

  /**
   * Find tenant by slug — for the booking page.
   * Does NOT require isPublished/active so owners can test their booking page during setup.
   */
  async findBySlug(slug: string) {
    const tenant = await this.tenantModel
      .findOne({ slug: slug.toLowerCase() })
      .select('-paymentAccountId')
      .lean();

    if (!tenant) throw new NotFoundException('Business not found');
    return tenant;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE SHOP DETAILS (name, description, category, tags)
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateShopDetails(
    tenantId: string,
    dto: UpdateShopDetailsDto,
  ): Promise<TenantDocument> {
    const tenant = await this.getTenant(tenantId);

    if (dto.name !== undefined) tenant.name = dto.name;
    if (dto.description !== undefined) tenant.description = dto.description;
    if (dto.category !== undefined) tenant.category = dto.category;
    if (dto.tags !== undefined) tenant.tags = dto.tags;

    return tenant.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE ADDRESS
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateAddress(
    tenantId: string,
    dto: UpdateAddressDto,
  ): Promise<TenantDocument> {
    const tenant = await this.getTenant(tenantId);

    tenant.address = { ...tenant.address, ...dto };
    return tenant.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE LOCATION (lng, lat)
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateLocation(
    tenantId: string,
    dto: UpdateLocationDto,
  ): Promise<TenantDocument> {
    const tenant = await this.getTenant(tenantId);

    tenant.location = {
      type: 'Point',
      coordinates: [dto.longitude, dto.latitude],
    };
    return tenant.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE BRANDING (logo, cover, colors)
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateBranding(
    tenantId: string,
    dto: UpdateBrandingDto,
  ): Promise<TenantDocument> {
    const tenant = await this.getTenant(tenantId);

    tenant.branding = { ...tenant.branding, ...dto };
    return tenant.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE BUSINESS HOURS (all 7 days at once)
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateBusinessHours(
    tenantId: string,
    dto: UpdateBusinessHoursDto,
  ): Promise<TenantDocument> {
    const tenant = await this.getTenant(tenantId);

    tenant.businessHours = dto.businessHours;
    return tenant.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE SHOP / BOOKING SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateShopSettings(
    tenantId: string,
    dto: UpdateShopSettingsDto,
  ): Promise<TenantDocument> {
    const tenant = await this.getTenant(tenantId);

    tenant.shopSettings = {
      ...tenant.shopSettings,
      ...dto,
    } as any;
    tenant.markModified('shopSettings');
    return tenant.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  PUBLISH / UNPUBLISH + ACTIVATE
  // ═══════════════════════════════════════════════════════════════════════════════

  async setPublished(
    tenantId: string,
    isPublished: boolean,
  ): Promise<TenantDocument> {
    const tenant = await this.getTenant(tenantId);

    tenant.isPublished = isPublished;

    // If publishing for the first time, also activate the tenant
    if (isPublished && tenant.status === TenantStatus.PENDING_SETUP) {
      tenant.status = TenantStatus.ACTIVE;
    }

    return tenant.save();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  DASHBOARD STATS
  // ═══════════════════════════════════════════════════════════════════════════════

  async getDashboardOverview(tenantId: string) {
    const tenant = await this.getTenant(tenantId);

    return {
      name: tenant.name,
      slug: tenant.slug,
      category: tenant.category,
      plan: tenant.plan,
      status: tenant.status,
      isPublished: tenant.isPublished,
      rating: tenant.rating,
      businessHours: tenant.businessHours,
      shopSettings: tenant.shopSettings,
    };
  }
}
