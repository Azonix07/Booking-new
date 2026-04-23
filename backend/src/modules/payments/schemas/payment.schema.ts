import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  CASH = 'cash', // walk-in / pay-at-counter
}

/**
 * Payment record linked 1:1 with a Booking.
 *
 * ─── Relationships ─────────────────────────────────────────────────
 *  Payment → Tenant    (tenantId)
 *  Payment → Booking   (bookingId)
 *  Payment → Customer  (customerId)
 *
 * ─── Integrity ─────────────────────────────────────────────────────
 *  • providerPaymentId is unique — prevents duplicate processing of
 *    the same payment event (webhook idempotency).
 *  • bookingId is unique — one payment per booking.
 */
@Schema({
  timestamps: true,
  collection: 'payments',
})
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({
    required: true,
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  /** ID from Stripe / Razorpay (e.g. pi_xxx or pay_xxx) */
  @Prop({ default: null })
  providerPaymentId: string;

  /** Provider order/session ID (Razorpay order_xxx, Stripe cs_xxx) */
  @Prop({ default: null })
  providerOrderId: string;

  @Prop({
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // ─── Refund tracking ──────────────────────────────────────────────────────────

  @Prop({ default: null })
  refundId: string;

  @Prop({ default: 0, min: 0 })
  refundAmount: number;

  @Prop({ default: null })
  refundReason: string;

  @Prop({ default: null, type: Date })
  refundedAt: Date;

  // ─── Platform fee (for split payments) ────────────────────────────────────────

  @Prop(
    raw({
      platformFee: { type: Number, default: 0 },
      tenantPayout: { type: Number, default: 0 },
    }),
  )
  splitDetails: {
    platformFee: number;
    tenantPayout: number;
  };

  /** Raw webhook payload for audit trail */
  @Prop({ type: Object, default: null, select: false })
  webhookPayload: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// ─── Indexes ────────────────────────────────────────────────────────────────────

// Tenant dashboard — payments list with status filter
PaymentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

// Webhook idempotency — prevent double processing
PaymentSchema.index(
  { providerPaymentId: 1 },
  { unique: true, sparse: true },
);

// 1:1 with booking
PaymentSchema.index({ bookingId: 1 }, { unique: true });

// Customer payment history
PaymentSchema.index({ customerId: 1, createdAt: -1 });
