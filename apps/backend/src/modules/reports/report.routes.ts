import { Router, Request, Response } from 'express';
import { authenticate, isAdmin, isProjectManager } from '../../middleware/auth';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { prisma } from '../../config/database';
import { calculateUtilization, MONTHLY_CAPACITY_HOURS } from '@tvs/shared';
import { z } from 'zod';

const router = Router();
router.use(authenticate, isProjectManager);

// GET /api/reports/resource-utilization
router.get('/resource-utilization', asyncHandler(async (req: Request, res: Response) => {
  const { month, year, departmentId } = z.object({
    month: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
    year: z.coerce.number().default(new Date().getFullYear()),
    departmentId: z.string().optional(),
  }).parse(req.query);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const employees = await prisma.employee.findMany({
    where: {
      status: 'ACTIVE', deletedAt: null,
      ...(departmentId && { departmentId }),
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      resourceAllocations: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
        select: { allocatedHours: true },
      },
      timesheets: {
        where: { weekStartDate: { gte: startOfMonth, lte: endOfMonth } },
        select: { totalHours: true, status: true },
      },
    },
    orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }],
  });

  const reportData = employees.map(emp => {
    const allocated = emp.resourceAllocations.reduce((s, a) => s + a.allocatedHours, 0);
    const logged = emp.timesheets
      .filter(ts => ts.status === 'APPROVED')
      .reduce((s, ts) => s + ts.totalHours, 0);

    return {
      employeeId: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation,
      department: emp.department.name,
      capacityHours: MONTHLY_CAPACITY_HOURS,
      allocatedHours: allocated,
      loggedHours: logged,
      utilizationPercent: calculateUtilization(logged, MONTHLY_CAPACITY_HOURS),
      allocationPercent: calculateUtilization(allocated, MONTHLY_CAPACITY_HOURS),
    };
  });

  sendSuccess(res, { month, year, data: reportData }, 'Resource utilization report retrieved');
}));

// GET /api/reports/project-progress
router.get('/project-progress', asyncHandler(async (_req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    include: {
      department: { select: { name: true } },
      projectManager: { select: { firstName: true, lastName: true } },
      milestones: { select: { status: true, weight: true, completionPercentage: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const data = projects.map(p => ({
    projectCode: p.projectCode,
    projectName: p.name,
    department: p.department?.name || 'N/A',
    projectManager: p.projectManager ? `${p.projectManager.firstName} ${p.projectManager.lastName}` : 'Unassigned',
    status: p.status,
    priority: p.priority,
    startDate: p.startDate,
    endDate: p.endDate,
    plannedHours: p.plannedHours,
    actualHours: p.actualHours,
    completionPercent: p.completionPercentage,
    isDelayed: p.endDate < now && p.status !== 'COMPLETED',
    daysRemaining: Math.ceil((p.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  sendSuccess(res, { data }, 'Project progress report retrieved');
}));

// GET /api/reports/timesheet-summary
router.get('/timesheet-summary', asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = z.object({
    month: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
    year: z.coerce.number().default(new Date().getFullYear()),
  }).parse(req.query);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const timesheets = await prisma.timesheet.findMany({
    where: { weekStartDate: { gte: startDate, lte: endDate } },
    include: {
      employee: {
        select: {
          employeeId: true, firstName: true, lastName: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { weekStartDate: 'asc' },
  });

  const summary = {
    total: timesheets.length,
    draft: timesheets.filter(ts => ts.status === 'DRAFT').length,
    submitted: timesheets.filter(ts => ts.status === 'SUBMITTED').length,
    tlApproved: timesheets.filter(ts => ts.status === 'TEAM_LEAD_APPROVED').length,
    approved: timesheets.filter(ts => ts.status === 'APPROVED').length,
    rejected: timesheets.filter(ts => ts.status === 'REJECTED').length,
    totalHours: timesheets.reduce((s, ts) => s + ts.totalHours, 0),
  };

  sendSuccess(res, { month, year, summary, timesheets }, 'Timesheet report retrieved');
}));

export default router;
