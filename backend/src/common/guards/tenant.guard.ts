import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../interfaces/auth.interface';
import { UserRole } from '../../modules/users/schemas/user.schema';

/**
 * Ensures that non-super-admin users can only access resources
 * belonging to their own tenant.
 *
 * Applied globally after JwtAuthGuard and RolesGuard.
 *
 * Rules:
 *  - Super admins bypass tenant checks entirely.
 *  - Client admins MUST have a tenantId in their JWT.
 *  - If the route has a resolved tenantContext (from middleware),
 *    a client_admin's JWT tenantId must match it.
 *  - Customers can access any tenant's public storefront.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) return true; // Let JwtAuthGuard handle missing user

    // Super admins have unrestricted access
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Client admins must be bound to a tenant
    if (user.role === UserRole.CLIENT_ADMIN) {
      if (!user.tenantId) {
        throw new ForbiddenException(
          'Client admin account is not linked to any tenant',
        );
      }

      // If the route is scoped to a specific tenant, verify match
      const routeTenantId = request.tenantContext?.tenantId;
      if (routeTenantId && routeTenantId !== user.tenantId) {
        throw new ForbiddenException(
          'You do not have access to this tenant\'s resources',
        );
      }
    }

    // Customers don't need a tenantId — they can browse any storefront
    return true;
  }
}
