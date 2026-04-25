import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { ServiceCategory, ServiceRequestStatus } from '../schemas/service-request.schema';

export class CreateServiceRequestDto {
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class AcceptServiceRequestDto {
  @IsMongoId()
  requestId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class UpdateStatusDto {
  @IsMongoId()
  requestId: string;

  @IsEnum(ServiceRequestStatus)
  status: ServiceRequestStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  finalAmount?: number;
}

export class UpdateLocationDto {
  @IsMongoId()
  requestId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @IsOptional()
  heading?: number;

  @IsNumber()
  @IsOptional()
  speed?: number;
}

export class RateServiceDto {
  @IsMongoId()
  requestId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  review?: string;
}
