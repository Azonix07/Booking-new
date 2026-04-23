import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  MaxLength,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Step 1: Business Type ──────────────────────────────────────────────────

export class SaveBusinessTypeDto {
  @IsString()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customCategory?: string;
}

// ─── Step 2: Location ───────────────────────────────────────────────────────

export class LocationAddressDto {
  @IsOptional() @IsString() @MaxLength(300) street?: string;
  @IsString() @MaxLength(100) city: string;
  @IsString() @MaxLength(100) state: string;
  @IsOptional() @IsString() @MaxLength(20) zip?: string;
  @IsString() @MaxLength(100) country: string;
}

export class LocationCoordinatesDto {
  @IsNumber() @Min(-90) @Max(90) latitude: number;
  @IsNumber() @Min(-180) @Max(180) longitude: number;
}

export class SaveLocationDto {
  @ValidateNested()
  @Type(() => LocationAddressDto)
  address: LocationAddressDto;

  @ValidateNested()
  @Type(() => LocationCoordinatesDto)
  coordinates: LocationCoordinatesDto;

  @IsOptional() @IsString() @MaxLength(2000) gmapUrl?: string;
}

// ─── Step 2: Business Hours ─────────────────────────────────────────────────

export class BusinessHourEntryDto {
  @IsNumber() @Min(0) @Max(6)
  day: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  open: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  close: string;

  @IsBoolean()
  isClosed: boolean;
}

export class SaveBusinessHoursDto {
  @IsBoolean()
  sameForAllDays: boolean;

  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => BusinessHourEntryDto)
  hours: BusinessHourEntryDto[];
}

// ─── Step 3: Services/Devices ───────────────────────────────────────────────

export class WizardServiceDto {
  @IsString() @MaxLength(200)
  name: string;

  @IsNumber() @Min(1)
  numberOfDevices: number;

  @IsNumber() @Min(1)
  maxPlayersPerDevice: number;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsOptional() @IsString() @MaxLength(100)
  category?: string;
}

export class SaveServicesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WizardServiceDto)
  services: WizardServiceDto[];
}

// ─── Step 4: Slot Config ────────────────────────────────────────────────────

export class SaveSlotConfigDto {
  @IsNumber() @Min(15) @Max(120)
  slotDurationMinutes: number;

  @IsOptional()
  @IsNumber() @Min(0)
  minBookingNoticeHours?: number;

  @IsOptional()
  @IsNumber() @Min(1) @Max(365)
  maxAdvanceBookingDays?: number;

  @IsOptional()
  @IsNumber() @Min(0) @Max(60)
  bufferBetweenSlotsMinutes?: number;

  @IsBoolean()
  allowWalkIns: boolean;
}

// ─── Step 5: Pricing ────────────────────────────────────────────────────────

export class PricingDurationOptionDto {
  @IsNumber() @Min(30) @Max(480)
  minutes: number;

  @IsString() @MaxLength(50)
  label: string;

  @IsNumber() @Min(0)
  price: number;
}

export class ServicePricingDto {
  @IsString()
  serviceName: string;

  @IsNumber() @Min(0)
  basePrice: number;

  @IsOptional() @IsNumber() @Min(0)
  pricePerAdditionalPerson?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingDurationOptionDto)
  durationOptions: PricingDurationOptionDto[];
}

export class SavePricingDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServicePricingDto)
  pricing: ServicePricingDto[];
}

// ─── Step 6: Payment Method ─────────────────────────────────────────────────

export class SavePaymentMethodDto {
  @IsBoolean()
  acceptOnlinePayment: boolean;

  @IsBoolean()
  acceptPayAtShop: boolean;

  @IsBoolean()
  showPriceBeforeBooking: boolean;
}

// ─── Step 7: Customer Fields ────────────────────────────────────────────────

export class CustomFieldDto {
  @IsString() @MaxLength(100)
  label: string;

  @IsEnum(['text', 'number', 'email', 'tel', 'select'] as const)
  type: 'text' | 'number' | 'email' | 'tel' | 'select';

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class SaveCustomerFieldsDto {
  @IsBoolean()
  nameRequired: boolean;

  @IsBoolean()
  phoneRequired: boolean;

  @IsBoolean()
  emailRequired: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDto)
  customFields?: CustomFieldDto[];
}
