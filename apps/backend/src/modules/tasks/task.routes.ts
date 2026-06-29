import { Router, Request, Response } from 'express';
import { authenticate, isProjectManager, isTeamLead } from '../../middleware/auth';
import { asyncHandler, sendSuccess, sendCreated, buildPaginationResult, getPaginationParams } from '../../utils/response';
import { prisma } from '../../config/database';
import { CreateTaskSchema, UpdateTaskSchema, PaginationSchema } from '@tvs/shared';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate);

// GET /api/tasks
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const query = PaginationSchema.extend({
    projectId: z.string().optional(),
    assignedToId: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    milestoneId: z.string().optional(),
  }).parse(req.query);

  const { page, limit, search, projectId, assignedToId, status, priority, milestoneId } = query;
  const { skip, take } = getPaginationParams(page, limit);

  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    parentTaskId: null, // Top-level tasks only
    ...(projectId && { projectId }),
    ...(assignedToId && { assignedToId }),
    ...(status && { status: status as 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'COMPLETED' }),
    ...(priority && { priority: priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }),
    ...(milestoneId && { milestoneId }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, projectCode: true, name: true } },
        milestone: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, employeeId: true, firstName: true, lastName: true, avatar: true } },
        subtasks: {
          where: { deletedAt: null },
          select: { id: true, name: true, status: true, completionPercentage: true },
        },
        _count: { select: { subtasks: true } },
      },
      orderBy: [{ priority: 'asc' }, { endDate: 'asc' }],
      skip, take,
    }),
    prisma.task.count({ where }),
  ]);

  sendSuccess(res, buildPaginationResult(tasks, total, page, limit), 'Tasks retrieved');
}));

// GET /api/tasks/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id, deletedAt: null },
    include: {
      project: { select: { id: true, projectCode: true, name: true } },
      milestone: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, employeeId: true, firstName: true, lastName: true } },
      parent: { select: { id: true, name: true } },
      subtasks: {
        where: { deletedAt: null },
        include: {
          assignedTo: { select: { id: true, employeeId: true, firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!task) { sendSuccess(res, null, 'Task not found'); return; }
  sendSuccess(res, task, 'Task retrieved');
}));

// POST /api/tasks
router.post('/', isTeamLead, asyncHandler(async (req: Request, res: Response) => {
  const data = CreateTaskSchema.parse(req.body);
  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      parentTaskId: data.parentTaskId,
      name: data.name,
      description: data.description,
      assignedToId: data.assignedToId,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'OPEN',
      estimatedHours: data.estimatedHours || 0,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  sendCreated(res, task, 'Task created');
}));

// PUT /api/tasks/:id
router.put('/:id', isTeamLead, asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateTaskSchema.parse(req.body);
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.priority && { priority: data.priority }),
      ...(data.status && { status: data.status }),
      ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.milestoneId !== undefined && { milestoneId: data.milestoneId }),
    },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Update project completion
  const { projectService } = await import('../projects/project.service');
  await projectService.updateProgress(task.projectId);

  sendSuccess(res, task, 'Task updated');
}));

// PATCH /api/tasks/:id/status - Quick status update
router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { status, completionPercentage } = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED']),
    completionPercentage: z.number().min(0).max(100).optional(),
  }).parse(req.body);

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(completionPercentage !== undefined && { completionPercentage }),
      ...(status === 'COMPLETED' && { completionPercentage: 100 }),
    },
  });

  const { projectService } = await import('../projects/project.service');
  await projectService.updateProgress(task.projectId);

  sendSuccess(res, task, 'Task status updated');
}));

// DELETE /api/tasks/:id
router.delete('/:id', isTeamLead, asyncHandler(async (req: Request, res: Response) => {
  await prisma.task.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  sendSuccess(res, null, 'Task deleted');
}));

export default router;
