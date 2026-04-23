import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  @IsNotEmpty()
  bookingId: string;

  @IsMongoId()
  @IsNotEmpty()
  serviceId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}

export class ReplyToReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
