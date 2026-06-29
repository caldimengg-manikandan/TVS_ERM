import { Router, Request, Response } from 'express';
import { authenticate, isAdmin, isProjectManager } from '../../middleware/auth';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { prisma } from '../../config/database';
import { redisCache } from '../../config/redis';
import { calculateUtilization, MONTHLY_CAPACITY_HOURS } from '@tvs/shared';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/kpis
router.get('/kpis', asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `dashboard:kpis:${req.user!.role}`;
  const cached = await redisCache.get(cacheKey);
  if (cached) {
    sendSuccess(res, cached, 'Dashboard KPIs retrieved');
    return;
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const [
    totalProjects, activeProjects, completedProjects, delayedProjects,
    totalEmployees, activeAllocations, pendingTimesheets, pendingTLApprovals, pendingAdminApprovals,
  ] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.project.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.project.count({ where: { status: 'COMPLETED', deletedAt: null } }),
    prisma.project.count({ where: { status: 'ACTIVE', endDate: { lt: now }, deletedAt: null } }),
    prisma.employee.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.resourceAllocation.aggregate({
      where: {
        status: 'ACTIVE',
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
      _sum: { allocatedHours: true },
      _count: { employeeId: true },
    }),
    prisma.timesheet.count({ where: { status: 'DRAFT' } }),
    prisma.timesheet.count({ where: { status: 'SUBMITTED' } }),
    prisma.timesheet.count({ where: { status: 'TEAM_LEAD_APPROVED' } }),
  ]);

  const totalCapacity = totalEmployees * MONTHLY_CAPACITY_HOURS;
  const totalAllocated = activeAllocations._sum.allocatedHours || 0;
  const avgUtilization = calculateUtilization(totalAllocated, totalCapacity);
  const availableCapacity = totalCapacity - totalAllocated;

  const kpis = {
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    totalEmployees,
    resourceUtilization: avgUtilization,
    availableCapacity,
    pendingTimesheets,
    pendingApprovals: pendingTLApprovals + pendingAdminApprovals,
  };

  await redisCache.set(cacheKey, kpis, 300);
  sendSuccess(res, kpis, 'Dashboard KPIs retrieved');
}));

// GET /api/dashboard/project-progress
router.get('/project-progress', isProjectManager, asyncHandler(async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { status: { in: ['ACTIVE', 'ON_HOLD'] }, deletedAt: null },
    select: {
      id: true,
      name: true,
      projectCode: true,
      status: true,
      completionPercentage: true,
      startDate: true,
      endDate: true,
      plannedHours: true,
      actualHours: true,
    },
    orderBy: { completionPercentage: 'desc' },
    take: 10,
  });

  const now = new Date();
  const chartData = projects.map(p => {
    const totalDays = (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const plannedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    return {
      projectName: `${p.projectCode} - ${p.name.substring(0, 20)}`,
      plannedProgress,
      actualProgress: p.completionPercentage,
      status: p.status,
    };
  });

  sendSuccess(res, chartData, 'Project progress retrieved');
}));

// GET /api/dashboard/resource-utilization
router.get('/resource-utilization', isProjectManager, asyncHandler(async (req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: {
      employees: {
        where: { status: 'ACTIVE', deletedAt: null },
        include: {
          resourceAllocations: {
            where: { status: 'ACTIVE' },
            select: { allocatedHours: true },
          },
        },
      },
    },
  });

  const chartData = departments
    .filter(d => d.employees.length > 0)
    .map(dept => {
      const totalCapacity = dept.employees.length * MONTHLY_CAPACITY_HOURS;
      const totalAllocated = dept.employees.reduce((sum, emp) =>
        sum + emp.resourceAllocations.reduce((s, a) => s + a.allocatedHours, 0), 0
      );
      return {
        name: dept.name,
        capacity: totalCapacity,
        utilized: totalAllocated,
        available: totalCapacity - totalAllocated,
        utilizationPercent: calculateUtilization(totalAllocated, totalCapacity),
      };
    });

  sendSuccess(res, chartData, 'Resource utilization by department retrieved');
}));

// GET /api/dashboard/monthly-hours
router.get('/monthly-hours', asyncHandler(async (req: Request, res: Response) => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
  }

  const chartData = await Promise.all(months.map(async ({ month, year }) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const timesheet = await prisma.timesheet.aggregate({
      where: {
        weekStartDate: { gte: startDate, lte: endDate },
        status: 'APPROVED',
      },
      _sum: { totalHours: true, plannedHours: true },
    });

    const actual = timesheet._sum.totalHours || 0;
    const planned = timesheet._sum.plannedHours || 0;

    return {
      month: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      planned,
      actual,
      overtime: Math.max(0, actual - planned),
    };
  }));

  sendSuccess(res, chartData, 'Monthly hours chart retrieved');
}));

// GET /api/dashboard/recent-activities
router.get('/recent-activities', asyncHandler(async (req: Request, res: Response) => {
  const activities = await prisma.activityLog.findMany({
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  sendSuccess(res, activities, 'Recent activities retrieved');
}));

// GET /api/dashboard/upcoming-deadlines
router.get('/upcoming-deadlines', isProjectManager, asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [projects, tasks, milestones] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now, lte: in14Days }, deletedAt: null },
      select: { id: true, projectCode: true, name: true, endDate: true, status: true },
      orderBy: { endDate: 'asc' },
      take: 5,
    }),
    prisma.task.findMany({
      where: { status: { not: 'COMPLETED' }, endDate: { gte: now, lte: in14Days }, deletedAt: null },
      select: { id: true, name: true, endDate: true, status: true, priority: true,
                project: { select: { name: true } }, assignedTo: { select: { firstName: true, lastName: true } } },
      orderBy: { endDate: 'asc' },
      take: 10,
    }),
    prisma.milestone.findMany({
      where: { status: { not: 'COMPLETED' }, plannedEndDate: { gte: now, lte: in14Days } },
      select: { id: true, name: true, plannedEndDate: true, status: true,
                project: { select: { name: true } } },
      orderBy: { plannedEndDate: 'asc' },
      take: 5,
    }),
  ]);

  sendSuccess(res, { projects, tasks, milestones }, 'Upcoming deadlines retrieved');
}));

export default router;
