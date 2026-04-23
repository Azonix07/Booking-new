import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '../schemas/subscription.schema';

export class SelectPlanDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

export class ApproveSubscriptionDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectSubscriptionDto {
  @IsString()
  reason: string;
}
