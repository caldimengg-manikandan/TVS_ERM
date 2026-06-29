import { Router, Request, Response } from 'express';
import { authenticate, isAdmin } from '../../middleware/auth';
import { asyncHandler, sendSuccess, buildPaginationResult, getPaginationParams } from '../../utils/response';
import { prisma } from '../../config/database';
import { PaginationSchema } from '@tvs/shared';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const query = PaginationSchema.extend({
    isRead: z.coerce.boolean().optional(),
  }).parse(req.query);
  const { page, limit, isRead } = query;
  const { skip, take } = getPaginationParams(page, limit);

  const where: Prisma.NotificationWhereInput = {
    userId: req.user!.userId,
    ...(isRead !== undefined && { isRead }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip, take,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } }),
  ]);

  sendSuccess(res, {
    ...buildPaginationResult(notifications, total, page, limit),
    unreadCount,
  }, 'Notifications retrieved');
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true, readAt: new Date() },
  });
  sendSuccess(res, null, 'Notification marked as read');
}));

// PATCH /api/notifications/read-all
router.patch('/read-all', asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  sendSuccess(res, null, 'All notifications marked as read');
}));

// DELETE /api/notifications/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.deleteMany({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  sendSuccess(res, null, 'Notification deleted');
}));

export default router;
