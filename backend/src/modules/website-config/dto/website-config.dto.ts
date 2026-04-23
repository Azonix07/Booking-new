import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Website Creation ─────────────────────────────────────────────────────────

export enum WebsiteCreationMode {
  BASIC_TEMPLATE = 'basic_template',
  AI_GENERATED = 'ai_generated',
}

export class CreateWebsiteDto {
  @IsEnum(WebsiteCreationMode)
  mode: WebsiteCreationMode;

  /** Required when mode = 'ai_generated' — the prompt for the AI */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;

  /** Business type for AI generation (e.g. gaming-lounge, salon, gym, restaurant) */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessType?: string;

  /** Design style for AI generation (e.g. modern, elegant, bold, minimal, playful) */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designStyle?: string;

  /** Optional: pick a named template when mode = 'basic_template' */
  @IsOptional()
  @IsString()
  templateName?: string;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export class UpdateThemeDto {
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() secondaryColor?: string;
  @IsOptional() @IsString() backgroundColor?: string;
  @IsOptional() @IsString() textColor?: string;
  @IsOptional() @IsString() fontFamily?: string;
  @IsOptional() @IsString() borderRadius?: string;
  @IsOptional() @IsEnum(['light', 'dark'] as const) mode?: 'light' | 'dark';
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export class UpdateLayoutDto {
  @IsOptional()
  @IsEnum(['centered', 'left-aligned', 'transparent'] as const)
  headerStyle?: 'centered' | 'left-aligned' | 'transparent';

  @IsOptional()
  @IsEnum(['minimal', 'full', 'none'] as const)
  footerStyle?: 'minimal' | 'full' | 'none';

  @IsOptional() @IsString() maxWidth?: string;
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export class SectionDto {
  @IsString()
  type: string;

  @IsNumber()
  @Min(0)
  order: number;

  @IsBoolean()
  isVisible: boolean;

  @IsOptional()
  config?: Record<string, any>;
}

export class UpdateSectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export class UpdateSeoDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() ogImage?: string;
  @IsOptional() @IsString() favicon?: string;
}

// ─── Custom Code ──────────────────────────────────────────────────────────────

export class UpdateCustomCodeDto {
  @IsOptional() @IsString() @MaxLength(50000) customCSS?: string;
  @IsOptional() @IsString() @MaxLength(50000) customHeadHTML?: string;
}

// ─── Publish/Unpublish ────────────────────────────────────────────────────────

export class UpdateWebsiteStatusDto {
  @IsEnum(['draft', 'published'] as const)
  status: 'draft' | 'published';
}

// ─── Full update (for advanced editing) ───────────────────────────────────────

export class UpdateWebsiteConfigDto {
  @IsOptional() @ValidateNested() @Type(() => UpdateThemeDto) theme?: UpdateThemeDto;
  @IsOptional() @ValidateNested() @Type(() => UpdateLayoutDto) layout?: UpdateLayoutDto;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SectionDto) sections?: SectionDto[];
  @IsOptional() @ValidateNested() @Type(() => UpdateSeoDto) seo?: UpdateSeoDto;
  @IsOptional() @IsString() @MaxLength(50000) customCSS?: string;
  @IsOptional() @IsString() @MaxLength(50000) customHeadHTML?: string;
}
