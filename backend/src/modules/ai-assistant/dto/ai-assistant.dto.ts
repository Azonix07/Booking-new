import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum AiContextType {
  SETUP_WIZARD = 'setup_wizard',
  FLOOR_PLANNER = 'floor_planner',
  DASHBOARD = 'dashboard',
  GENERAL = 'general',
}

export class AiChatDto {
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsEnum(AiContextType)
  context: AiContextType;

  @IsOptional()
  @IsString()
  currentStep?: string;

  @IsOptional()
  @IsObject()
  wizardData?: Record<string, any>;

  @IsOptional()
  @IsArray()
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

export class FloorPlannerDto {
  @IsString()
  @MaxLength(2000)
  description: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsObject()
  existingLayout?: Record<string, any>;
}

export class ConfusionDetectDto {
  @IsString()
  currentStep: string;

  @IsOptional()
  @IsObject()
  wizardData?: Record<string, any>;

  @IsOptional()
  timeOnStep?: number; // seconds

  @IsOptional()
  @IsArray()
  userActions?: string[];
}
