import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebsiteConfigDocument = WebsiteConfig & Document;

export enum WebsiteStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export enum SectionType {
  HERO = 'hero',
  SERVICES = 'services',
  ABOUT = 'about',
  TESTIMONIALS = 'testimonials',
  GALLERY = 'gallery',
  CONTACT = 'contact',
  FAQ = 'faq',
  PRICING = 'pricing',
  TEAM = 'team',
  CTA = 'cta',
  CUSTOM = 'custom',
}

/**
 * Stores the AI-generated (and manually editable) website configuration
 * for a tenant's public storefront.
 *
 * The Next.js frontend reads this config and renders the storefront
 * dynamically using a template engine that maps SectionType → React component.
 *
 * One tenant → one WebsiteConfig (enforced by unique tenantId index).
 */
@Schema({
  timestamps: true,
  collection: 'website_configs',
})
export class WebsiteConfig {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, unique: true })
  tenantId: Types.ObjectId;

  /** The original user prompt that generated this config */
  @Prop({ default: '' })
  prompt: string;

  // ─── Theme ────────────────────────────────────────────────────────────────────

  @Prop(
    raw({
      primaryColor: { type: String, default: '#6366f1' },
      secondaryColor: { type: String, default: '#f59e0b' },
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#111827' },
      fontFamily: { type: String, default: 'Inter' },
      borderRadius: { type: String, default: '0.5rem' },
      mode: { type: String, enum: ['light', 'dark'], default: 'light' },
    }),
  )
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: string;
    mode: 'light' | 'dark';
  };

  // ─── Layout ───────────────────────────────────────────────────────────────────

  @Prop(
    raw({
      headerStyle: {
        type: String,
        enum: ['centered', 'left-aligned', 'transparent'],
        default: 'left-aligned',
      },
      footerStyle: {
        type: String,
        enum: ['minimal', 'full', 'none'],
        default: 'minimal',
      },
      maxWidth: { type: String, default: '1280px' },
    }),
  )
  layout: {
    headerStyle: 'centered' | 'left-aligned' | 'transparent';
    footerStyle: 'minimal' | 'full' | 'none';
    maxWidth: string;
  };

  // ─── Sections (ordered array) ─────────────────────────────────────────────────

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: Object.values(SectionType),
          required: true,
        },
        order: { type: Number, required: true },
        isVisible: { type: Boolean, default: true },
        config: { type: Object, default: {} }, // section-specific JSON
      },
    ],
    default: [],
  })
  sections: {
    type: SectionType;
    order: number;
    isVisible: boolean;
    config: Record<string, any>;
  }[];

  // ─── SEO ──────────────────────────────────────────────────────────────────────

  @Prop(
    raw({
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      favicon: { type: String, default: '' },
    }),
  )
  seo: {
    title: string;
    description: string;
    ogImage: string;
    favicon: string;
  };

  // ─── Custom code injection ────────────────────────────────────────────────────

  @Prop({ default: '' })
  customCSS: string;

  @Prop({ default: '' })
  customHeadHTML: string;

  @Prop({
    enum: WebsiteStatus,
    default: WebsiteStatus.DRAFT,
  })
  status: WebsiteStatus;

  /** Number of times the AI has regenerated this config */
  @Prop({ default: 0 })
  generationCount: number;
}

export const WebsiteConfigSchema =
  SchemaFactory.createForClass(WebsiteConfig);

// ─── Indexes ────────────────────────────────────────────────────────────────────

// One config per tenant (also the primary lookup)
WebsiteConfigSchema.index({ tenantId: 1 }, { unique: true });
