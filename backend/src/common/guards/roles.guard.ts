import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied: insufficient role privileges');
    }

    const hasRole = user.roles.some((role: string) => requiredRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(`Access denied: required role in [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || (!user.permissions && !user.adminPermissions)) {
      throw new ForbiddenException('Access denied: insufficient permission privileges');
    }

    // Super Admin and Admin have all permissions
    if (user.roles && (user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN'))) {
      return true;
    }

    const allPerms = [...(user.permissions || []), ...(user.adminPermissions || [])];
    if (allPerms.includes('*')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((perm: string) =>
      allPerms.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied: required permissions [${requiredPermissions.join(', ')}]`);
    }

    return true;
  }
}

