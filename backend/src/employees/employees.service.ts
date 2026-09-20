import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Ensure EMPLOYEE role exists
    try {
      await this.prisma.role.upsert({
        where: { name: 'EMPLOYEE' },
        update: {},
        create: {
          name: 'EMPLOYEE',
          description: 'Staff Employee with assigned administrative permissions',
        },
      });
    } catch (err) {
      console.warn('Could not auto-ensure EMPLOYEE role:', err);
    }
  }

  private async generateUniqueUserId(name: string): Promise<string> {
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'Staff';
    let candidate = `${clean}${Math.floor(1000 + Math.random() * 9000)}`;
    while (true) {
      const existing = await this.prisma.user.findUnique({
        where: { uniqueUserId: candidate },
      });
      if (!existing) return candidate;
      candidate = `${clean}${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  /**
   * Get all employee staff accounts
   */
  async getEmployees() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { isEmployee: true },
          {
            userRoles: {
              some: {
                role: {
                  name: { in: ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'] },
                },
              },
            },
          },
        ],
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      let permissions: string[] = [];
      try {
        if (u.adminPermissions) {
          permissions = JSON.parse(u.adminPermissions);
        }
      } catch {
        permissions = [];
      }

      const roles = u.userRoles.map((ur) => ur.role.name);
      const isSuperAdmin = roles.includes('SUPER_ADMIN');

      return {
        id: u.id,
        uniqueUserId: u.uniqueUserId,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        isActive: u.isActive,
        isEmployee: u.isEmployee,
        isSuperAdmin,
        roles,
        permissions: isSuperAdmin ? ['*'] : permissions,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });
  }

  /**
   * Register a new employee with designated permissions
   */
  async createEmployee(dto: CreateEmployeeDto) {
    if (!dto.fullName?.trim()) {
      throw new BadRequestException('Employee full name is required');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const emailInput = dto.email?.toLowerCase().trim();
    const phoneInput = dto.phone?.trim();

    if (!emailInput && !phoneInput) {
      throw new BadRequestException('Please provide either an Email (Gmail) or Phone number for login');
    }

    // Determine clean email and phone
    let finalEmail = emailInput;
    let finalPhone = phoneInput;

    if (!finalEmail) {
      finalEmail = `emp_${finalPhone?.replace(/[^0-9]/g, '') || Date.now()}@safnexbd.internal`;
    }

    if (!finalPhone) {
      finalPhone = `019${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    // Check if user already exists by email or phone
    const existingByEmail = finalEmail
      ? await this.prisma.user.findUnique({
          where: { email: finalEmail },
          include: { userRoles: { include: { role: true } } },
        })
      : null;

    const existingByPhone = finalPhone
      ? await this.prisma.user.findUnique({
          where: { phone: finalPhone },
          include: { userRoles: { include: { role: true } } },
        })
      : null;

    if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
      throw new BadRequestException(
        `Email "${finalEmail}" belongs to user ${existingByEmail.uniqueUserId}, but Phone "${finalPhone}" belongs to user ${existingByPhone.uniqueUserId}. They cannot be merged.`
      );
    }

    const existingUser = existingByEmail || existingByPhone;

    // Get roles
    const employeeRole = await this.prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
    const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const permissions = Array.isArray(dto.permissions) ? dto.permissions : [];

    // If an account already exists
    if (existingUser) {
      const hasEmployeeRole = existingUser.userRoles?.some(
        (ur) => ur.role?.name === 'EMPLOYEE' || ur.role?.name === 'ADMIN'
      );

      if (existingUser.isEmployee || hasEmployeeRole) {
        throw new BadRequestException(
          `User "${existingUser.uniqueUserId}" (${existingUser.email || existingUser.phone}) is already registered as an employee. You can edit their permissions directly from the list below.`
        );
      }

      // Existing user found! Promote this user to an Employee with designated permissions
      const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
      const nameParts = dto.fullName?.trim() ? dto.fullName.trim().split(' ') : [];
      const firstName = nameParts[0] || existingUser.firstName;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : existingUser.lastName;

      const promotedUser = await this.prisma.$transaction(async (tx) => {
        const updateData: any = {
          isEmployee: true,
          adminPermissions: JSON.stringify(permissions),
          isActive: dto.isActive !== false,
          firstName,
          lastName,
        };

        if (passwordHash) {
          updateData.passwordHash = passwordHash;
        }

        const user = await tx.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });

        // Attach EMPLOYEE role
        if (employeeRole) {
          const hasRole = existingUser.userRoles?.some((r) => r.roleId === employeeRole.id);
          if (!hasRole) {
            await tx.userRole.create({
              data: { userId: user.id, roleId: employeeRole.id },
            });
          }
        }

        // Attach ADMIN role so administrative guards pass
        if (adminRole) {
          const hasRole = existingUser.userRoles?.some((r) => r.roleId === adminRole.id);
          if (!hasRole) {
            await tx.userRole.create({
              data: { userId: user.id, roleId: adminRole.id },
            });
          }
        }

        // Initialize StaffProfile for duty/workload
        await tx.staffProfile.upsert({
          where: { userId: user.id },
          update: { dutyStatus: 'OFF_DUTY' },
          create: { userId: user.id, dutyStatus: 'OFF_DUTY', department: 'GENERAL' },
        });

        return user;
      });

      return {
        success: true,
        message: `Existing user "${promotedUser.uniqueUserId}" (${promotedUser.firstName} ${promotedUser.lastName}) was successfully promoted to Employee!`,
        data: {
          id: promotedUser.id,
          uniqueUserId: promotedUser.uniqueUserId,
          firstName: promotedUser.firstName,
          lastName: promotedUser.lastName,
          email: promotedUser.email,
          phone: promotedUser.phone,
          permissions,
          isActive: promotedUser.isActive,
        },
      };
    }

    // Brand new user registration
    const nameParts = dto.fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || 'Employee';
    const uniqueUserId = await this.generateUniqueUserId(firstName);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          uniqueUserId,
          firstName,
          lastName,
          email: finalEmail!,
          phone: finalPhone!,
          passwordHash,
          isActive: dto.isActive !== false,
          isVerified: true,
          isEmployee: true,
          adminPermissions: JSON.stringify(permissions),
          wallet: {
            create: {
              availableBalance: 0,
              holdBalance: 0,
            },
          },
        },
      });

      // Attach EMPLOYEE role
      if (employeeRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: employeeRole.id },
        });
      }

      // Attach ADMIN role so standard admin guards pass
      if (adminRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: adminRole.id },
        });
      }

      // Initialize StaffProfile
      await tx.staffProfile.upsert({
        where: { userId: user.id },
        update: { dutyStatus: 'OFF_DUTY' },
        create: { userId: user.id, dutyStatus: 'OFF_DUTY', department: 'GENERAL' },
      });

      return user;
    });

    return {
      success: true,
      message: 'Employee registered successfully',
      data: {
        id: newUser.id,
        uniqueUserId: newUser.uniqueUserId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        permissions,
        isActive: newUser.isActive,
      },
    };
  }

  /**
   * Update employee details or permissions
   */
  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Employee not found');
    }

    const isSuperAdmin = user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      throw new ForbiddenException('Super Admin permissions and credentials cannot be altered through employee management.');
    }

    const updateData: any = {};

    if (dto.fullName) {
      const nameParts = dto.fullName.trim().split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ') || 'Employee';
    }

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email is already taken by another account');
      }
      updateData.email = dto.email.toLowerCase().trim();
    }

    if (dto.phone && dto.phone.trim() !== user.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone.trim() },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Phone number is already taken by another account');
      }
      updateData.phone = dto.phone.trim();
    }

    if (dto.password && dto.password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    if (dto.permissions !== undefined) {
      updateData.adminPermissions = JSON.stringify(dto.permissions);
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = Boolean(dto.isActive);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Employee updated successfully',
      data: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        isActive: updated.isActive,
      },
    };
  }

  /**
   * Toggle Active / Inactive status
   */
  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    const isSuperAdmin = user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      throw new ForbiddenException('Cannot deactivate Super Admin accounts!');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    return {
      success: true,
      message: `Employee is now ${updated.isActive ? 'Active' : 'Inactive'}`,
      isActive: updated.isActive,
    };
  }

  /**
   * Delete employee safely
   */
  async deleteEmployee(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    const isSuperAdmin = user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      throw new ForbiddenException('CRITICAL: Super Admin accounts CANNOT be deleted!');
    }

    // Soft delete employee to maintain transaction logs and referential integrity
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return {
      success: true,
      message: 'Employee removed successfully',
    };
  }
}

