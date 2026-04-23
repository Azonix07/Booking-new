import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionPlan,
  SubscriptionStatus,
} from './schemas/subscription.schema';
import {
  Tenant,
  TenantDocument,
  TenantStatus,
} from '../tenants/schemas/tenant.schema';

/**
 * Which plans activate immediately on selection, without admin approval.
 * FULL_SERVICE is excluded — it goes through the FullServiceRequest workflow
 * and never creates a subscription at selection time.
 */
const INSTANT_ACTIVATION_PLANS: SubscriptionPlan[] = [
  SubscriptionPlan.FREE,
  SubscriptionPlan.STANDARD,
  SubscriptionPlan.AI,
];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
  ) {}

  // ─── Select Plan ──────────────────────────────────────────────────────────

  async selectPlan(tenantId: string, userId: string, plan: SubscriptionPlan) {
    if (plan === SubscriptionPlan.FULL_SERVICE) {
      throw new BadRequestException(
        'Full-Service plan cannot be selected here. Submit a request via /full-service-requests instead.',
      );
    }

    const existing = await this.subscriptionModel.findOne({
      tenantId: new Types.ObjectId(tenantId),
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
    });

    if (existing) {
      throw new BadRequestException(
        existing.status === SubscriptionStatus.ACTIVE
          ? 'You already have an active subscription'
          : 'You already have a pending subscription request',
      );
    }

    const instant = INSTANT_ACTIVATION_PLANS.includes(plan);

    const subscription = await this.subscriptionModel.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      plan,
      status: instant ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
      approvedAt: instant ? new Date() : null,
    });

    if (instant) {
      await this.tenantModel.findByIdAndUpdate(tenantId, {
        status: TenantStatus.ACTIVE,
        plan,
        isPublished: plan === SubscriptionPlan.FREE,
      });
      this.logger.log(`${plan} plan activated for tenant ${tenantId}`);
    } else {
      this.logger.log(
        `${plan} plan subscription requested for tenant ${tenantId} — awaiting admin approval`,
      );
    }

    return subscription;
  }

  // ─── Get current subscription for a tenant ────────────────────────────────

  async getByTenant(tenantId: string) {
    return this.subscriptionModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ─── Admin: list subscription requests ────────────────────────────────────

  async listRequests(query: {
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.plan) filter.plan = query.plan;

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.subscriptionModel
        .find(filter)
        .populate('tenantId', 'name slug category')
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.subscriptionModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Admin: approve subscription ──────────────────────────────────────────

  async approve(subscriptionId: string, adminUserId: string) {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve a subscription with status "${subscription.status}"`,
      );
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.approvedAt = new Date();
    subscription.approvedBy = new Types.ObjectId(adminUserId);
    await subscription.save();

    await this.tenantModel.findByIdAndUpdate(subscription.tenantId, {
      status: TenantStatus.ACTIVE,
      plan: subscription.plan,
      isPublished: true,
    });

    this.logger.log(
      `Subscription ${subscriptionId} approved by admin ${adminUserId}. Plan: ${subscription.plan}`,
    );

    return subscription;
  }

  // ─── Admin: reject subscription ───────────────────────────────────────────

  async reject(subscriptionId: string, adminUserId: string, reason: string) {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (subscription.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a subscription with status "${subscription.status}"`,
      );
    }

    subscription.status = SubscriptionStatus.REJECTED;
    subscription.rejectionReason = reason;
    subscription.approvedBy = new Types.ObjectId(adminUserId);
    await subscription.save();

    this.logger.log(
      `Subscription ${subscriptionId} rejected by admin ${adminUserId}`,
    );

    return subscription;
  }
}
