import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Nearby search (geo) ────────────────────────────────────────────────────

export class NearbySearchDto {
  /** User's longitude */
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  /** User's latitude */
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  /** Max distance in kilometres (default: 25 km) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  radiusKm?: number;

  /** Filter by business category — e.g. "gaming-lounge", "salon" */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  /** Free-text search — matched against name, description, tags */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Minimum average rating */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

// ─── Browse by category (no geo) ────────────────────────────────────────────

export class BrowseByCategoryDto {
  @IsString()
  @MaxLength(100)
  category: string;

  /** Optional: city-level filtering */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'name' | 'newest';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

// ─── Storefront resolve (slug or domain) ────────────────────────────────────

export class ResolveStorefrontDto {
  /** Business slug (e.g. "gamespot-cafe") */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  /** Custom domain (e.g. "mybarbershop.com") */
  @IsOptional()
  @IsString()
  @MaxLength(253)
  domain?: string;
}
