import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
    issuer: 'tvs-erm',
    audience: 'tvs-erm-client',
  } as any);
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string,
    issuer: 'tvs-erm',
    audience: 'tvs-erm-refresh',
  } as any);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET as string, {
    issuer: 'tvs-erm',
    audience: 'tvs-erm-client',
  } as any) as unknown as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET as string, {
    issuer: 'tvs-erm',
    audience: 'tvs-erm-refresh',
  } as any) as unknown as JWTPayload;
};

export const getRefreshTokenTTLSeconds = (): number => {
  const expiry = env.JWT_REFRESH_EXPIRES_IN;
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  const multipliers: Record<string, number> = {
    's': 1, 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800
  };
  return value * (multipliers[unit] ?? 86400);
};
