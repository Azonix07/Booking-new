import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Matches,
  MaxLength,
} from 'class-validator';

// ─── Block / unblock a single slot ──────────────────────────────────────────

export class BlockSlotDto {
  @IsString()
  serviceId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM' })
  startTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

// ─── Bulk block / unblock ───────────────────────────────────────────────────

export class BulkBlockSlotsDto {
  @IsString()
  serviceId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsArray()
  @IsString({ each: true })
  startTimes: string[]; // ["10:00", "11:00", "12:00"]

  @IsBoolean()
  block: boolean; // true = block, false = unblock

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

// ─── Query for admin slot grid ──────────────────────────────────────────────

export class AdminSlotsQueryDto {
  @IsString()
  serviceId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;
}

// ─── Generate slots for a date range (manual trigger) ───────────────────────

export class GenerateSlotsDto {
  @IsString()
  serviceId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD' })
  startDate: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD' })
  endDate: string;
}
