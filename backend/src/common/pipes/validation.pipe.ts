import { ValidationPipe } from '@nestjs/common';

/**
 * Global validation pipe — applied in main.ts.
 * Uses class-validator + class-transformer on every incoming DTO.
 */
export const globalValidationPipe = new ValidationPipe({
  whitelist: true,           // Strip properties not in DTO
  forbidNonWhitelisted: true, // Throw if extra properties are sent
  transform: true,            // Auto-transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: true,
  },
});
