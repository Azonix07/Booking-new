import {
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetAvailabilityDto {
  @IsMongoId()
  serviceId: string;

  /** ISO date string — "2026-03-20" */
  @IsDateString()
  date: string;

  /** Desired duration in minutes (60, 120, 180 …) */
  @IsInt()
  @Min(30)
  @Max(480)
  duration: number;

  /** How many players in the party */
  @IsInt()
  @Min(1)
  @Max(20)
  numberOfPersons: number;
}
