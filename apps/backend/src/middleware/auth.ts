import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { prisma } from '../config/database';
import { sendError } from '../utils/response';
import { UserRole } from '@tvs/shared';
import { requestContext } from '../utils/context';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Access token required' });
      return;
    }

    const decoded = verifyAccessToken(token);
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employee: { select: { id: true } },
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      employeeId: user.employee?.id,
    };

    const ctx = requestContext.getStore();
    if (ctx) {
      ctx.userId = user.id;
    }

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token expired', error: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.accessToken;

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, employee: { select: { id: true } } },
      });
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role as UserRole,
          employeeId: user.employee?.id,
        };
      }
    }
  } catch {
    // Silent fail for optional auth
  }
  next();
};

// Role-based access control
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

// Shorthand role guards
export const isSuperAdmin = authorize(UserRole.SUPER_ADMIN);
export const isAdmin = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN);
export const isProjectManager = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER);
export const isTeamLead = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_LEAD);
export const isEmployee = authorize(
  UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER,
  UserRole.TEAM_LEAD, UserRole.EMPLOYEE
);

// Check if user is accessing their own resource
export const isSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const targetId = req.params.userId || req.params.employeeId;
  const isOwnResource = targetId === req.user.userId || targetId === req.user.employeeId;
  const isAdminOrAbove = [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user.role);

  if (!isOwnResource && !isAdminOrAbove) {
    sendError(res, 'Access denied', 403);
    return;
  }

  next();
};
