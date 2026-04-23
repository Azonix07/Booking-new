import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/schemas/user.schema';

export const ROLES_KEY = 'roles';

/**
 * Restrict an endpoint to specific roles.
 *
 * Usage:
 *   @Roles(UserRole.SUPER_ADMIN)
 *   @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
