import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TrackingSessionDocument = TrackingSession & Document;

export enum TrackingStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true, collection: 'tracking_sessions' })
export class TrackingSession {
  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest', required: true, unique: true })
  requestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  providerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  currentLocation: { type: string; coordinates: number[] };

  @Prop({ default: 0 })
  heading: number;

  @Prop({ default: 0 })
  speed: number;

  @Prop({ enum: TrackingStatus, default: TrackingStatus.ACTIVE })
  status: TrackingStatus;

  // Location history (last N points for route drawing)
  @Prop({
    type: [{
      lat: Number,
      lng: Number,
      timestamp: Date,
    }],
    default: [],
  })
  locationHistory: { lat: number; lng: number; timestamp: Date }[];

  @Prop({ type: Number, default: null })
  etaMinutes: number;

  @Prop({ type: Number, default: null })
  distanceKm: number;

  @Prop({ type: Date, default: null })
  completedAt: Date;
}

export const TrackingSessionSchema = SchemaFactory.createForClass(TrackingSession);

TrackingSessionSchema.index({ currentLocation: '2dsphere' });
TrackingSessionSchema.index({ requestId: 1 });
TrackingSessionSchema.index({ providerId: 1, status: 1 });
