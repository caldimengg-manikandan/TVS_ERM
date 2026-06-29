import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { redisCache } from '../../config/redis';
import { buildPaginationResult, getPaginationParams } from '../../utils/response';
import { CreateEmployeeInput, UpdateEmployeeInput } from '@tvs/shared';
import bcrypt from 'bcryptjs';

export class EmployeeService {
  private readonly CACHE_TTL = 300; // 5 minutes

  async getAll(params: {
    page: number; limit: number; search?: string;
    departmentId?: string; status?: string; sortBy?: string; sortOrder?: string;
  }) {
    const { page, limit, search, departmentId, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const { skip, take } = getPaginationParams(page, limit);

    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      ...(departmentId && { departmentId }),
      ...(status && { status: status as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
          { designation: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          manager: { select: { id: true, employeeId: true, firstName: true, lastName: true } },
        },
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
        skip,
        take,
      }),
      prisma.employee.count({ where }),
    ]);

    return buildPaginationResult(
      employees.map(e => ({ ...e, fullName: `${e.firstName} ${e.lastName}` })),
      total, page, limit
    );
  }

  async getById(id: string) {
    const cached = await redisCache.get<object>(`employee:${id}`);
    if (cached) return cached;

    const employee = await prisma.employee.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, employeeId: true, firstName: true, lastName: true, designation: true } },
        user: { select: { id: true, email: true, role: true, lastLoginAt: true } },
        resourceAllocations: {
          where: { status: 'ACTIVE' },
          include: { project: { select: { id: true, projectCode: true, name: true, status: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!employee) throw new Error('Employee not found');

    const result = { ...employee, fullName: `${employee.firstName} ${employee.lastName}` };
    await redisCache.set(`employee:${id}`, result, this.CACHE_TTL);
    return result;
  }

  async create(data: CreateEmployeeInput, createdById?: string) {
    // Check unique constraints
    const [emailExists, empIdExists] = await Promise.all([
      prisma.employee.findUnique({ where: { email: data.email } }),
      prisma.employee.findUnique({ where: { employeeId: data.employeeId } }),
    ]);

    if (emailExists) throw new Error('Employee with this email already exists');
    if (empIdExists) throw new Error('Employee ID already exists');

    // Create user account if not provided
    let userId = data.userId;
    if (!userId) {
      const tempPassword = await bcrypt.hash('TVS@2024', 12);
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: tempPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'EMPLOYEE',
        },
      });
      userId = user.id;
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId: data.employeeId,
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId,
        designation: data.designation,
        managerId: data.managerId,
        skills: data.skills || [],
        experienceYears: data.experienceYears || 0,
        joiningDate: new Date(data.joiningDate),
        status: data.status || 'ACTIVE',
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    return { ...employee, fullName: `${employee.firstName} ${employee.lastName}` };
  }

  async update(id: string, data: UpdateEmployeeInput) {
    const employee = await prisma.employee.findUnique({ where: { id, deletedAt: null } });
    if (!employee) throw new Error('Employee not found');

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.designation && { designation: data.designation }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.skills && { skills: data.skills }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.joiningDate && { joiningDate: new Date(data.joiningDate) }),
        ...(data.status && { status: data.status }),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    await redisCache.del(`employee:${id}`);
    return { ...updated, fullName: `${updated.firstName} ${updated.lastName}` };
  }

  async delete(id: string) {
    const employee = await prisma.employee.findUnique({ where: { id, deletedAt: null } });
    if (!employee) throw new Error('Employee not found');

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await redisCache.del(`employee:${id}`);
  }

  async getAvailability(id: string, month: number, year: number) {
    const employee = await prisma.employee.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!employee) throw new Error('Employee not found');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const allocations = await prisma.resourceAllocation.findMany({
      where: {
        employeeId: id,
        status: 'ACTIVE',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: { project: { select: { id: true, name: true, projectCode: true } } },
    });

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
    const capacityHours = 22 * 8; // 176 hours
    const availableHours = Math.max(0, capacityHours - totalAllocated);

    return {
      employee: { ...employee, fullName: `${employee.firstName} ${employee.lastName}` },
      month, year,
      capacityHours,
      allocatedHours: totalAllocated,
      availableHours,
      utilizationPercent: Math.round((totalAllocated / capacityHours) * 100),
      allocations,
    };
  }

  async getSkillMatrix(departmentId?: string) {
    const employees = await prisma.employee.findMany({
      where: { deletedAt: null, status: 'ACTIVE', ...(departmentId && { departmentId }) },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        designation: true,
        skills: true,
        department: { select: { name: true } },
      },
    });

    // Build skill frequency map
    const skillMap: Record<string, number> = {};
    employees.forEach(e => {
      e.skills.forEach(skill => {
        skillMap[skill] = (skillMap[skill] || 0) + 1;
      });
    });

    return {
      employees: employees.map(e => ({ ...e, fullName: `${e.firstName} ${e.lastName}` })),
      skillFrequency: Object.entries(skillMap)
        .sort((a, b) => b[1] - a[1])
        .map(([skill, count]) => ({ skill, count })),
    };
  }
}

export const employeeService = new EmployeeService();
