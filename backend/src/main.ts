import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { globalValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Preserve raw body for webhook signature verification
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isProduction = configService.get<string>('app.nodeEnv') === 'production';

  // ── Global prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(globalValidationPipe);

  // ── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins = configService.get<string>('app.corsOrigins');
  app.enableCors({
    origin: isProduction && allowedOrigins
      ? allowedOrigins.split(',')
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── Start ───────────────────────────────────────────────────────────────────
  const port = configService.get<number>('app.port') || 3001;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}/api/v1 [${isProduction ? 'production' : 'development'}]`);
}

bootstrap();
