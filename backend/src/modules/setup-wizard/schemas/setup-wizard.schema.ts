import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SetupWizardDocument = SetupWizard & Document;

export enum WizardStep {
  BUSINESS_TYPE = 'business_type',
  LOCATION = 'location',
  BUSINESS_HOURS = 'business_hours',
  SERVICES = 'services',
  SLOT_CONFIG = 'slot_config',
  PRICING = 'pricing',
  PAYMENT_METHOD = 'payment_method',
  CUSTOMER_FIELDS = 'customer_fields',
  REVIEW_CREATE = 'review_create',
}

export enum WizardStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true, collection: 'setup_wizards' })
export class SetupWizard {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, unique: true })
  tenantId: Types.ObjectId;

  @Prop({ enum: WizardStep, default: WizardStep.BUSINESS_TYPE })
  currentStep: WizardStep;

  @Prop({ type: Number, default: 1, min: 1, max: 9 })
  currentStepNumber: number;

  @Prop({ enum: WizardStatus, default: WizardStatus.IN_PROGRESS })
  status: WizardStatus;

  // ─── Step 1: Business Type ────────────────────────────────────────────────

  @Prop(
    raw({
      category: { type: String },
      customCategory: { type: String },
    }),
  )
  businessType: { category: string; customCategory?: string };

  // ─── Step 2: Location ─────────────────────────────────────────────────────

  @Prop(
    raw({
      address: {
        type: {
          street: { type: String },
          city: { type: String },
          state: { type: String },
          zip: { type: String },
          country: { type: String },
        },
      },
      coordinates: {
        type: {
          latitude: { type: Number },
          longitude: { type: Number },
        },
      },
      gmapUrl: { type: String },
    }),
  )
  location: {
    address: {
      street?: string;
      city: string;
      state: string;
      zip?: string;
      country: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    gmapUrl?: string;
  };

  // ─── Step 3: Business Hours ───────────────────────────────────────────────

  @Prop(
    raw({
      sameForAllDays: { type: Boolean, default: true },
      hours: {
        type: [
          {
            day: { type: Number },
            open: { type: String },
            close: { type: String },
            isClosed: { type: Boolean },
          },
        ],
      },
    }),
  )
  businessHours: {
    sameForAllDays: boolean;
    hours: { day: number; open: string; close: string; isClosed: boolean }[];
  };

  // ─── Step 3: Services/Devices ─────────────────────────────────────────────

  @Prop({
    type: [
      {
        name: { type: String },
        numberOfDevices: { type: Number },
        maxPlayersPerDevice: { type: Number },
        description: { type: String },
        category: { type: String },
      },
    ],
    default: [],
  })
  services: {
    name: string;
    numberOfDevices: number;
    maxPlayersPerDevice: number;
    description?: string;
    category?: string;
  }[];

  // ─── Step 4: Slot Config ──────────────────────────────────────────────────

  @Prop(
    raw({
      slotDurationMinutes: { type: Number, default: 60 },
      minBookingNoticeHours: { type: Number, default: 1 },
      maxAdvanceBookingDays: { type: Number, default: 30 },
      bufferBetweenSlotsMinutes: { type: Number, default: 0 },
      allowWalkIns: { type: Boolean, default: false },
    }),
  )
  slotConfig: {
    slotDurationMinutes: number;
    minBookingNoticeHours?: number;
    maxAdvanceBookingDays?: number;
    bufferBetweenSlotsMinutes?: number;
    allowWalkIns: boolean;
  };

  // ─── Step 5: Pricing ──────────────────────────────────────────────────────

  @Prop({
    type: [
      {
        serviceName: { type: String },
        basePrice: { type: Number },
        pricePerAdditionalPerson: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        durationOptions: {
          type: [
            {
              minutes: { type: Number },
              label: { type: String },
              price: { type: Number },
            },
          ],
        },
      },
    ],
    default: [],
  })
  pricing: {
    serviceName: string;
    basePrice: number;
    pricePerAdditionalPerson: number;
    currency: string;
    durationOptions: { minutes: number; label: string; price: number }[];
  }[];

  // ─── Step 6: Payment Method ───────────────────────────────────────────────

  @Prop(
    raw({
      acceptOnlinePayment: { type: Boolean, default: false },
      acceptPayAtShop: { type: Boolean, default: true },
      showPriceBeforeBooking: { type: Boolean, default: true },
    }),
  )
  paymentMethod: {
    acceptOnlinePayment: boolean;
    acceptPayAtShop: boolean;
    showPriceBeforeBooking: boolean;
  };

  // ─── Step 7: Customer Fields ──────────────────────────────────────────────

  @Prop(
    raw({
      nameRequired: { type: Boolean, default: true },
      phoneRequired: { type: Boolean, default: true },
      emailRequired: { type: Boolean, default: false },
      customFields: {
        type: [
          {
            label: { type: String },
            type: { type: String, enum: ['text', 'number', 'email', 'tel', 'select'] },
            required: { type: Boolean },
            options: { type: [String] },
          },
        ],
        default: [],
      },
    }),
  )
  customerFields: {
    nameRequired: boolean;
    phoneRequired: boolean;
    emailRequired: boolean;
    customFields: {
      label: string;
      type: 'text' | 'number' | 'email' | 'tel' | 'select';
      required: boolean;
      options?: string[];
    }[];
  };

  // ─── Completed steps tracking ─────────────────────────────────────────────

  @Prop({ type: [String], default: [] })
  completedSteps: string[];
}

export const SetupWizardSchema = SchemaFactory.createForClass(SetupWizard);
SetupWizardSchema.index({ tenantId: 1 }, { unique: true });
