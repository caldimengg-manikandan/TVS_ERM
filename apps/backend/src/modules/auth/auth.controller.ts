import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError, asyncHandler } from '../../utils/response';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',
};

export const getCsrfToken = (req: Request, res: Response) => {
  sendSuccess(res, { csrfToken: req.csrfToken() }, 'CSRF token generated');
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.login(email, password, rememberMe, ipAddress, userAgent);

  // Set refresh token in HttpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  sendSuccess(res, {
    user: result.user,
    tokens: {
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    },
  }, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  
  if (!refreshToken) {
    sendError(res, 'Refresh token required', 401);
    return;
  }

  const tokens = await authService.refreshTokens(refreshToken);

  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  sendSuccess(res, {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  
  if (req.user && refreshToken) {
    await authService.logout(req.user.userId, refreshToken);
  }

  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  sendSuccess(res, null, 'Logged out successfully');
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await authService.logoutAll(req.user.userId);
  }
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  sendSuccess(res, null, 'All sessions terminated');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const token = await authService.forgotPassword(email);
  
  // In production, send email with token; for now return it
  // TODO: Integrate email service
  sendSuccess(res, 
    env.NODE_ENV === 'development' ? { resetToken: token } : null, 
    'If an account with that email exists, a reset link has been sent.'
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  sendSuccess(res, null, 'Password reset successful. Please login with your new password.');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  sendSuccess(res, null, 'Password changed. Please login again.');
});

export const getLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await authService.getLoginHistory(req.user!.userId);
  sendSuccess(res, history, 'Login history retrieved');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = await import('../../config/database');
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      employee: {
        include: {
          department: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role,
    isActive: user.isActive,
    avatar: user.avatar,
    lastLoginAt: user.lastLoginAt,
    employee: user.employee,
  });
});
