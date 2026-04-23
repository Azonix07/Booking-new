import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WebsiteConfig,
  WebsiteConfigDocument,
  WebsiteStatus,
  SectionType,
} from './schemas/website-config.schema';
import {
  CreateWebsiteDto,
  WebsiteCreationMode,
  UpdateThemeDto,
  UpdateLayoutDto,
  UpdateSectionsDto,
  UpdateSeoDto,
  UpdateCustomCodeDto,
  UpdateWebsiteConfigDto,
} from './dto';
import {
  generateWebsiteConfig,
  getBusinessTypes,
  getDesignStyles,
} from './ai-website-generator';
import { AiWebsiteService } from './ai-website.service';

// ─── Basic template presets ─────────────────────────────────────────────────────

const BASIC_TEMPLATES: Record<string, () => Partial<WebsiteConfig>> = {
  default: () => ({
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      fontFamily: 'Inter',
      borderRadius: '0.5rem',
      mode: 'light' as const,
    },
    layout: {
      headerStyle: 'left-aligned' as const,
      footerStyle: 'minimal' as const,
      maxWidth: '1280px',
    },
    sections: [
      { type: SectionType.HERO, order: 0, isVisible: true, config: { headline: 'Welcome to Our Booking Platform', subheadline: 'Book your favorite experience in seconds', ctaText: 'Book Now', ctaLink: '#services', backgroundStyle: 'gradient' } },
      { type: SectionType.SERVICES, order: 1, isVisible: true, config: { layout: 'grid', columns: 3, showPrice: true, showDuration: true } },
      { type: SectionType.ABOUT, order: 2, isVisible: true, config: { title: 'About Us', description: '', showImage: true } },
      { type: SectionType.TESTIMONIALS, order: 3, isVisible: true, config: { layout: 'carousel', maxItems: 6 } },
      { type: SectionType.GALLERY, order: 4, isVisible: true, config: { layout: 'masonry', columns: 3, maxImages: 12 } },
      { type: SectionType.CONTACT, order: 5, isVisible: true, config: { showMap: true, showForm: true, showPhone: true, showEmail: true } },
      { type: SectionType.FAQ, order: 6, isVisible: false, config: { items: [] } },
    ],
    seo: { title: '', description: '', ogImage: '', favicon: '' },
    customCSS: '',
    customHeadHTML: '',
  }),
  gaming: () => ({
    theme: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#10b981',
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
      fontFamily: 'Rajdhani',
      borderRadius: '0.75rem',
      mode: 'dark' as const,
    },
    layout: {
      headerStyle: 'transparent' as const,
      footerStyle: 'full' as const,
      maxWidth: '1400px',
    },
    sections: [
      { type: SectionType.HERO, order: 0, isVisible: true, config: { headline: 'Level Up Your Gaming', subheadline: 'PS5, VR, Driving Sims — book your next session', ctaText: 'Book a Session', ctaLink: '#services', backgroundStyle: 'video' } },
      { type: SectionType.SERVICES, order: 1, isVisible: true, config: { layout: 'card', columns: 3, showPrice: true, showDuration: true, showCapacity: true } },
      { type: SectionType.PRICING, order: 2, isVisible: true, config: { layout: 'table', showComparison: true } },
      { type: SectionType.GALLERY, order: 3, isVisible: true, config: { layout: 'masonry', columns: 4, maxImages: 16 } },
      { type: SectionType.TESTIMONIALS, order: 4, isVisible: true, config: { layout: 'grid', maxItems: 6 } },
      { type: SectionType.FAQ, order: 5, isVisible: true, config: { items: [{ q: 'How many players per PS5?', a: 'Up to 4 players per console, 8 total across our 2 consoles.' }] } },
      { type: SectionType.CONTACT, order: 6, isVisible: true, config: { showMap: true, showForm: true } },
    ],
    seo: { title: '', description: '', ogImage: '', favicon: '' },
    customCSS: '',
    customHeadHTML: '',
  }),
  salon: () => ({
    theme: {
      primaryColor: '#ec4899',
      secondaryColor: '#a855f7',
      backgroundColor: '#fdf2f8',
      textColor: '#1f2937',
      fontFamily: 'Playfair Display',
      borderRadius: '1rem',
      mode: 'light' as const,
    },
    layout: {
      headerStyle: 'centered' as const,
      footerStyle: 'minimal' as const,
      maxWidth: '1200px',
    },
    sections: [
      { type: SectionType.HERO, order: 0, isVisible: true, config: { headline: 'Beauty & Wellness', subheadline: 'Book your appointment today', ctaText: 'View Services', ctaLink: '#services', backgroundStyle: 'image' } },
      { type: SectionType.SERVICES, order: 1, isVisible: true, config: { layout: 'list', showPrice: true, showDuration: true } },
      { type: SectionType.TEAM, order: 2, isVisible: true, config: { layout: 'grid', columns: 4 } },
      { type: SectionType.GALLERY, order: 3, isVisible: true, config: { layout: 'grid', columns: 3, maxImages: 9 } },
      { type: SectionType.TESTIMONIALS, order: 4, isVisible: true, config: { layout: 'carousel', maxItems: 8 } },
      { type: SectionType.CONTACT, order: 5, isVisible: true, config: { showMap: true, showForm: true, showPhone: true } },
    ],
    seo: { title: '', description: '', ogImage: '', favicon: '' },
    customCSS: '',
    customHeadHTML: '',
  }),
};

@Injectable()
export class WebsiteConfigService {
  private readonly logger = new Logger(WebsiteConfigService.name);

  constructor(
    @InjectModel(WebsiteConfig.name)
    private configModel: Model<WebsiteConfigDocument>,
    private aiWebsiteService: AiWebsiteService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  //  CREATE WEBSITE — basic template or AI generated
  // ═══════════════════════════════════════════════════════════════════════════════

  async createWebsite(
    tenantId: string,
    dto: CreateWebsiteDto,
  ): Promise<WebsiteConfigDocument> {
    // Check if config already exists
    const existing = await this.configModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
    });

    if (existing) {
      throw new BadRequestException(
        'Website already exists. Use the update endpoints to modify it.',
      );
    }

    let websiteData: Partial<WebsiteConfig>;

    if (dto.mode === WebsiteCreationMode.BASIC_TEMPLATE) {
      const templateName = dto.templateName || 'default';
      const templateFn = BASIC_TEMPLATES[templateName];
      if (!templateFn) {
        throw new BadRequestException(
          `Unknown template: ${templateName}. Available: ${Object.keys(BASIC_TEMPLATES).join(', ')}`,
        );
      }
      websiteData = templateFn();
    } else {
      // AI_GENERATED — try Claude Haiku first, fall back to template
      if (
        !dto.prompt &&
        !dto.businessType &&
        !dto.designStyle
      ) {
        throw new BadRequestException(
          'AI-generated websites require at least a business type, design style, or prompt',
        );
      }
      const aiResult = await this.aiWebsiteService.generateWebsiteConfigWithAI(
        dto.businessType,
        dto.designStyle,
        dto.prompt,
      );
      websiteData = aiResult.config;
      this.logger.log(`Website generated via ${aiResult.source}`);
    }

    const config = await this.configModel.create({
      tenantId: new Types.ObjectId(tenantId),
      prompt: dto.prompt || '',
      ...websiteData,
      status: WebsiteStatus.PUBLISHED,
      generationCount: dto.mode === WebsiteCreationMode.AI_GENERATED ? 1 : 0,
    });

    this.logger.log(
      `Website created for tenant ${tenantId} (mode: ${dto.mode})`,
    );

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  REGENERATE WITH AI — bump generation count, rewrite from prompt
  // ═══════════════════════════════════════════════════════════════════════════════

  async regenerateWithAI(
    tenantId: string,
    prompt: string,
    businessType?: string,
    designStyle?: string,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    const aiResult = await this.aiWebsiteService.generateWebsiteConfigWithAI(
      businessType,
      designStyle,
      prompt,
    );

    Object.assign(config, aiResult.config);
    config.prompt = prompt || '';
    config.generationCount += 1;

    await config.save();

    this.logger.log(
      `Website regenerated for tenant ${tenantId} (gen #${config.generationCount})`,
    );

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  GET CONFIG — public (for storefront) + admin
  // ═══════════════════════════════════════════════════════════════════════════════

  async getConfig(tenantId: string): Promise<WebsiteConfigDocument> {
    const config = await this.configModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!config) {
      throw new NotFoundException('Website not configured yet');
    }

    return config;
  }

  async getPublishedConfig(tenantId: string): Promise<WebsiteConfigDocument> {
    const config = await this.configModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      status: WebsiteStatus.PUBLISHED,
    });

    if (!config) {
      throw new NotFoundException('No published website found');
    }

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE THEME
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateTheme(
    tenantId: string,
    dto: UpdateThemeDto,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    config.theme = { ...config.theme, ...dto };
    await config.save();

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateLayout(
    tenantId: string,
    dto: UpdateLayoutDto,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    config.layout = { ...config.layout, ...dto };
    await config.save();

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE SECTIONS — full replace (the frontend sends the complete array)
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateSections(
    tenantId: string,
    dto: UpdateSectionsDto,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    config.sections = dto.sections.map((s) => ({
      type: s.type as SectionType,
      order: s.order,
      isVisible: s.isVisible,
      config: s.config || {},
    }));

    await config.save();

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE SEO
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateSeo(
    tenantId: string,
    dto: UpdateSeoDto,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    config.seo = { ...config.seo, ...dto };
    await config.save();

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  UPDATE CUSTOM CODE
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateCustomCode(
    tenantId: string,
    dto: UpdateCustomCodeDto,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    if (dto.customCSS !== undefined) config.customCSS = dto.customCSS;
    if (dto.customHeadHTML !== undefined) config.customHeadHTML = dto.customHeadHTML;
    await config.save();

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  FULL UPDATE (all at once)
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateFull(
    tenantId: string,
    dto: UpdateWebsiteConfigDto,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    if (dto.theme) config.theme = { ...config.theme, ...dto.theme };
    if (dto.layout) config.layout = { ...config.layout, ...dto.layout };
    if (dto.sections) {
      config.sections = dto.sections.map((s) => ({
        type: s.type as SectionType,
        order: s.order,
        isVisible: s.isVisible,
        config: s.config || {},
      }));
    }
    if (dto.seo) config.seo = { ...config.seo, ...dto.seo };
    if (dto.customCSS !== undefined) config.customCSS = dto.customCSS;
    if (dto.customHeadHTML !== undefined) config.customHeadHTML = dto.customHeadHTML;

    await config.save();

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  PUBLISH / UNPUBLISH
  // ═══════════════════════════════════════════════════════════════════════════════

  async setStatus(
    tenantId: string,
    status: WebsiteStatus,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    config.status = status;
    await config.save();

    this.logger.log(`Website ${status} for tenant ${tenantId}`);

    return config;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  LIST TEMPLATES — so frontend can show template picker
  // ═══════════════════════════════════════════════════════════════════════════════

  getAvailableTemplates(): { name: string; description: string }[] {
    return [
      { name: 'default', description: 'Clean, professional layout suitable for any business' },
      { name: 'gaming', description: 'Dark theme with vibrant accents — perfect for gaming lounges' },
      { name: 'salon', description: 'Elegant, feminine design for beauty & wellness businesses' },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  AI Generation — business types & design styles
  // ═══════════════════════════════════════════════════════════════════════════════

  getAvailableBusinessTypes() {
    return getBusinessTypes();
  }

  getAvailableDesignStyles() {
    return getDesignStyles();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  //  AI SECTION EDIT — edit a single section or theme/layout via AI prompt
  // ═══════════════════════════════════════════════════════════════════════════════

  async aiEditSection(
    tenantId: string,
    target: string,
    sectionIndex: number | undefined,
    prompt: string,
  ): Promise<WebsiteConfigDocument> {
    const config = await this.getConfig(tenantId);

    const result = await this.aiWebsiteService.editSectionWithAI(
      config,
      target,
      sectionIndex,
      prompt,
    );

    if (target === 'theme' && result.theme) {
      config.theme = { ...config.theme, ...result.theme };
    } else if (target === 'layout' && result.layout) {
      config.layout = { ...config.layout, ...result.layout };
    } else if (target === 'section' && sectionIndex !== undefined && result.sectionConfig) {
      if (sectionIndex >= 0 && sectionIndex < config.sections.length) {
        config.sections[sectionIndex].config = {
          ...config.sections[sectionIndex].config,
          ...result.sectionConfig,
        };
      }
    }

    config.markModified('sections');
    config.markModified('theme');
    config.markModified('layout');
    await config.save();

    this.logger.log(`AI edited ${target} for tenant ${tenantId}`);
    return config;
  }
}
