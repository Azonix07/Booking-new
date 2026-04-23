import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import {
  Tenant,
  TenantDocument,
  TenantPlan,
  TenantStatus,
} from '../tenants/schemas/tenant.schema';
import {
  SetupWizard,
  SetupWizardDocument,
  WizardStatus,
} from '../setup-wizard/schemas/setup-wizard.schema';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../subscriptions/schemas/subscription.schema';
import { RegisterDto, RegisterBusinessDto } from './dto';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/interfaces/auth.interface';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(SetupWizard.name) private wizardModel: Model<SetupWizardDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ───────────────────────── Customer Registration ───────────────────────────

  /**
   * Public customer signup. Does NOT create a tenant.
   * Business owners use registerBusiness() instead.
   */
  async registerCustomer(dto: RegisterDto) {
    const { name, email, password, phone } = dto;

    await this.assertEmailFree(email);
    if (phone) await this.assertPhoneFree(phone);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await this.userModel.create({
      name,
      email,
      passwordHash,
      phone,
      role: UserRole.CUSTOMER,
      tenantId: null,
    });

    const tokens = await this.generateTokens(user);
    this.logger.log(`Customer registered: ${email}`);

    return { user: await this.sanitiseUserWithOnboarding(user), ...tokens };
  }

  // ───────────────────────── Business Registration ──────────────────────────

  /**
   * Business owner signup + tenant creation + initial subscription.
   * Plan must be one of FREE / STANDARD / AI. FULL_SERVICE is rejected here
   * because it has its own request-based workflow that does not create an
   * account at submission time.
   */
  async registerBusiness(dto: RegisterBusinessDto) {
    const { name, email, password, phone, businessName, category, description, plan } = dto;

    if ((plan as SubscriptionPlan) === SubscriptionPlan.FULL_SERVICE) {
      throw new BadRequestException(
        'Full-Service plan uses a separate request flow and cannot be selected during signup.',
      );
    }

    await this.assertEmailFree(email);
    await this.assertPhoneFree(phone);

    const slug = this.generateSlug(businessName);
    const slugExists = await this.tenantModel.findOne({ slug }).lean();
    if (slugExists) {
      throw new ConflictException(
        'Business name produces a URL slug that is already taken. Try a different name.',
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create tenant with a placeholder ownerId; we'll update after the user exists.
    const tenant = await this.tenantModel.create({
      name: businessName,
      slug,
      category,
      description: description ?? '',
      ownerId: new Types.ObjectId(),
      status: TenantStatus.PENDING_SETUP,
      plan: plan as unknown as TenantPlan,
    });
    const tenantId = tenant._id as Types.ObjectId;

    const user = await this.userModel.create({
      name,
      email,
      passwordHash,
      phone,
      role: UserRole.CLIENT_ADMIN,
      tenantId,
    });

    await this.tenantModel.findByIdAndUpdate(tenantId, { ownerId: user._id });

    // Create the subscription. FREE/AI/STANDARD all activate immediately in
    // this refactor — payment is handled separately for paid tiers via the
    // Razorpay order endpoints. If you want payment-gated activation, change
    // this to create a PENDING subscription for paid plans.
    await this.subscriptionModel.create({
      tenantId,
      userId: user._id,
      plan,
      status: SubscriptionStatus.ACTIVE,
      approvedAt: new Date(),
    });

    // Free plan auto-publishes; paid plans stay unpublished until setup wizard
    // completes (the owner still needs to add services, hours, etc.).
    await this.tenantModel.findByIdAndUpdate(tenantId, {
      status: TenantStatus.ACTIVE,
      isPublished: plan === SubscriptionPlan.FREE,
    });

    const tokens = await this.generateTokens(user);
    this.logger.log(
      `Business registered: ${email} (tenant ${tenantId}, plan ${plan})`,
    );

    return { user: await this.sanitiseUserWithOnboarding(user), ...tokens };
  }

  // ──────────────────────────── Login / Validate ─────────────────────────────

  /** LocalStrategy entry point. Returns AuthenticatedUser or null. */
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.userModel
      .findOne({ email })
      .select('+passwordHash')
      .lean();

    if (!user || !user.passwordHash) return null;

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    return {
      userId: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId?.toString() ?? null,
    };
  }

  async login(user: AuthenticatedUser) {
    const dbUser = await this.userModel.findById(user.userId).lean();
    if (!dbUser) throw new UnauthorizedException('User not found');

    const tokens = await this.generateTokens(dbUser);
    return { user: await this.sanitiseUserWithOnboarding(dbUser), ...tokens };
  }

  // ──────────────────────────── Token Refresh ────────────────────────────────

  async refreshTokens(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshTokenHash')
      .lean();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const hashMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!hashMatches) {
      // Possible token reuse attack — revoke all sessions.
      await this.userModel.findByIdAndUpdate(user._id, {
        refreshTokenHash: null,
      });
      throw new UnauthorizedException(
        'Refresh token reuse detected — all sessions revoked',
      );
    }

    const tokens = await this.generateTokens(user);
    return { user: await this.sanitiseUserWithOnboarding(user), ...tokens };
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitiseUserWithOnboarding(user);
  }

  // ──────────────────────────── Private helpers ──────────────────────────────

  private async assertEmailFree(email: string) {
    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) throw new ConflictException('Email already registered');
  }

  private async assertPhoneFree(phone: string) {
    const existing = await this.userModel.findOne({ phone }).lean();
    if (existing) throw new ConflictException('Phone number already registered');
  }

  private async generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId?.toString() ?? null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.accessExpiry'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiry'),
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userModel.findByIdAndUpdate(user._id, { refreshTokenHash });

    return { accessToken, refreshToken };
  }

  private sanitiseUser(user: any) {
    return {
      id: (user._id as Types.ObjectId).toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId?.toString() ?? null,
      avatar: user.avatar,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    };
  }

  private async sanitiseUserWithOnboarding(user: any) {
    const base = this.sanitiseUser(user);

    if (user.role !== UserRole.CLIENT_ADMIN || !user.tenantId) {
      return { ...base, onboarding: null };
    }

    const tenantId = user.tenantId.toString();

    const [tenant, wizard, subscription] = await Promise.all([
      this.tenantModel.findById(tenantId).lean(),
      this.wizardModel.findOne({ tenantId: new Types.ObjectId(tenantId) }).lean(),
      this.subscriptionModel
        .findOne({
          tenantId: new Types.ObjectId(tenantId),
          status: { $in: ['active', 'pending'] },
        })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const setupCompleted = wizard?.status === WizardStatus.COMPLETED;
    const tenantStatus = tenant?.status || 'pending_setup';

    return {
      ...base,
      onboarding: {
        setupCompleted,
        tenantStatus,
        tenantPlan: tenant?.plan || 'free',
        subscription: subscription
          ? {
              id: (subscription._id as Types.ObjectId).toString(),
              plan: subscription.plan,
              status: subscription.status,
              rejectionReason: subscription.rejectionReason || null,
            }
          : null,
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }
}
