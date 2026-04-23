import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument, TenantStatus } from '../tenants/schemas/tenant.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { Domain, DomainDocument } from '../domains/schemas/domain.schema';
import { NearbySearchDto, BrowseByCategoryDto } from './dto';

/** Fields exposed in marketplace listings — no sensitive data */
const LISTING_PROJECTION = {
  name: 1,
  slug: 1,
  description: 1,
  category: 1,
  location: 1,
  address: 1,
  branding: 1,
  businessHours: 1,
  rating: 1,
  tags: 1,
  customDomain: 1,
  plan: 1,
};

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Domain.name) private domainModel: Model<DomainDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  //  NEARBY SEARCH — geospatial $near query
  // ═══════════════════════════════════════════════════════════════════════════════

  async searchNearby(dto: NearbySearchDto): Promise<{
    businesses: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    searchParams: { longitude: number; latitude: number; radiusKm: number; category: string | null };
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;
    const radiusMeters = (dto.radiusKm || 25) * 1000;

    // Base filter: published + active
    const filter: any = {
      isPublished: true,
      status: TenantStatus.ACTIVE,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [dto.longitude, dto.latitude],
          },
          $maxDistance: radiusMeters,
        },
      },
    };

    // Category filter
    if (dto.category) {
      filter.category = dto.category;
    }

    // Rating filter
    if (dto.minRating) {
      filter['rating.average'] = { $gte: dto.minRating };
    }

    // Text search — name, description, tags
    if (dto.search) {
      const regex = { $regex: dto.search, $options: 'i' };
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    // $near does not allow countDocuments with the same filter,
    // so we run a parallel geoNear aggregation for the total count.
    const [businesses, countResult] = await Promise.all([
      this.tenantModel
        .find(filter, LISTING_PROJECTION)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.tenantModel.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [dto.longitude, dto.latitude],
            },
            distanceField: 'distance',
            maxDistance: radiusMeters,
            query: this.buildGeoNearMatchFilter(dto),
            spherical: true,
          },
        },
        { $count: 'total' },
      ]),
    ]);

    const total = countResult[0]?.total || businesses.length;

    // Compute distance for each result
    const results = businesses.map((b) => ({
      ...b,
      distanceKm: this.haversineKm(
        dto.latitude,
        dto.longitude,
        b.location?.coordinates?.[1] || 0,
        b.location?.coordinates?.[0] || 0,
      ),
    }));

    return {
      businesses: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      searchParams: {
        longitude: dto.longitude,
        latitude: dto.latitude,
        radiusKm: dto.radiusKm || 25,
        category: dto.category || null,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  BROWSE BY CATEGORY — for users without location / browsing categories
  // ═══════════════════════════════════════════════════════════════════════════════

  async browseByCategory(dto: BrowseByCategoryDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {
      isPublished: true,
      status: TenantStatus.ACTIVE,
      category: dto.category,
    };

    if (dto.city) {
      filter['address.city'] = { $regex: dto.city, $options: 'i' };
    }

    if (dto.minRating) {
      filter['rating.average'] = { $gte: dto.minRating };
    }

    if (dto.search) {
      const regex = { $regex: dto.search, $options: 'i' };
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    // Sort
    let sort: any = { 'rating.average': -1 }; // default: best rated
    if (dto.sortBy === 'name') sort = { name: 1 };
    if (dto.sortBy === 'newest') sort = { createdAt: -1 };

    const [businesses, total] = await Promise.all([
      this.tenantModel
        .find(filter, LISTING_PROJECTION)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.tenantModel.countDocuments(filter),
    ]);

    return {
      businesses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  LIST CATEGORIES — distinct categories with counts
  // ═══════════════════════════════════════════════════════════════════════════════

  async listCategories() {
    return this.tenantModel.aggregate([
      { $match: { isPublished: true, status: TenantStatus.ACTIVE } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          avgRating: { $round: ['$avgRating', 1] },
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  FEATURED / TRENDING — top-rated or most-booked
  // ═══════════════════════════════════════════════════════════════════════════════

  async getFeatured(limit: number = 12) {
    // First try top-rated businesses
    const rated = await this.tenantModel
      .find(
        {
          isPublished: true,
          status: TenantStatus.ACTIVE,
          'rating.count': { $gte: 1 },
        },
        LISTING_PROJECTION,
      )
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(limit)
      .lean();

    // If not enough rated businesses, backfill with newest active ones
    if (rated.length < limit) {
      const ratedIds = rated.map((r) => r._id);
      const newest = await this.tenantModel
        .find(
          {
            isPublished: true,
            status: TenantStatus.ACTIVE,
            _id: { $nin: ratedIds },
          },
          LISTING_PROJECTION,
        )
        .sort({ createdAt: -1 })
        .limit(limit - rated.length)
        .lean();
      return [...rated, ...newest];
    }

    return rated;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  RESOLVE STOREFRONT — by slug or custom domain
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Returns full storefront data for a business:
   *  - Tenant profile (name, branding, hours, address)
   *  - Active services list
   *  - Recent reviews
   *  - Custom domain redirect info
   *
   * The frontend calls this when a user clicks a business card
   * or navigates via slug/domain.
   */
  async resolveStorefront(slug?: string, domain?: string) {
    let tenant: any;

    if (domain) {
      // Resolve via custom domain → Domain doc → Tenant
      const domainDoc = await this.domainModel.findOne({
        domain: domain.toLowerCase(),
        isVerified: true,
      }).lean();

      if (domainDoc) {
        tenant = await this.tenantModel
          .findOne({
            _id: domainDoc.tenantId,
            isPublished: true,
            status: TenantStatus.ACTIVE,
          })
          .select('-paymentAccountId')
          .lean();
      }
    }

    if (!tenant && slug) {
      tenant = await this.tenantModel
        .findOne({
          slug: slug.toLowerCase(),
          isPublished: true,
          status: TenantStatus.ACTIVE,
        })
        .select('-paymentAccountId')
        .lean();
    }

    if (!tenant) {
      throw new NotFoundException('Business not found or not published');
    }

    // Fetch services + recent reviews in parallel
    const tenantId = tenant._id as Types.ObjectId;

    const [services, reviews, domainDoc] = await Promise.all([
      this.serviceModel
        .find({ tenantId, isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      this.reviewModel
        .find({ tenantId, isVisible: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customerId', 'name avatar')
        .populate('serviceId', 'name')
        .lean(),
      this.domainModel
        .findOne({ tenantId, isVerified: true })
        .lean(),
    ]);

    return {
      tenant,
      services,
      reviews,
      customDomain: domainDoc?.domain || null,
      /** If business has a verified custom domain, the frontend should
       *  redirect to it (or offer a link). */
      shouldRedirect: !!domainDoc?.domain && !domain,
      redirectUrl: domainDoc?.domain ? `https://${domainDoc.domain}` : null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  GET BUSINESS DETAIL — lightweight (used for preview cards)
  // ═══════════════════════════════════════════════════════════════════════════════

  async getBusinessDetail(slugOrId: string) {
    let tenant: any;

    // Try by slug first
    tenant = await this.tenantModel
      .findOne({
        slug: slugOrId.toLowerCase(),
        isPublished: true,
        status: TenantStatus.ACTIVE,
      })
      .select('-paymentAccountId')
      .lean();

    // Fall back to ObjectId
    if (!tenant && Types.ObjectId.isValid(slugOrId)) {
      tenant = await this.tenantModel
        .findOne({
          _id: new Types.ObjectId(slugOrId),
          isPublished: true,
          status: TenantStatus.ACTIVE,
        })
        .select('-paymentAccountId')
        .lean();
    }

    if (!tenant) {
      throw new NotFoundException('Business not found');
    }

    const tenantId = tenant._id as Types.ObjectId;

    const [services, reviewCount] = await Promise.all([
      this.serviceModel
        .find({ tenantId, isActive: true })
        .select('name category price images defaultDuration')
        .sort({ sortOrder: 1 })
        .lean(),
      this.reviewModel.countDocuments({ tenantId, isVisible: true }),
    ]);

    return {
      ...tenant,
      services,
      reviewCount,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  SEARCH AUTOCOMPLETE — fast name/tag search for the search bar
  // ═══════════════════════════════════════════════════════════════════════════════

  async searchAutocomplete(query: string, limit: number = 8) {
    if (!query || query.length < 2) return [];

    const regex = { $regex: query, $options: 'i' };

    return this.tenantModel
      .find(
        {
          isPublished: true,
          status: TenantStatus.ACTIVE,
          $or: [{ name: regex }, { tags: regex }, { category: regex }],
        },
        { name: 1, slug: 1, category: 1, 'branding.logo': 1, 'address.city': 1 },
      )
      .limit(limit)
      .lean();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  Private helpers
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Build the `query` portion for $geoNear (which doesn't support $near).
   * Used for the count aggregation.
   */
  private buildGeoNearMatchFilter(dto: NearbySearchDto): Record<string, any> {
    const filter: any = {
      isPublished: true,
      status: TenantStatus.ACTIVE,
    };

    if (dto.category) filter.category = dto.category;
    if (dto.minRating) filter['rating.average'] = { $gte: dto.minRating };
    if (dto.search) {
      const regex = { $regex: dto.search, $options: 'i' };
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    return filter;
  }

  /** Haversine formula — distance between two (lat,lng) points in km */
  private haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
