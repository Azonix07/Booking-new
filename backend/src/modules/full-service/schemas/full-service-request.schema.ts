import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FullServiceRequestDocument = FullServiceRequest & Document;

/**
 * Status workflow for Full-Service website requests.
 * PENDING       → just submitted, admin hasn't looked yet
 * CONTACTED     → admin/developer has reached out to the business owner
 * IN_PROGRESS   → build underway
 * COMPLETED     → site delivered, domain configured, handover done
 * CANCELLED     → request withdrawn or rejected
 */
export enum FullServiceRequestStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
export class FullServiceContact {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;
}

@Schema({ timestamps: true, collection: 'full_service_requests' })
export class FullServiceRequest {
  /** Optional: if the requester already has a tenant (e.g. upgrading from another plan) */
  @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null, index: true })
  tenantId: Types.ObjectId | null;

  /** The user who submitted — may be null if submitted from the public marketing page */
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  requestedBy: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  businessName: string;

  @Prop({ required: true, trim: true })
  businessType: string;

  @Prop({ required: true, trim: true })
  businessDescription: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ trim: true, default: '' })
  designPreferences: string;

  @Prop({ trim: true, default: '' })
  targetAudience: string;

  @Prop({ trim: true, default: '' })
  existingWebsite: string;

  @Prop({ type: Number, default: null })
  budget: number | null;

  @Prop({ trim: true, default: '' })
  timeline: string;

  @Prop({ trim: true, default: '' })
  additionalNotes: string;

  @Prop({ type: FullServiceContact, required: true })
  contact: FullServiceContact;

  @Prop({
    enum: FullServiceRequestStatus,
    default: FullServiceRequestStatus.PENDING,
    index: true,
  })
  status: FullServiceRequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo: Types.ObjectId | null;

  @Prop({ trim: true, default: '' })
  adminNotes: string;

  @Prop({ type: Date, default: null })
  contactedAt: Date | null;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  /** Final deliverable — custom domain the site was deployed to */
  @Prop({ trim: true, default: '' })
  deliveredDomain: string;

  /** If the completed site is also listed back on the platform (free listing) */
  @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
  listedTenantId: Types.ObjectId | null;
}

export const FullServiceRequestSchema = SchemaFactory.createForClass(
  FullServiceRequest,
);

FullServiceRequestSchema.index({ status: 1, createdAt: -1 });
FullServiceRequestSchema.index({ assignedTo: 1, status: 1 });
