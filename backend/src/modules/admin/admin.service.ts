import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import {
  Tenant,
  TenantDocument,
  TenantStatus,
} from '../tenants/schemas/tenant.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import {
  Payment,
  PaymentDocument,
} from '../payments/schemas/payment.schema';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from '../subscriptions/schemas/subscription.schema';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  // ─── Platform Stats ──────────────────────────────────────────────────────────

  async getPlatformStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalCustomers,
      totalBusinessOwners,
      totalBookings,
      totalRevenue,
      totalReviews,
      pendingSubscriptions,
    ] = await Promise.all([
      this.tenantModel.countDocuments(),
      this.tenantModel.countDocuments({ status: TenantStatus.ACTIVE }),
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: UserRole.CUSTOMER }),
      this.userModel.countDocuments({ role: UserRole.CLIENT_ADMIN }),
      this.bookingModel.countDocuments(),
      this.paymentModel.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.reviewModel.countDocuments(),
      this.subscriptionModel.countDocuments({ status: SubscriptionStatus.PENDING }),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalCustomers,
      totalBusinessOwners,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalReviews,
      pendingSubscriptions,
    };
  }

  // ─── Users ────────────────────────────────────────────────────────────────────

  async listUsers(query: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, role, page = 1, limit = 50 } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-passwordHash -refreshTokenHash')
        .populate('tenantId', 'name slug status plan')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetail(userId: string): Promise<Record<string, any>> {
    const user = await this.userModel
      .findById(userId)
      .select('-passwordHash -refreshTokenHash')
      .populate('tenantId', 'name slug status plan category')
      .lean();
    if (!user) throw new NotFoundException('User not found');

    // Get user's bookings count
    const bookingsCount = await this.bookingModel.countDocuments({
      customerId: new Types.ObjectId(userId),
    });

    return { ...user, bookingsCount };
  }

  async updateUser(
    userId: string,
    dto: {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
    },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Prevent editing super_admin role away
    if (
      user.role === UserRole.SUPER_ADMIN &&
      dto.role &&
      dto.role !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException('Cannot change super admin role');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role as UserRole;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    await user.save();
    this.logger.log(`Admin updated user ${userId}`);

    return this.userModel
      .findById(userId)
      .select('-passwordHash -refreshTokenHash')
      .lean();
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete super admin');
    }

    // If client_admin, also delete their tenant and all related data
    if (user.role === UserRole.CLIENT_ADMIN && user.tenantId) {
      await this.deleteTenantData(user.tenantId.toString());
    }

    await this.userModel.findByIdAndDelete(userId);
    this.logger.warn(`Admin deleted user ${userId} (${user.email})`);

    return { deleted: true };
  }

  // ─── Tenants / Businesses ─────────────────────────────────────────────────────

  async listTenants(query: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, plan, page = 1, limit = 50 } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    const [tenants, total] = await Promise.all([
      this.tenantModel
        .find(filter)
        .populate('ownerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.tenantModel.countDocuments(filter),
    ]);

    // Enrich with counts
    const enriched = await Promise.all(
      tenants.map(async (t: any) => {
        const [bookingsCount, servicesCount, reviewsCount] = await Promise.all([
          this.bookingModel.countDocuments({ tenantId: t._id }),
          this.serviceModel.countDocuments({ tenantId: t._id }),
          this.reviewModel.countDocuments({ tenantId: t._id }),
        ]);
        return { ...t, bookingsCount, servicesCount, reviewsCount };
      }),
    );

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantDetail(tenantId: string): Promise<Record<string, any>> {
    const tenant = await this.tenantModel
      .findById(tenantId)
      .populate('ownerId', 'name email phone role isActive createdAt')
      .lean();
    if (!tenant) throw new NotFoundException('Tenant not found');

    const [bookingsCount, servicesCount, reviewsCount, usersCount, revenue] =
      await Promise.all([
        this.bookingModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) }),
        this.serviceModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) }),
        this.reviewModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) }),
        this.userModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) }),
        this.paymentModel.aggregate([
          {
            $match: {
              tenantId: new Types.ObjectId(tenantId),
              status: 'captured',
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    const services = await this.serviceModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .lean();

    return {
      ...tenant,
      bookingsCount,
      servicesCount,
      reviewsCount,
      usersCount,
      totalRevenue: revenue[0]?.total || 0,
      services,
    };
  }

  async updateTenant(
    tenantId: string,
    dto: {
      name?: string;
      category?: string;
      status?: string;
      plan?: string;
      isPublished?: boolean;
      description?: string;
    },
  ) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.name !== undefined) tenant.name = dto.name;
    if (dto.category !== undefined) tenant.category = dto.category;
    if (dto.status !== undefined) tenant.status = dto.status as TenantStatus;
    if (dto.plan !== undefined) tenant.plan = dto.plan as any;
    if (dto.isPublished !== undefined) tenant.isPublished = dto.isPublished;
    if (dto.description !== undefined) tenant.description = dto.description;

    await tenant.save();
    this.logger.log(`Admin updated tenant ${tenantId}`);

    return this.tenantModel.findById(tenantId).lean();
  }

  async updateTenantStatus(tenantId: string, status: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    tenant.status = status as TenantStatus;
    await tenant.save();
    return tenant;
  }

  async deleteTenant(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    await this.deleteTenantData(tenantId);
    this.logger.warn(`Admin deleted tenant ${tenantId} (${tenant.name})`);

    return { deleted: true };
  }

  // ─── Danger Zone ──────────────────────────────────────────────────────────────

  private async deleteTenantData(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);

    await Promise.all([
      this.bookingModel.deleteMany({ tenantId: tid }),
      this.serviceModel.deleteMany({ tenantId: tid }),
      this.reviewModel.deleteMany({ tenantId: tid }),
      this.paymentModel.deleteMany({ tenantId: tid }),
      // Delete all users associated with this tenant (except the owner who may also be a customer)
      this.userModel.deleteMany({
        tenantId: tid,
        role: { $ne: UserRole.CLIENT_ADMIN },
      }),
    ]);

    // Delete the tenant owner
    await this.userModel.deleteMany({ tenantId: tid });

    // Delete the tenant itself
    await this.tenantModel.findByIdAndDelete(tenantId);
  }

  async getRecentActivity(limit = 20) {
    const [recentBookings, recentUsers, recentTenants] = await Promise.all([
      this.bookingModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('customerId', 'name email')
        .populate('tenantId', 'name slug')
        .lean(),
      this.userModel
        .find()
        .select('-passwordHash -refreshTokenHash')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      this.tenantModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    return { recentBookings, recentUsers, recentTenants };
  }
}
