import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface CachedUser {
  user: any;
  expiresAt: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL
const MAX_CACHE_SIZE = 10000;

export function invalidateUserCache(userId?: string) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const now = Date.now();
    const cached = userCache.get(payload.sub);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        wallet: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      userCache.delete(payload.sub);
      throw new UnauthorizedException('User is not active or unauthorized');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    );

    let adminPermissions: string[] = [];
    try {
      if (roles.includes('SUPER_ADMIN')) {
        adminPermissions = ['*'];
      } else if (user.adminPermissions) {
        adminPermissions = JSON.parse(user.adminPermissions);
      }
    } catch {
      adminPermissions = [];
    }

    const validatedUser = {
      id: user.id,
      uniqueUserId: user.uniqueUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      wallet: user.wallet,
      roles,
      permissions,
      adminPermissions,
    };

    if (userCache.size >= MAX_CACHE_SIZE) {
      const firstKey = userCache.keys().next().value;
      if (firstKey) userCache.delete(firstKey);
    }

    userCache.set(payload.sub, {
      user: validatedUser,
      expiresAt: now + CACHE_TTL_MS,
    });

    return validatedUser;
  }
}

