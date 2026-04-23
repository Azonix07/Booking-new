import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CLIENT_ADMIN = 'client_admin',
  CUSTOMER = 'customer',
}

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  /**
   * Tenant scope — null for super_admin and global customers.
   * Set when a customer books with a specific tenant, or when
   * a client_admin registers their business.
   */
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true, default: null })
  tenantId: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ select: false })
  passwordHash: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Prop({ type: String, default: undefined })
  googleId: string;

  @Prop({ default: null })
  avatar: string;

  /** Refresh token hash — stored for rotation-based refresh flow */
  @Prop({ select: false, default: null })
  refreshTokenHash: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  /** Tracks which tenants this customer has booked with */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tenant' }], default: [] })
  tenantMemberships: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// ─── Indexes ────────────────────────────────────────────────────────────────────

// Primary lookup — login, uniqueness
UserSchema.index({ email: 1 }, { unique: true });

// Tenant-scoped user queries (list staff, list customers for a tenant)
UserSchema.index({ tenantId: 1, role: 1 });

// Google OAuth lookup
UserSchema.index(
  { googleId: 1 },
  { sparse: true, unique: true },
);

// Customer search across tenants
UserSchema.index({ tenantMemberships: 1 });
