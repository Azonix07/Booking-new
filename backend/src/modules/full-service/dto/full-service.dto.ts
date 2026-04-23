import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FullServiceRequestStatus } from '../schemas/full-service-request.schema';

export class FullServiceContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;
}

export class CreateFullServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  businessName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  businessType: string;

  @IsString()
  @MinLength(20, {
    message: 'Please describe your business in at least 20 characters',
  })
  @MaxLength(2000)
  businessDescription: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  designPreferences?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  existingWebsite?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  timeline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalNotes?: string;

  @ValidateNested()
  @Type(() => FullServiceContactDto)
  contact: FullServiceContactDto;
}

export class UpdateFullServiceStatusDto {
  @IsEnum(FullServiceRequestStatus)
  status: FullServiceRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deliveredDomain?: string;
}

export class AssignFullServiceDto {
  @IsString()
  @IsNotEmpty()
  assigneeId: string;
}
