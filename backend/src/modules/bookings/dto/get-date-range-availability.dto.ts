import { IsDateString, IsMongoId } from 'class-validator';

export class GetDateRangeAvailabilityDto {
  @IsMongoId()
  serviceId: string;

  /** Check-in date — "2026-03-20" */
  @IsDateString()
  startDate: string;

  /** Check-out date — "2026-03-25" */
  @IsDateString()
  endDate: string;
}
