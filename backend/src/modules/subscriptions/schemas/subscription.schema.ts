import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionPlan {
  FREE = 'free',
  STANDARD = 'standard',
  AI = 'ai',
  FULL_SERVICE = 'full_service',
}

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export const PLAN_PRICING: Record<SubscriptionPlan, number | 'custom'> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.STANDARD]: 1500,
  [SubscriptionPlan.AI]: 2500,
  [SubscriptionPlan.FULL_SERVICE]: 'custom',
};

@Schema({ timestamps: true, collection: 'subscriptions' })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: SubscriptionPlan, required: true })
  plan: SubscriptionPlan;

  @Prop({ enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status: SubscriptionStatus;

  @Prop({ type: Date, default: null })
  approvedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy: Types.ObjectId;

  @Prop({ trim: true, default: null })
  rejectionReason: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ tenantId: 1, status: 1 });
SubscriptionSchema.index({ status: 1, createdAt: -1 });
