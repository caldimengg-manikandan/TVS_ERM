import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { redisCache } from '../../config/redis';
import {
  generateAccessToken, generateRefreshToken,
  verifyRefreshToken, getRefreshTokenTTLSeconds
} from '../../utils/jwt';
import { createAuditLog } from '../../middleware/audit';
import { AuditAction } from '@tvs/shared';
import { logger } from '../../utils/logger';

export class AuthService {
  async login(
    email: string,
    password: string,
    rememberMe: boolean,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    // Log failed attempt
    const logAttempt = async (success: boolean, failReason?: string) => {
      await prisma.loginHistory.create({
        data: {
          userId: user?.id || uuidv4(),
          ipAddress,
          userAgent,
          success,
          failReason,
        },
      }).catch(() => null);
    };

    if (!user || !user.isActive || user.deletedAt) {
      await logAttempt(false, 'User not found or inactive');
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAttempt(false, 'Invalid password');
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const ttl = getRefreshTokenTTLSeconds();

    // Store refresh token in Redis
    await redisCache.setRefreshToken(user.id, refreshToken, ttl);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
    });

    await logAttempt(true);
    await createAuditLog(user.id, AuditAction.LOGIN, 'User', user.id, 
      `User ${user.email} logged in`, undefined, undefined, ipAddress);

    const userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      permissions: this.getRolePermissions(user.role),
      isActive: user.isActive,
      employee: user.employee ? {
        id: user.employee.id,
        employeeId: user.employee.employeeId,
        fullName: `${user.employee.firstName} ${user.employee.lastName}`,
        email: user.email,
        designation: user.employee.designation,
        department: user.employee.department,
      } : undefined,
      lastLoginAt: user.lastLoginAt?.toISOString(),
    };

    return {
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // Check if token is in Redis (not revoked)
      const isValid = await redisCache.getRefreshToken(decoded.userId, refreshToken);
      if (!isValid) throw new Error('Refresh token revoked');

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId, isActive: true, deletedAt: null },
        select: { id: true, email: true, role: true },
      });

      if (!user) throw new Error('User not found');

      // Token rotation - revoke old, generate new
      await redisCache.revokeRefreshToken(decoded.userId, refreshToken);

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);
      const ttl = getRefreshTokenTTLSeconds();

      await redisCache.setRefreshToken(user.id, newRefreshToken, ttl);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await redisCache.revokeRefreshToken(userId, refreshToken);
    await createAuditLog(userId, AuditAction.LOGOUT, 'User', userId, 'User logged out');
  }

  async logoutAll(userId: string): Promise<void> {
    await redisCache.revokeAllUserTokens(userId);
    await createAuditLog(userId, AuditAction.LOGOUT, 'User', userId, 'All sessions terminated');
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return 'If email exists, reset link sent'; // Security: don't reveal

    const resetToken = uuidv4().replace(/-/g, '');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: await bcrypt.hash(resetToken, 10),
        passwordResetExpiry: expiry,
      },
    });

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user by checking all users with a reset token
    const users = await prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpiry: { gt: new Date() },
      },
      select: { id: true, passwordResetToken: true, passwordResetExpiry: true },
    });

    let matchedUser: (typeof users)[0] | null = null;
    for (const u of users) {
      if (u.passwordResetToken && await bcrypt.compare(token, u.passwordResetToken)) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) throw new Error('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        passwordChangedAt: new Date(),
      },
    });

    // Revoke all sessions
    await redisCache.revokeAllUserTokens(matchedUser.id);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword, passwordChangedAt: new Date() },
    });

    await redisCache.revokeAllUserTokens(userId);
    await createAuditLog(userId, AuditAction.UPDATE, 'User', userId, 'Password changed');
  }

  async getLoginHistory(userId: string, limit = 20) {
    return prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private getRolePermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      SUPER_ADMIN: ['*'],
      ADMIN: [
        'employees:*', 'projects:*', 'resources:*', 'timesheets:*',
        'reports:*', 'attendance:*', 'departments:*', 'capacity:*',
      ],
      PROJECT_MANAGER: [
        'projects:read', 'projects:write', 'tasks:*', 'resources:read',
        'resources:request', 'timesheets:read', 'reports:read',
        'capacity:read', 'employees:read',
      ],
      TEAM_LEAD: [
        'tasks:*', 'timesheets:approve', 'timesheets:read', 'attendance:read',
        'employees:read', 'projects:read',
      ],
      EMPLOYEE: [
        'projects:read:own', 'tasks:read:own', 'timesheets:*:own',
        'attendance:*:own', 'profile:*',
      ],
    };
    return permissionMap[role] || [];
  }
}

export const authService = new AuthService();
