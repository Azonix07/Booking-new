import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

export enum TenantPlan {
  FREE = 'free',
  STANDARD = 'standard',
  AI = 'ai',
  FULL_SERVICE = 'full_service',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_SETUP = 'pending_setup',
}

// ─── Sub-document types ─────────────────────────────────────────────────────────

export class BusinessHoursEntry {
  day: number;        // 0 = Sunday … 6 = Saturday
  open: string;       // "10:00"
  close: string;      // "22:00"
  isClosed: boolean;
}

export class ShopSettings {
  slotInterval: number;          // minutes — granularity of calendar grid (e.g. 30)
  minBookingNotice: number;      // minutes — how far in advance required
  maxAdvanceBooking: number;     // days — how far ahead customers can book
  allowWalkIns: boolean;
  requirePaymentUpfront: boolean;
  cancellationPolicy: string;    // free text
  cancellationWindowHours: number;
  currency: string;              // "INR", "USD"
  timezone: string;              // "Asia/Kolkata"
}

@Schema({
  timestamps: true,
  collection: 'tenants',
})
export class Tenant {
  /**
   * Self-referencing tenantId — equals _id.
   * Stored explicitly so every document across every collection
   * has a consistent tenantId field for the TenantInterceptor.
   */
  @Prop({ type: Types.ObjectId, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
  })
  slug: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  category: string; // "gaming-lounge", "salon", "clinic", etc.

  // ─── Location (GeoJSON Point for $near queries) ─────────────────────────────

  @Prop(
    raw({
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    }),
  )
  location: { type: string; coordinates: [number, number] };

  @Prop(
    raw({
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    }),
  )
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  // ─── Branding ─────────────────────────────────────────────────────────────────

  @Prop(
    raw({
      logo: { type: String },
      coverImage: { type: String },
      primaryColor: { type: String, default: '#6366f1' },
      secondaryColor: { type: String, default: '#f59e0b' },
    }),
  )
  branding: {
    logo: string;
    coverImage: string;
    primaryColor: string;
    secondaryColor: string;
  };

  // ─── Operating hours ──────────────────────────────────────────────────────────

  @Prop({
    type: [
      {
        day: { type: Number, min: 0, max: 6 },
        open: { type: String },
        close: { type: String },
        isClosed: { type: Boolean, default: false },
      },
    ],
    default: () =>
      Array.from({ length: 7 }, (_, i) => ({
        day: i,
        open: '10:00',
        close: '22:00',
        isClosed: i === 0, // Sunday closed by default
      })),
  })
  businessHours: BusinessHoursEntry[];

  // ─── Shop-level settings ──────────────────────────────────────────────────────

  @Prop(
    raw({
      slotInterval: { type: Number, default: 30 },
      minBookingNotice: { type: Number, default: 60 },
      maxAdvanceBooking: { type: Number, default: 30 },
      allowWalkIns: { type: Boolean, default: false },
      requirePaymentUpfront: { type: Boolean, default: true },
      cancellationPolicy: { type: String, default: '' },
      cancellationWindowHours: { type: Number, default: 24 },
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    }),
  )
  shopSettings: ShopSettings;

  // ─── Aggregated rating (denormalized from reviews) ────────────────────────────

  @Prop(
    raw({
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    }),
  )
  rating: { average: number; count: number };

  @Prop({ type: String, default: undefined })
  customDomain: string;

  @Prop({
    enum: TenantPlan,
    default: TenantPlan.FREE,
  })
  plan: TenantPlan;

  @Prop({
    enum: TenantStatus,
    default: TenantStatus.PENDING_SETUP,
  })
  status: TenantStatus;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  /** Stripe/Razorpay connected account ID — needed for split payments */
  @Prop({ default: null })
  paymentAccountId: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// ─── Indexes ────────────────────────────────────────────────────────────────────

// Unique slug for URL routing
TenantSchema.index({ slug: 1 }, { unique: true });

// Geospatial — marketplace "nearby" searches
TenantSchema.index({ location: '2dsphere' });

// Marketplace browse by category
TenantSchema.index({ category: 1, isPublished: 1 });

// Owner lookup
TenantSchema.index({ ownerId: 1 });

// Custom domain resolution (sparse — most tenants won't have one)
TenantSchema.index({ customDomain: 1 }, { unique: true, sparse: true });

// ─── Pre-save: sync tenantId = _id ─────────────────────────────────────────────

TenantSchema.pre('save', function (next) {
  if (this.isNew) {
    this.tenantId = this._id;
  }
  next();
});
