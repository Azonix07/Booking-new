import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  serviceId: string;

  @IsDateString()
  date: string;

  /** Must be "HH:MM" format — required for slot mode */
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(480)
  duration?: number;

  @IsInt()
  @Min(1)
  @Max(20)
  numberOfPersons: number;

  /** Check-out date — required for date-range mode */
  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  /** Number of rooms/units to book (date-range mode) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  numberOfUnits?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNotes?: string;
}
