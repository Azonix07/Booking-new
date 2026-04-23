import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceDocument = Service & Document;

export enum BookingMode {
  SLOT = 'slot',           // Hourly time-slot booking (gaming, salon, turf)
  DATE_RANGE = 'date-range', // Check-in / check-out booking (rooms, hotels)
}

/**
 * A "Service" = a bookable resource within a tenant.
 *
 * Supports multiple business types:
 *  - Gaming Lounge: slot-based, multi-device, per-player pricing
 *  - Football Turf: slot-based, exclusive booking (1 group per slot)
 *  - Hotel/Room:    date-range, per-night pricing, check-in/check-out
 *  - Salon/Spa:     slot-based, single-person, per-service pricing
 *  - Party Hall:    slot-based or date-range, exclusive
 */
@Schema({ timestamps: true, collection: 'services' })
export class Service {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ trim: true, default: '' })
  category: string;

  // ─── Booking mode ─────────────────────────────────────────────────────────────

  /** How this service is booked: time-slots or date-range (check-in/out) */
  @Prop({ enum: BookingMode, default: BookingMode.SLOT })
  bookingMode: BookingMode;

  /** If true, one booking fills the entire slot (turfs, party halls) */
  @Prop({ default: false })
  isExclusive: boolean;

  // ─── Room / accommodation fields (date-range mode) ────────────────────────────

  /** Number of identical rooms/units available (like numberOfDevices but for rooms) */
  @Prop({ default: 1, min: 1 })
  totalUnits: number;

  /** Room/unit type label */
  @Prop({ trim: true, default: '' })
  unitType: string; // e.g. "Deluxe Room", "Suite", "Dormitory Bed"

  /** Per-night price (used when bookingMode = date-range) */
  @Prop({ default: 0, min: 0 })
  pricePerNight: number;

  /** Standard check-in time */
  @Prop({ default: '14:00' })
  checkInTime: string;

  /** Standard check-out time */
  @Prop({ default: '11:00' })
  checkOutTime: string;

  /** Amenities list */
  @Prop({ type: [String], default: [] })
  amenities: string[];

  // ─── Facility fields (turf, court, studio) ────────────────────────────────────

  /** Type of facility */
  @Prop({ trim: true, default: '' })
  facilityType: string; // e.g. "5-a-side turf", "7-a-side turf", "badminton court"

  /** Surface type (for turfs/courts) */
  @Prop({ trim: true, default: '' })
  surfaceType: string; // e.g. "artificial grass", "natural grass", "wooden"

  // ─── Device / capacity rules ──────────────────────────────────────────────────

  /** Physical device count  (PS5 = 2, VR = 1, DrivingSim = 1) */
  @Prop({ required: true, min: 1, default: 1 })
  numberOfDevices: number;

  /** Max players on ONE device at a time  (PS5 = 4, VR = 1, DrivingSim = 1) */
  @Prop({ required: true, min: 1, default: 1 })
  maxPlayersPerDevice: number;

  /** Computed: numberOfDevices × maxPlayersPerDevice — synced via pre-save */
  @Prop({ required: true, min: 1 })
  maxTotalPlayers: number;

  // ─── Time rules ───────────────────────────────────────────────────────────────

  /** Default session length in minutes */
  @Prop({ required: true, min: 30, default: 60 })
  defaultDuration: number;

  /** Buffer gap after a session in minutes */
  @Prop({ default: 0, min: 0 })
  bufferTime: number;

  /** Duration options the customer chooses from (each with its own price) */
  @Prop({
    type: [
      {
        minutes: { type: Number, required: true },
        label: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    default: [],
  })
  durationOptions: { minutes: number; label: string; price: number }[];

  // ─── Pricing ──────────────────────────────────────────────────────────────────

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  pricePerAdditionalPerson: number;

  @Prop({ default: 'INR' })
  currency: string;

  // ─── Person limits per single booking ─────────────────────────────────────────

  @Prop({ default: 1, min: 1 })
  minPersons: number;

  @Prop({ required: true, min: 1 })
  maxPersons: number;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

ServiceSchema.pre('save', function (next) {
  this.maxTotalPlayers = this.numberOfDevices * this.maxPlayersPerDevice;
  next();
});

ServiceSchema.index({ tenantId: 1, isActive: 1, sortOrder: 1 });
ServiceSchema.index({ tenantId: 1, category: 1 });
