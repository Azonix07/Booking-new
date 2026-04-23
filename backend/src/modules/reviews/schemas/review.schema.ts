import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

/**
 * Customer review for a completed booking.
 *
 * ─── Constraints ────────────────────────────────────────────────────
 *  • One review per booking (bookingId unique index)
 *  • Only bookings with status "completed" can be reviewed
 *  • Aggregate rating on Tenant document is updated via a post-save hook
 */
@Schema({
  timestamps: true,
  collection: 'reviews',
})
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, default: '' })
  comment: string;

  // ─── Business reply ───────────────────────────────────────────────────────────

  @Prop(
    raw({
      text: { type: String, default: null },
      repliedAt: { type: Date, default: null },
    }),
  )
  reply: { text: string | null; repliedAt: Date | null };

  @Prop({ default: true })
  isVisible: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// ─── Indexes ────────────────────────────────────────────────────────────────────

// One review per booking
ReviewSchema.index({ bookingId: 1 }, { unique: true });

// List reviews for a tenant (storefront page)
ReviewSchema.index({ tenantId: 1, isVisible: 1, createdAt: -1 });

// List reviews for a specific service
ReviewSchema.index({ tenantId: 1, serviceId: 1, createdAt: -1 });

// My reviews
ReviewSchema.index({ customerId: 1, createdAt: -1 });
