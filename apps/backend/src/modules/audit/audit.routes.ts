import { Router, Request, Response } from 'express';
import { authenticate, isAdmin } from '../../middleware/auth';
import { asyncHandler, sendSuccess, buildPaginationResult, getPaginationParams } from '../../utils/response';
import { prisma } from '../../config/database';
import { PaginationSchema } from '@tvs/shared';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate, isAdmin);

// GET /api/audit-logs
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const query = PaginationSchema.extend({
    action: z.string().optional(),
    entityType: z.string().optional(),
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).parse(req.query);

  const { page, limit, action, entityType, userId, startDate, endDate } = query;
  const { skip, take } = getPaginationParams(page, limit);

  const where: Prisma.AuditLogWhereInput = {
    ...(action && { action: action as 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT' | 'EXPORT' }),
    ...(entityType && { entityType }),
    ...(userId && { userId }),
    ...(startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    },
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip, take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  sendSuccess(res, buildPaginationResult(logs, total, page, limit), 'Audit logs retrieved');
}));

export default router;
