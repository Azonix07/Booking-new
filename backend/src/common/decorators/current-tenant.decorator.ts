import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the resolved tenantId from the request.
 *
 * Tenant is resolved in two ways:
 *  1. From the JWT payload (for authenticated tenant-scoped requests)
 *  2. From TenantMiddleware (subdomain / custom domain / header)
 *
 * Priority: JWT tenantId > middleware-resolved tenantId
 *
 * Usage:
 *   @Get('services')
 *   getServices(@CurrentTenant() tenantId: string) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();

    // JWT-authenticated user's tenant takes priority
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }

    // Fallback to middleware-resolved tenant (public storefront)
    return request.tenantContext?.tenantId ?? null;
  },
);
