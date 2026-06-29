import { Router, Request, Response } from 'express';
import { authenticate, isAdmin, isProjectManager } from '../../middleware/auth';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { prisma } from '../../config/database';
import { calculateUtilization, MONTHLY_CAPACITY_HOURS } from '@tvs/shared';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

// GET /api/capacity/overview - Department capacity overview
router.get('/overview', isProjectManager, asyncHandler(async (_req: Request, res: Response) => {
  const { month, year } = z.object({
    month: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
    year: z.coerce.number().default(new Date().getFullYear()),
  }).parse(_req.query);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: {
      employees: {
        where: { status: 'ACTIVE', deletedAt: null },
        include: {
          resourceAllocations: {
            where: {
              status: 'ACTIVE',
              startDate: { lte: endOfMonth },
              endDate: { gte: startOfMonth },
            },
            select: { allocatedHours: true },
          },
          capacityPlans: {
            where: { month, year },
            select: { capacityHours: true, allocatedHours: true, availableHours: true },
          },
        },
      },
    },
  });

  const overview = departments
    .filter(d => d.employees.length > 0)
    .map(dept => {
      const employeeCount = dept.employees.length;
      const totalCapacity = employeeCount * MONTHLY_CAPACITY_HOURS;
      const totalAllocated = dept.employees.reduce((sum, emp) =>
        sum + emp.resourceAllocations.reduce((s, a) => s + a.allocatedHours, 0), 0
      );
      const available = totalCapacity - totalAllocated;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        month, year,
        employeeCount,
        totalCapacity,
        totalAllocated,
        available,
        utilizationPercent: calculateUtilization(totalAllocated, totalCapacity),
        employees: dept.employees.map(emp => {
          const empAllocated = emp.resourceAllocations.reduce((s, a) => s + a.allocatedHours, 0);
          return {
            id: emp.id,
            employeeId: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            designation: emp.designation,
            capacity: MONTHLY_CAPACITY_HOURS,
            allocated: empAllocated,
            available: MONTHLY_CAPACITY_HOURS - empAllocated,
            utilization: calculateUtilization(empAllocated, MONTHLY_CAPACITY_HOURS),
          };
        }),
      };
    });

  sendSuccess(res, { month, year, departments: overview }, 'Capacity overview retrieved');
}));

// GET /api/capacity/forecast - 3-month forecast
router.get('/forecast', isProjectManager, asyncHandler(async (_req: Request, res: Response) => {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
  }

  const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE', deletedAt: null } });

  const forecast = await Promise.all(months.map(async ({ month, year }) => {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const allocationSums = await prisma.resourceAllocation.aggregate({
      where: {
        status: 'ACTIVE',
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
      _sum: { allocatedHours: true },
    });

    const totalCapacity = totalEmployees * MONTHLY_CAPACITY_HOURS;
    const totalAllocated = allocationSums._sum.allocatedHours || 0;

    return {
      month,
      year,
      label: new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      capacity: totalCapacity,
      allocated: totalAllocated,
      available: totalCapacity - totalAllocated,
      utilizationPercent: calculateUtilization(totalAllocated, totalCapacity),
    };
  }));

  sendSuccess(res, forecast, 'Capacity forecast retrieved');
}));

export default router;
