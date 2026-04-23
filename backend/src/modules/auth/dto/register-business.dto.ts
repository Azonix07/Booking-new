import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SubscriptionPlan } from '../../subscriptions/schemas/subscription.schema';

/**
 * Dedicated business-owner signup. Requires plan selection up-front so the
 * tenant is created with the correct plan on day 1.
 *
 * FULL_SERVICE is NOT allowed here — those go through the public
 * /full-service-requests endpoint and do not create an account at signup.
 */
export class RegisterBusinessDto {
  // ─── Owner identity ──────────────────────────────────────────────────────
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  // ─── Business identity ───────────────────────────────────────────────────
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  businessName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // ─── Plan selection ──────────────────────────────────────────────────────
  @IsEnum([
    SubscriptionPlan.FREE,
    SubscriptionPlan.STANDARD,
    SubscriptionPlan.AI,
  ])
  plan: SubscriptionPlan;
}
