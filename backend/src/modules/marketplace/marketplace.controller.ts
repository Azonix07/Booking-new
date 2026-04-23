import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { NearbySearchDto, BrowseByCategoryDto, ResolveStorefrontDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Customer-facing marketplace — all endpoints are public.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  User Flow                                                    │
 * │                                                                │
 * │  1. App detects user location (browser geolocation API)        │
 * │  2. GET /marketplace/nearby?lng=...&lat=...&category=...       │
 * │     → Returns nearby businesses sorted by distance             │
 * │  3. User clicks a business card                                │
 * │  4. GET /marketplace/storefront?slug=gamespot-cafe             │
 * │     → Full storefront: tenant, services, reviews               │
 * │     → If business has custom domain, frontend redirects        │
 * │  5. User opens booking page for that business inside platform  │
 * └──────────────────────────────────────────────────────────────┘
 */
@Controller('marketplace')
@Public()
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ─── Nearby search (location-based) ───────────────────────────────────────

  /**
   * GET /marketplace/nearby?longitude=77.5946&latitude=12.9716&radiusKm=25&category=gaming-lounge
   *
   * Primary discovery endpoint. Frontend sends user's detected GPS coordinates.
   * Returns businesses sorted by proximity with distance attached.
   */
  @Get('nearby')
  async searchNearby(@Query() query: NearbySearchDto): Promise<{ success: boolean; data: any }> {
    const result = await this.marketplaceService.searchNearby(query);
    return { success: true, data: result };
  }

  // ─── Browse by category ───────────────────────────────────────────────────

  /**
   * GET /marketplace/browse?category=salon&city=Bangalore&sortBy=rating
   *
   * Fallback when location is unavailable or user is browsing a specific category.
   */
  @Get('browse')
  async browseByCategory(@Query() query: BrowseByCategoryDto) {
    const result = await this.marketplaceService.browseByCategory(query);
    return { success: true, data: result };
  }

  // ─── Categories list ──────────────────────────────────────────────────────

  /**
   * GET /marketplace/categories
   *
   * Returns all active categories with business counts.
   * Used for the category filter chips / sidebar.
   */
  @Get('categories')
  async listCategories() {
    const categories = await this.marketplaceService.listCategories();
    return { success: true, data: categories };
  }

  // ─── Featured / top-rated ─────────────────────────────────────────────────

  /**
   * GET /marketplace/featured?limit=12
   *
   * Top-rated businesses for the homepage hero section.
   */
  @Get('featured')
  async getFeatured(@Query('limit') limit?: string) {
    const businesses = await this.marketplaceService.getFeatured(
      limit ? parseInt(limit, 10) : 12,
    );
    return { success: true, data: businesses };
  }

  // ─── Search autocomplete ──────────────────────────────────────────────────

  /**
   * GET /marketplace/search?q=game&limit=8
   *
   * Fast autocomplete for the search bar — returns name, slug, category.
   */
  @Get('search')
  async searchAutocomplete(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const results = await this.marketplaceService.searchAutocomplete(
      q,
      limit ? parseInt(limit, 10) : 8,
    );
    return { success: true, data: results };
  }

  // ─── Resolve storefront (slug or custom domain) ───────────────────────────

  /**
   * GET /marketplace/storefront?slug=gamespot-cafe
   * GET /marketplace/storefront?domain=mybarbershop.com
   *
   * Full storefront resolution. Returns:
   *  - Tenant profile
   *  - Services list
   *  - Recent reviews
   *  - Custom domain redirect info
   *
   * If the business has a verified custom domain and the user accessed
   * via slug, `shouldRedirect: true` + `redirectUrl` are returned so
   * the frontend can navigate to the custom domain.
   */
  @Get('storefront')
  async resolveStorefront(@Query() query: ResolveStorefrontDto) {
    const data = await this.marketplaceService.resolveStorefront(
      query.slug,
      query.domain,
    );
    return { success: true, data };
  }

  // ─── Single business detail ───────────────────────────────────────────────

  /**
   * GET /marketplace/business/:slugOrId
   *
   * Business profile + services preview. Used for the business card detail page.
   */
  @Get('business/:slugOrId')
  async getBusinessDetail(@Param('slugOrId') slugOrId: string) {
    const data = await this.marketplaceService.getBusinessDetail(slugOrId);
    return { success: true, data };
  }
}
