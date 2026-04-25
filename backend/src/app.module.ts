import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import { appConfig, databaseConfig, jwtConfig, redisConfig, razorpayConfig, aiConfig } from './config';

// Database
import { DatabaseModule } from './database/database.module';

// Redis
import { RedisModule } from './redis/redis.module';

// Common
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { TenantResolverMiddleware } from './common/middleware/tenant-resolver.middleware';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DomainsModule } from './modules/domains/domains.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { WebsiteConfigModule } from './modules/website-config/website-config.module';
import { TimeSlotsModule } from './modules/time-slots/time-slots.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SetupWizardModule } from './modules/setup-wizard/setup-wizard.module';
import { LocationModule } from './modules/location/location.module';
import { AdminModule } from './modules/admin/admin.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { FullServiceModule } from './modules/full-service/full-service.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { TasksModule } from './tasks/tasks.module';
import { HealthController } from './health.controller';

// Schemas needed by middleware + guards (registered at root level)
import { Tenant, TenantSchema } from './modules/tenants/schemas/tenant.schema';
import { Domain, DomainSchema } from './modules/domains/schemas/domain.schema';
import { Subscription, SubscriptionSchema } from './modules/subscriptions/schemas/subscription.schema';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, razorpayConfig, aiConfig],
      envFilePath: '.env',
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 second
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),

    // ── Scheduled tasks (cron) ────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Database ──────────────────────────────────────────────────────────────
    DatabaseModule,

    // ── Redis (global — provides REDIS_CLIENT to all modules) ────────────────
    RedisModule,

    // Register schemas needed by TenantResolverMiddleware at root
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Domain.name, schema: DomainSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),

    // ── Feature modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    TenantsModule,
    DomainsModule,
    ServicesModule,
    BookingsModule,
    WebsiteConfigModule,
    TimeSlotsModule,
    DashboardModule,
    MarketplaceModule,
    PaymentsModule,
    ReviewsModule,
    SetupWizardModule,
    LocationModule,
    AdminModule,
    SubscriptionsModule,
    FullServiceModule,
    AiAssistantModule,
    ServiceRequestsModule,
    TasksModule,
  ],
  controllers: [HealthController],
  providers: [
    // ── Global exception filter ───────────────────────────────────────────────
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // ── Global interceptors ───────────────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },

    // ── Global guards (order matters: auth → roles → tenant) ─────────────────
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Tenant resolution runs on every incoming request
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
