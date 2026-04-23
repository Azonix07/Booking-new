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

// ─── Business Hours ─────────────────────────────────────────────────────────

export class BusinessHoursEntryDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  day: number; // 0=Sun … 6=Sat

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'open must be HH:MM format' })
  open: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'close must be HH:MM format' })
  close: string;

  @IsBoolean()
  isClosed: boolean;
}

export class UpdateBusinessHoursDto {
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursEntryDto)
  businessHours: BusinessHoursEntryDto[];
}

// ─── Shop Details ───────────────────────────────────────────────────────────

export class UpdateShopDetailsDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

// ─── Address ────────────────────────────────────────────────────────────────

export class UpdateAddressDto {
  @IsOptional() @IsString() @MaxLength(300) street?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) state?: string;
  @IsOptional() @IsString() @MaxLength(20) zip?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
}

// ─── Location (coordinates) ─────────────────────────────────────────────────

export class UpdateLocationDto {
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;
}

// ─── Branding ───────────────────────────────────────────────────────────────

export class UpdateBrandingDto {
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() secondaryColor?: string;
}

// ─── Shop / Booking Settings ────────────────────────────────────────────────

export class UpdateShopSettingsDto {
  @IsOptional() @IsNumber() @Min(10) @Max(120) slotInterval?: number;
  @IsOptional() @IsNumber() @Min(0) minBookingNotice?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(365) maxAdvanceBooking?: number;
  @IsOptional() @IsBoolean() allowWalkIns?: boolean;
  @IsOptional() @IsBoolean() requirePaymentUpfront?: boolean;
  @IsOptional() @IsString() @MaxLength(2000) cancellationPolicy?: string;
  @IsOptional() @IsNumber() @Min(0) cancellationWindowHours?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() timezone?: string;
}

// ─── Publish toggle ─────────────────────────────────────────────────────────

export class UpdatePublishDto {
  @IsBoolean()
  isPublished: boolean;
}
