import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditAction } from '@tvs/shared';
import { logger } from '../utils/logger';

interface AuditOptions {
  action: AuditAction;
  entityType: string;
  getEntityId?: (req: Request, res: Response) => string;
  getDescription?: (req: Request) => string;
  captureBody?: boolean;
}

export const auditLog = (options: AuditOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    const requestBody = options.captureBody ? { ...req.body } : undefined;

    res.json = function (body) {
      // Write audit log after response
      if (res.statusCode < 400) {
        const entityId = options.getEntityId 
          ? options.getEntityId(req, res)
          : req.params.id || 'unknown';

        const description = options.getDescription
          ? options.getDescription(req)
          : `${options.action} on ${options.entityType}`;

        prisma.auditLog.create({
          data: {
            userId: req.user?.userId,
            action: options.action,
            entityType: options.entityType,
            entityId,
            description,
            beforeData: requestBody as any,
            afterData: (body?.data || undefined) as any,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          },
        }).catch((err) => logger.error('Audit log write failed:', err));
      }

      return originalJson(body);
    };

    next();
  };
};

export const createAuditLog = async (
  userId: string | undefined,
  action: AuditAction,
  entityType: string,
  entityId: string,
  description: string,
  beforeData?: Record<string, unknown>,
  afterData?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
        beforeData: beforeData as any,
        afterData: afterData as any,
        ipAddress,
      },
    });
  } catch (err) {
    logger.error('Audit log creation failed:', err);
  }
};
