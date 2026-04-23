import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Duration option ────────────────────────────────────────────────────────

export class DurationOptionDto {
  @IsNumber() @Min(30) @Max(480)
  minutes: number;

  @IsString() @MaxLength(50)
  label: string;

  @IsNumber() @Min(0)
  price: number;
}

// ─── Create ─────────────────────────────────────────────────────────────────

export class CreateServiceDto {
  @IsString() @MaxLength(200)
  name: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @IsOptional() @IsString() @MaxLength(100)
  category?: string;

  // Booking mode
  @IsOptional() @IsString()
  bookingMode?: string; // 'slot' | 'date-range'

  @IsOptional() @IsBoolean()
  isExclusive?: boolean;

  // Device / capacity
  @IsOptional() @IsNumber() @Min(1)
  numberOfDevices?: number;

  @IsOptional() @IsNumber() @Min(1)
  maxPlayersPerDevice?: number;

  // Time
  @IsOptional() @IsNumber() @Min(30) @Max(480)
  defaultDuration?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(60)
  bufferTime?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DurationOptionDto)
  durationOptions?: DurationOptionDto[];

  // Pricing
  @IsNumber() @Min(0)
  price: number;

  @IsOptional() @IsNumber() @Min(0)
  pricePerAdditionalPerson?: number;

  @IsOptional() @IsString()
  currency?: string;

  // Person limits
  @IsOptional() @IsNumber() @Min(1)
  minPersons?: number;

  @IsOptional() @IsNumber() @Min(1)
  maxPersons?: number;

  @IsOptional() @IsNumber()
  sortOrder?: number;

  // Room/accommodation fields (date-range mode)
  @IsOptional() @IsNumber() @Min(1)
  totalUnits?: number;

  @IsOptional() @IsString() @MaxLength(100)
  unitType?: string;

  @IsOptional() @IsNumber() @Min(0)
  pricePerNight?: number;

  @IsOptional() @IsString()
  checkInTime?: string;

  @IsOptional() @IsString()
  checkOutTime?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  amenities?: string[];

  // Facility fields (turf/court)
  @IsOptional() @IsString() @MaxLength(100)
  facilityType?: string;

  @IsOptional() @IsString() @MaxLength(100)
  surfaceType?: string;
}

// ─── Update ─────────────────────────────────────────────────────────────────

export class UpdateServiceDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsString() @MaxLength(100) category?: string;

  // Booking mode
  @IsOptional() @IsString() bookingMode?: string;
  @IsOptional() @IsBoolean() isExclusive?: boolean;

  // Device / capacity
  @IsOptional() @IsNumber() @Min(1) numberOfDevices?: number;
  @IsOptional() @IsNumber() @Min(1) maxPlayersPerDevice?: number;

  // Time
  @IsOptional() @IsNumber() @Min(30) @Max(480) defaultDuration?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(60) bufferTime?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DurationOptionDto)
  durationOptions?: DurationOptionDto[];

  // Pricing
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) pricePerAdditionalPerson?: number;
  @IsOptional() @IsString() currency?: string;

  // Person limits
  @IsOptional() @IsNumber() @Min(1) minPersons?: number;
  @IsOptional() @IsNumber() @Min(1) maxPersons?: number;

  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;

  // Room/accommodation
  @IsOptional() @IsNumber() @Min(1) totalUnits?: number;
  @IsOptional() @IsString() @MaxLength(100) unitType?: string;
  @IsOptional() @IsNumber() @Min(0) pricePerNight?: number;
  @IsOptional() @IsString() checkInTime?: string;
  @IsOptional() @IsString() checkOutTime?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];

  // Facility
  @IsOptional() @IsString() @MaxLength(100) facilityType?: string;
  @IsOptional() @IsString() @MaxLength(100) surfaceType?: string;
}

// ─── Reorder ────────────────────────────────────────────────────────────────

export class ReorderItemDto {
  @IsString()
  serviceId: string;

  @IsNumber()
  @Min(0)
  sortOrder: number;
}

export class ReorderServicesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
