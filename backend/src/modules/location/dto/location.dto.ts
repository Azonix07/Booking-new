import { IsOptional, IsString, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AutocompleteDto {
  @IsString()
  @MaxLength(200)
  q: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  country?: string;
}

export class ReverseGeocodeDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class ParseGmapDto {
  @IsString()
  @MaxLength(2000)
  url: string;
}
