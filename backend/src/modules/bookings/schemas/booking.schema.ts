import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  REFUNDED = 'refunded',
}

/**
 * A booking record.
 *
 * Stores the customer's SELECTED date + time + duration (not current time).
 *
 * Example: Customer books PS5 — 3 players — 2 hours — starting 14:00
 *   → date           = 2026-03-20
 *   → startTime      = "14:00"
 *   → endTime        = "16:00"
 *   → duration       = 120
 *   → numberOfPersons= 3
 *   → slotIds        = [ slot_14-15._id, slot_15-16._id ]
 *
 * The slotIds array is critical: it links this booking to the exact
 * TimeSlot documents whose counters were decremented, enabling clean
 * cancellation rollback.
 */
@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  // ─── Selected date & time ─────────────────────────────────────────────────────

  /** Booking mode — mirrors the service's mode at time of booking */
  @Prop({ default: 'slot' })
  bookingMode: string;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ default: '' })
  startTime: string;

  @Prop({ default: '' })
  endTime: string;

  @Prop({ default: 0, min: 0 })
  duration: number;

  // ─── Date-range fields (rooms / accommodation) ────────────────────────────────

  @Prop({ type: Date, default: null })
  checkInDate: Date;

  @Prop({ type: Date, default: null })
  checkOutDate: Date;

  @Prop({ default: 0 })
  numberOfNights: number;

  // ─── Players & slots ──────────────────────────────────────────────────────────

  @Prop({ required: true, min: 1 })
  numberOfPersons: number;

  /** Number of rooms/units booked (date-range mode) */
  @Prop({ default: 1, min: 1 })
  numberOfUnits: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TimeSlot' }], default: [] })
  slotIds: Types.ObjectId[];

  // ─── Status ───────────────────────────────────────────────────────────────────

  @Prop({ enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status: BookingStatus;

  // ─── Pricing ──────────────────────────────────────────────────────────────────

  @Prop({ type: Types.ObjectId, ref: 'Payment', default: null })
  paymentId: Types.ObjectId | null;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: 'INR' })
  currency: string;

  // ─── Meta ─────────────────────────────────────────────────────────────────────

  @Prop({ trim: true, default: '' })
  customerNotes: string;

  @Prop({ trim: true, default: '' })
  adminNotes: string;

  @Prop({ default: null })
  cancellationReason: string;

  @Prop({ default: null, type: Date })
  cancelledAt: Date;

  @Prop({ unique: true })
  bookingRef: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index(
  { tenantId: 1, serviceId: 1, date: 1, startTime: 1, customerId: 1 },
  { unique: true, partialFilterExpression: { status: { $nin: ['cancelled', 'refunded'] } } },
);
BookingSchema.index({ tenantId: 1, date: 1, status: 1 });
BookingSchema.index({ customerId: 1, date: -1 });
BookingSchema.index({ bookingRef: 1 }, { unique: true });
BookingSchema.index({ paymentId: 1 }, { sparse: true });

BookingSchema.pre('save', function (next) {
  if (this.isNew && !this.bookingRef) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = 'BK-';
    for (let i = 0; i < 6; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bookingRef = ref;
  }
  next();
});
