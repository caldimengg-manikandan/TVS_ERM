import { prisma } from '../../config/database';
import { redisCache } from '../../config/redis';
import { buildPaginationResult, getPaginationParams } from '../../utils/response';
import { CreateAllocationInput, UpdateAllocationInput, calculateUtilization, getResourceStatus, MONTHLY_CAPACITY_HOURS } from '@tvs/shared';
import { ResourceAllocationRow } from '@tvs/shared';

export class ResourceService {
  async getAllocationGrid(params: {
    page: number; limit: number; search?: string;
    departmentId?: string; projectId?: string;
    month?: number; year?: number;
  }): Promise<{ data: ResourceAllocationRow[]; meta: object }> {
    const { page, limit, search, departmentId, projectId, month = new Date().getMonth() + 1, year = new Date().getFullYear() } = params;
    const { skip, take } = getPaginationParams(page, limit);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const employeeWhere = {
      deletedAt: null,
      status: 'ACTIVE' as const,
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { employeeId: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: employeeWhere,
        include: {
          department: { select: { id: true, name: true, code: true } },
          resourceAllocations: {
            where: {
              status: 'ACTIVE',
              startDate: { lte: endOfMonth },
              endDate: { gte: startOfMonth },
              ...(projectId && { projectId }),
            },
            include: { project: { select: { id: true, name: true, projectCode: true } } },
          },
        },
        skip,
        take,
        orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }],
      }),
      prisma.employee.count({ where: employeeWhere }),
    ]);

    let sNo = (page - 1) * limit + 1;
    const rows: ResourceAllocationRow[] = employees.map(emp => {
      const allocatedHours = emp.resourceAllocations.reduce((sum, a) => sum + a.allocatedHours, 0);
      const capacityHours = MONTHLY_CAPACITY_HOURS;
      const availableHours = Math.max(0, capacityHours - allocatedHours);
      const balanceHours = availableHours;
      const utilizationPercent = calculateUtilization(allocatedHours, capacityHours);
      const primaryAllocation = emp.resourceAllocations[0];

      return {
        sNo: sNo++,
        employeeId: emp.employeeId,
        employeeDbId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        role: emp.designation,
        department: emp.department.name,
        currentProject: primaryAllocation?.project?.name || 'Unallocated',
        currentHours: allocatedHours,
        capacityHours,
        allocatedHours,
        availableHours,
        balanceHours,
        utilizationPercent,
        resourceStatus: getResourceStatus(utilizationPercent),
      };
    });

    return {
      data: rows,
      meta: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async allocate(data: CreateAllocationInput, approvedById?: string) {
    // Check for overlapping allocations
    const overlap = await prisma.resourceAllocation.findFirst({
      where: {
        employeeId: data.employeeId,
        projectId: data.projectId,
        status: 'ACTIVE',
        startDate: { lte: new Date(data.endDate) },
        endDate: { gte: new Date(data.startDate) },
      },
    });

    if (overlap) {
      // Update existing rather than creating duplicate
      return this.updateAllocation(overlap.id, { allocatedHours: data.allocatedHours });
    }

    const allocation = await prisma.resourceAllocation.create({
      data: {
        employeeId: data.employeeId,
        projectId: data.projectId,
        allocatedHours: data.allocatedHours,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        notes: data.notes,
        approvedById,
        status: 'ACTIVE',
      },
      include: {
        employee: { select: { id: true, employeeId: true, firstName: true, lastName: true } },
        project: { select: { id: true, projectCode: true, name: true } },
      },
    });

    await this.updateCapacityPlan(data.employeeId, data.startDate);
    return allocation;
  }

  async bulkAllocate(projectId: string, allocations: CreateAllocationInput[], approvedById?: string) {
    const results = await Promise.allSettled(
      allocations.map(a => this.allocate({ ...a, projectId }, approvedById))
    );

    return {
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map((r, i) => ({
        employeeId: allocations[i].employeeId,
        status: r.status,
        error: r.status === 'rejected' ? (r.reason as Error).message : undefined,
      })),
    };
  }

  async updateAllocation(id: string, data: Partial<UpdateAllocationInput>) {
    const allocation = await prisma.resourceAllocation.findUnique({ where: { id } });
    if (!allocation) throw new Error('Allocation not found');

    const updated = await prisma.resourceAllocation.update({
      where: { id },
      data: {
        ...(data.allocatedHours !== undefined && { allocatedHours: data.allocatedHours }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    await this.updateCapacityPlan(allocation.employeeId, allocation.startDate.toISOString());
    return updated;
  }

  async cancelAllocation(id: string) {
    const allocation = await prisma.resourceAllocation.findUnique({ where: { id } });
    if (!allocation) throw new Error('Allocation not found');

    await prisma.resourceAllocation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.updateCapacityPlan(allocation.employeeId, allocation.startDate.toISOString());
  }

  async getEmployeeAllocations(employeeId: string) {
    const allocations = await prisma.resourceAllocation.findMany({
      where: { employeeId, status: 'ACTIVE' },
      include: { project: { select: { id: true, projectCode: true, name: true, status: true, endDate: true, completionPercentage: true, plannedHours: true } } },
      orderBy: { startDate: 'asc' },
    });

    for (const alloc of allocations) {
      const timesheetStats = await prisma.timesheetEntry.findMany({
        where: {
          projectId: alloc.projectId,
          timesheet: { employeeId: employeeId }
        },
        include: {
          timesheet: {
            select: { weekStartDate: true, weekEndDate: true }
          }
        },
        orderBy: {
          timesheet: { weekStartDate: 'asc' }
        }
      });

      const actualHours = timesheetStats.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
      (alloc as any).actualHours = actualHours;
      
      if (timesheetStats.length > 0) {
        (alloc as any).actualStartDate = timesheetStats[0].timesheet.weekStartDate;
        (alloc as any).actualEndDate = timesheetStats[timesheetStats.length - 1].timesheet.weekEndDate;
      } else {
        (alloc as any).actualStartDate = null;
        (alloc as any).actualEndDate = null;
      }
    }

    return allocations;
  }

  async getProjectAllocations(projectId: string) {
    return prisma.resourceAllocation.findMany({
      where: { projectId, status: 'ACTIVE' },
      include: {
        employee: {
          select: {
            id: true, employeeId: true, firstName: true, lastName: true,
            designation: true, department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUtilizationSummary(month: number, year: number) {
    const cacheKey = `utilization:${year}:${month}`;
    const cached = await redisCache.get<object>(cacheKey);
    if (cached) return cached;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const allocations = await prisma.resourceAllocation.groupBy({
      by: ['employeeId'],
      where: {
        status: 'ACTIVE',
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
      _sum: { allocatedHours: true },
    });

    const totalEmployees = await prisma.employee.count({ where: { deletedAt: null, status: 'ACTIVE' } });
    const allocatedCount = allocations.length;
    const totalAllocatedHours = allocations.reduce((sum, a) => sum + (a._sum.allocatedHours || 0), 0);
    const totalCapacityHours = totalEmployees * MONTHLY_CAPACITY_HOURS;

    const result = {
      month, year,
      totalEmployees,
      allocatedEmployees: allocatedCount,
      unallocatedEmployees: totalEmployees - allocatedCount,
      totalCapacityHours,
      totalAllocatedHours,
      avgUtilizationPercent: calculateUtilization(totalAllocatedHours, totalCapacityHours),
    };

    await redisCache.set(cacheKey, result, 600);
    return result;
  }

  private async updateCapacityPlan(employeeId: string, dateStr: string | Date) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true },
    });
    if (!employee) return;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const totalAllocated = await prisma.resourceAllocation.aggregate({
      where: {
        employeeId,
        status: 'ACTIVE',
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
      _sum: { allocatedHours: true },
    });

    const allocatedHours = totalAllocated._sum.allocatedHours || 0;
    const capacityHours = MONTHLY_CAPACITY_HOURS;

    await prisma.capacityPlan.upsert({
      where: { employeeId_month_year: { employeeId, month, year } },
      update: { allocatedHours, availableHours: Math.max(0, capacityHours - allocatedHours) },
      create: {
        employeeId,
        departmentId: employee.departmentId,
        month, year,
        capacityHours,
        allocatedHours,
        availableHours: Math.max(0, capacityHours - allocatedHours),
      },
    });

    await redisCache.delPattern(`capacity:${year}:${month}:*`);
    await redisCache.delPattern(`utilization:${year}:${month}`);
  }
}

export const resourceService = new ResourceService();
