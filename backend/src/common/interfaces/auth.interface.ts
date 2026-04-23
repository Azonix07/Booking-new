import { Types } from 'mongoose';
import { UserRole } from '../../modules/users/schemas/user.schema';

/**
 * Shape of the JWT access-token payload.
 * Embedded in every authenticated request via Passport.
 */
export interface JwtPayload {
  /** User._id */
  sub: string;
  email: string;
  role: UserRole;
  /** Tenant._id — null for super_admin and unscoped customers */
  tenantId: string | null;
}

/**
 * Extended request object after JWT + tenant resolution.
 * Available via `@CurrentUser()` and `@CurrentTenant()` decorators.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
}

/**
 * Tenant context resolved by TenantMiddleware.
 * Attached to `req.tenantContext`.
 */
export interface TenantContext {
  tenantId: string;
  slug: string;
}
