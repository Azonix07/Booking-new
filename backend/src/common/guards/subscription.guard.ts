import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../modules/subscriptions/schemas/subscription.schema';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

/**
 * Guard that checks if the requesting tenant's subscription
 * includes the required plan level.
 *
 * Usage: @SetMetadata('requiredPlan', ['ai', 'premium'])
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<SubscriptionPlan[]>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlans || requiredPlans.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const subscription = await this.subscriptionModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        status: SubscriptionStatus.ACTIVE,
      })
      .lean();

    if (!subscription || !requiredPlans.includes(subscription.plan)) {
      throw new ForbiddenException(
        `This feature requires one of the following plans: ${requiredPlans.join(', ')}`,
      );
    }

    return true;
  }
}
