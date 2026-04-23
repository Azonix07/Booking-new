import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DomainDocument = Domain & Document;

export enum SslStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  FAILED = 'failed',
}

/**
 * Custom domain mapping for a tenant.
 *
 * Flow:
 *  1. Client adds "mybarbershop.com" → we generate a verificationToken
 *  2. Client adds TXT record: _booking-verify.mybarbershop.com → token
 *  3. Client clicks verify → we DNS-lookup the TXT record
 *  4. Client adds CNAME: mybarbershop.com → proxy.bookingplatform.com
 *  5. SSL certificate provisioned via Cloudflare / Let's Encrypt
 *
 * At runtime:
 *  Request hostname → Redis cache lookup → fallback MongoDB →
 *  resolve tenantId → Next.js middleware rewrites to storefront.
 */
@Schema({
  timestamps: true,
  collection: 'domains',
})
export class Domain {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  domain: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: true })
  verificationToken: string;

  @Prop({
    enum: SslStatus,
    default: SslStatus.PENDING,
  })
  sslStatus: SslStatus;

  /** Cloudflare custom hostname ID (for API management) */
  @Prop({ default: null })
  cloudflareHostnameId: string;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);

// ─── Indexes ────────────────────────────────────────────────────────────────────

// Runtime resolution — domain → tenantId (cached in Redis, this is fallback)
DomainSchema.index({ domain: 1 }, { unique: true });

// Tenant lookup — list domains for a tenant
DomainSchema.index({ tenantId: 1 });
