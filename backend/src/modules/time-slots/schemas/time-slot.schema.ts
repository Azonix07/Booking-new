import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimeSlotDocument = TimeSlot & Document;

export enum SlotStatus {
  AVAILABLE = 'available', // 🟢 Green  — plenty of room
  FILLING = 'filling',     // 🟡 Yellow — partially booked (> 0 but not full)
  FULL = 'full',           // 🔴 Red    — zero capacity left
  BLOCKED = 'blocked',     // ⚫ Grey   — manually blocked by admin
}

/**
 * One materialised time-slot — one document per (service × date × hour).
 *
 * Slot grid: 10:00–11:00, 11:00–12:00, … 21:00–22:00  (12 slots/day).
 *
 * ─── Capacity model ────────────────────────────────────────────────────
 *  maxPlayers      = service.maxTotalPlayers  (PS5: 8, VR: 1)
 *  maxDevices      = service.numberOfDevices  (PS5: 2, VR: 1)
 *  playersPerDevice= service.maxPlayersPerDevice (PS5: 4, VR: 1)
 *  bookedPlayers   = sum of numberOfPersons across all active bookings in this slot
 *  bookedDevices   = number of device-units consumed
 *
 *  Status logic:
 *    bookedPlayers == 0                     → AVAILABLE (green)
 *    bookedPlayers > 0 && < maxPlayers      → FILLING   (yellow)
 *    bookedPlayers >= maxPlayers             → FULL      (red)
 *    isManuallyBlocked                      → BLOCKED   (grey)
 *
 * ─── Conflict-safe atomic writes ───────────────────────────────────────
 *  findOneAndUpdate({
 *    _id: slotId,
 *    version: knownVersion,
 *    $expr: { $lte: [{ $add: ['$bookedPlayers', requestedPlayers] }, '$maxPlayers'] }
 *  }, {
 *    $inc: { bookedPlayers: +N, bookedDevices: +D, version: 1 },
 *    $push: { bookingIds: bookingId },
 *    $set: { status: computedStatus }
 *  })
 *  If result is null → capacity exceeded or version mismatch → reject.
 */
@Schema({ timestamps: true, collection: 'time_slots' })
export class TimeSlot {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  // ─── Capacity limits (copied from Service at generation time) ─────────────────

  @Prop({ required: true, min: 1 })
  maxPlayers: number;

  @Prop({ required: true, min: 1 })
  maxDevices: number;

  @Prop({ required: true, min: 1 })
  playersPerDevice: number;

  // ─── Live counters ────────────────────────────────────────────────────────────

  @Prop({ default: 0, min: 0 })
  bookedPlayers: number;

  @Prop({ default: 0, min: 0 })
  bookedDevices: number;

  // ─── Status & control ─────────────────────────────────────────────────────────

  @Prop({ enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status: SlotStatus;

  @Prop({ default: false })
  isManuallyBlocked: boolean;

  @Prop({ default: 0 })
  version: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Booking' }], default: [] })
  bookingIds: Types.ObjectId[];
}

export const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);

TimeSlotSchema.index(
  { tenantId: 1, serviceId: 1, date: 1, startTime: 1 },
  { unique: true },
);
TimeSlotSchema.index({ tenantId: 1, serviceId: 1, date: 1, status: 1 });
TimeSlotSchema.index({ date: 1 }, { expireAfterSeconds: 90 * 86400 });
