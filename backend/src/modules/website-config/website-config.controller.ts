import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { WebsiteConfigService } from './website-config.service';
import {
  CreateWebsiteDto,
  UpdateThemeDto,
  UpdateLayoutDto,
  UpdateSectionsDto,
  UpdateSeoDto,
  UpdateCustomCodeDto,
  UpdateWebsiteConfigDto,
  UpdateWebsiteStatusDto,
} from './dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { SubscriptionPlan } from '../subscriptions/schemas/subscription.schema';
import { WebsiteStatus } from './schemas/website-config.schema';

@Controller('website')
export class WebsiteConfigController {
  constructor(private readonly websiteService: WebsiteConfigService) {}

  // ─── Public: storefront reads the published config ─────────────────────────

  /** GET /website/public — rendered by Next.js storefront */
  @Public()
  @Get('public')
  async getPublished(@CurrentTenant() tenantId: string) {
    const config = await this.websiteService.getPublishedConfig(tenantId);
    return { success: true, data: config };
  }

  /** GET /website/templates — list available templates (public) */
  @Public()
  @Get('templates')
  getTemplates() {
    return { success: true, data: this.websiteService.getAvailableTemplates() };
  }

  /** GET /website/business-types — list available business types for AI builder */
  @Public()
  @Get('business-types')
  getBusinessTypes() {
    return { success: true, data: this.websiteService.getAvailableBusinessTypes() };
  }

  /** GET /website/design-styles — list available design styles for AI builder */
  @Public()
  @Get('design-styles')
  getDesignStyles() {
    return { success: true, data: this.websiteService.getAvailableDesignStyles() };
  }

  // ─── Admin: full website management ────────────────────────────────────────

  /** POST /website — create website (basic template or AI) */
  @Post()
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createWebsite(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateWebsiteDto,
  ) {
    const config = await this.websiteService.createWebsite(tenantId, dto);
    return { success: true, message: 'Website created', data: config };
  }

  /** POST /website/regenerate — regenerate website from AI prompt */
  @Post('regenerate')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlan(SubscriptionPlan.AI, SubscriptionPlan.FULL_SERVICE)
  async regenerate(
    @CurrentTenant() tenantId: string,
    @Body('prompt') prompt: string,
    @Body('businessType') businessType?: string,
    @Body('designStyle') designStyle?: string,
  ) {
    const config = await this.websiteService.regenerateWithAI(
      tenantId,
      prompt,
      businessType,
      designStyle,
    );
    return { success: true, message: 'Website regenerated', data: config };
  }

  /** POST /website/ai-edit — AI-powered edit of a specific section/theme/layout */
  @Post('ai-edit')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlan(SubscriptionPlan.AI, SubscriptionPlan.FULL_SERVICE)
  async aiEditSection(
    @CurrentTenant() tenantId: string,
    @Body('target') target: string,
    @Body('sectionIndex') sectionIndex?: number,
    @Body('prompt') prompt?: string,
  ) {
    if (!prompt) {
      throw new BadRequestException('Prompt is required');
    }
    try {
      const config = await this.websiteService.aiEditSection(
        tenantId,
        target,
        sectionIndex,
        prompt,
      );
      return { success: true, message: 'AI edit applied', data: config };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'AI edit failed. Please try again.',
      );
    }
  }

  /** GET /website — admin reads current config (draft or published) */
  @Get()
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async getConfig(@CurrentTenant() tenantId: string) {
    const config = await this.websiteService.getConfig(tenantId);
    return { success: true, data: config };
  }

  /** PUT /website — full config update */
  @Put()
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlan(
    SubscriptionPlan.STANDARD,
    SubscriptionPlan.AI,
    SubscriptionPlan.FULL_SERVICE,
  )
  async updateFull(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateWebsiteConfigDto,
  ) {
    const config = await this.websiteService.updateFull(tenantId, dto);
    return { success: true, data: config };
  }

  /** PUT /website/theme — update theme only */
  @Put('theme')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlan(
    SubscriptionPlan.STANDARD,
    SubscriptionPlan.AI,
    SubscriptionPlan.FULL_SERVICE,
  )
  async updateTheme(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateThemeDto,
  ) {
    const config = await this.websiteService.updateTheme(tenantId, dto);
    return { success: true, data: config };
  }

  /** PUT /website/layout — update layout only */
  @Put('layout')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlan(
    SubscriptionPlan.STANDARD,
    SubscriptionPlan.AI,
    SubscriptionPlan.FULL_SERVICE,
  )
  async updateLayout(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateLayoutDto,
  ) {
    const config = await this.websiteService.updateLayout(tenantId, dto);
    return { success: true, data: config };
  }

  /** PUT /website/sections — replace sections array */
  @Put('sections')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlan(
    SubscriptionPlan.STANDARD,
    SubscriptionPlan.AI,
    SubscriptionPlan.FULL_SERVICE,
  )
  async updateSections(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateSectionsDto,
  ) {
    const config = await this.websiteService.updateSections(tenantId, dto);
    return { success: true, data: config };
  }

  /** PUT /website/seo — update SEO settings */
  @Put('seo')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async updateSeo(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateSeoDto,
  ) {
    const config = await this.websiteService.updateSeo(tenantId, dto);
    return { success: true, data: config };
  }

  /** PUT /website/custom-code — update CSS / head HTML injection */
  @Put('custom-code')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlan(
    SubscriptionPlan.STANDARD,
    SubscriptionPlan.AI,
    SubscriptionPlan.FULL_SERVICE,
  )
  async updateCustomCode(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateCustomCodeDto,
  ) {
    const config = await this.websiteService.updateCustomCode(tenantId, dto);
    return { success: true, data: config };
  }

  /** PUT /website/status — publish or unpublish */
  @Put('status')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async setStatus(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateWebsiteStatusDto,
  ) {
    const status = dto.status === 'published' ? WebsiteStatus.PUBLISHED : WebsiteStatus.DRAFT;
    const config = await this.websiteService.setStatus(tenantId, status);
    return { success: true, message: `Website ${dto.status}`, data: config };
  }
}
