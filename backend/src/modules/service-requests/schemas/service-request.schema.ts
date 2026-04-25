import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceRequestDocument = ServiceRequest & Document;

export enum ServiceRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ON_THE_WAY = 'on_the_way',
  ARRIVED = 'arrived',
  WORKING = 'working',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ServiceCategory {
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  CARPENTER = 'carpenter',
  WELDER = 'welder',
  PAINTER = 'painter',
  AC_REPAIR = 'ac_repair',
  CLEANING = 'cleaning',
  APPLIANCE_REPAIR = 'appliance_repair',
  OTHER = 'other',
}

@Schema({ timestamps: true, collection: 'service_requests' })
export class ServiceRequest {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  providerId: Types.ObjectId | null;

  @Prop({ enum: ServiceCategory, required: true })
  category: ServiceCategory;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ enum: ServiceRequestStatus, default: ServiceRequestStatus.PENDING, index: true })
  status: ServiceRequestStatus;

  // Customer location
  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  customerLocation: { type: string; coordinates: number[] };

  @Prop({ default: '' })
  customerAddress: string;

  // Provider live location (updated during tracking)
  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  providerLocation: { type: string; coordinates: number[] };

  // Pricing
  @Prop({ default: 0, min: 0 })
  estimatedAmount: number;

  @Prop({ default: 0, min: 0 })
  finalAmount: number;

  @Prop({ default: 'INR' })
  currency: string;

  // Timing
  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  @Prop({ type: Date, default: null })
  arrivedAt: Date | null;

  @Prop({ type: Date, default: null })
  workStartedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  // ETA in minutes
  @Prop({ default: null })
  etaMinutes: number | null;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: null })
  customerRating: number | null;

  @Prop({ default: '' })
  customerReview: string;

  // Auto-generated reference
  @Prop({ unique: true })
  requestRef: string;
}

export const ServiceRequestSchema = SchemaFactory.createForClass(ServiceRequest);

// 2dsphere index for geospatial queries
ServiceRequestSchema.index({ customerLocation: '2dsphere' });
ServiceRequestSchema.index({ providerLocation: '2dsphere' });
ServiceRequestSchema.index({ tenantId: 1, status: 1 });
ServiceRequestSchema.index({ providerId: 1, status: 1 });
ServiceRequestSchema.index({ customerId: 1, createdAt: -1 });

// Auto-generate requestRef
ServiceRequestSchema.pre('save', function (next) {
  if (!this.requestRef) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = 'SR-';
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    this.requestRef = ref;
  }
  next();
});
