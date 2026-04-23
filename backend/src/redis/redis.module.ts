import {
  Module,
  Global,
  OnModuleDestroy,
  Inject,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService): Redis => {
        const redisUrl = config.get<string>('redis.url');
        const keyPrefix = config.get<string>('redis.keyPrefix', 'bkp:');

        const commonOpts: Record<string, unknown> = {
          keyPrefix,
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            if (times > 5) return null;
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        };

        // Railway provides REDIS_URL — use it if available
        if (redisUrl) {
          return new Redis(redisUrl, commonOpts as any);
        }

        const host = config.get<string>('redis.host', '127.0.0.1');
        const port = config.get<number>('redis.port', 6379);
        const password = config.get<string>('redis.password');
        const db = config.get<number>('redis.db', 0);

        const client = new Redis({
          host,
          port,
          ...(password ? { password } : {}),
          db,
          ...commonOpts,
        } as any);

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    this.logger.log(
      `Redis configured → ${this.config.get('redis.host')}:${this.config.get('redis.port')}`,
    );
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully');
    } catch {
      this.redis.disconnect();
    }
  }
}
