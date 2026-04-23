import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlan } from '../../modules/subscriptions/schemas/subscription.schema';
import { REQUIRED_PLAN_KEY } from '../guards/subscription.guard';

/**
 * Decorator to require specific subscription plans to access an endpoint.
 * Usage: @RequiresPlan(SubscriptionPlan.AI, SubscriptionPlan.FULL_SERVICE)
 */
export const RequiresPlan = (...plans: SubscriptionPlan[]) =>
  SetMetadata(REQUIRED_PLAN_KEY, plans);
