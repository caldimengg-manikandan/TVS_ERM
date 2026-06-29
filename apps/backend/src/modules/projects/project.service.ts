import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { redisCache } from '../../config/redis';
import { buildPaginationResult, getPaginationParams } from '../../utils/response';
import { CreateProjectInput, UpdateProjectInput } from '@tvs/shared';

export class ProjectService {
  async getAll(params: {
    page: number; limit: number; search?: string;
    status?: string; departmentId?: string;
    sortBy?: string; sortOrder?: string;
  }) {
    const { page, limit, search, status, departmentId, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const { skip, take } = getPaginationParams(page, limit);

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(status && { status: status as 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED' }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { projectCode: { contains: search, mode: 'insensitive' } },
          { clientName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          _count: { select: { members: true, tasks: true, milestones: true } },
        },
        orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
        skip,
        take,
      }),
      prisma.project.count({ where }),
    ]);

    const now = new Date();
    const enriched = projects.map(p => ({
      ...p,
      isDelayed: p.endDate < now && p.status !== 'COMPLETED',
      daysRemaining: Math.ceil((p.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      teamCount: p._count.members,
    }));

    return buildPaginationResult(enriched, total, page, limit);
  }

  async getById(id: string) {
    const cached = await redisCache.get<object>(`project:${id}`);
    if (cached) return cached;

    const project = await prisma.project.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: { select: { id: true, name: true, code: true } },
        members: {
          where: { isActive: true },
          include: {
            employee: { select: { id: true, employeeId: true, firstName: true, lastName: true, designation: true, avatar: true } },
          },
        },
        milestones: { orderBy: { plannedStartDate: 'asc' } },
        _count: { select: { tasks: true, documents: true } },
      },
    });

    if (!project) throw new Error('Project not found');

    const now = new Date();
    const result = {
      ...project,
      isDelayed: project.endDate < now && project.status !== 'COMPLETED',
      daysRemaining: Math.ceil((project.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    };

    await redisCache.set(`project:${id}`, result, 120);
    return result;
  }

  async create(data: CreateProjectInput, createdById?: string) {
    const existing = await prisma.project.findUnique({ where: { projectCode: data.projectCode } });
    if (existing) throw new Error('Project code already exists');

    const project = await prisma.project.create({
      data: {
        projectCode: data.projectCode,
        name: data.name,
        clientName: data.clientName,
        departmentId: data.departmentId,
        status: data.status || 'YET_TO_START',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        plannedHours: data.plannedHours || 0,
        createdById,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    await redisCache.delPattern('projects:*');
    return project;
  }

  async update(id: string, data: UpdateProjectInput) {
    const project = await prisma.project.findUnique({ where: { id, deletedAt: null } });
    if (!project) throw new Error('Project not found');

    if (data.projectCode && data.projectCode !== project.projectCode) {
      const existing = await prisma.project.findUnique({ where: { projectCode: data.projectCode } });
      if (existing) throw new Error('Project code already in use');
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.clientName !== undefined && { clientName: data.clientName }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.status && { status: data.status }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.plannedHours !== undefined && { plannedHours: data.plannedHours }),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    await redisCache.del(`project:${id}`);
    await redisCache.delPattern('projects:*');
    return updated;
  }

  async archive(id: string) {
    await prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    await redisCache.del(`project:${id}`);
  }

  async delete(id: string) {
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
    await redisCache.del(`project:${id}`);
  }

  async clone(id: string, data: { name: string; projectCode: string; startDate: string; endDate: string; includeTasks: boolean }) {
    const source = await prisma.project.findUnique({ where: { id, deletedAt: null } });
    if (!source) throw new Error('Source project not found');

    const cloned = await prisma.project.create({
      data: {
        projectCode: data.projectCode,
        name: data.name,
        clientName: source.clientName,
        departmentId: source.departmentId,
        status: 'YET_TO_START',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        plannedHours: source.plannedHours,
      },
    });

    if (data.includeTasks) {
      const tasks = await prisma.task.findMany({
        where: { projectId: id, parentTaskId: null, deletedAt: null },
      });
      await Promise.all(tasks.map(task =>
        prisma.task.create({
          data: {
            projectId: cloned.id,
            name: task.name,
            description: task.description,
            priority: task.priority,
            status: 'OPEN',
            estimatedHours: task.estimatedHours,
          },
        })
      ));
    }

    return cloned;
  }

  async addMember(projectId: string, employeeId: string, role: string) {
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_employeeId: { projectId, employeeId } },
    });

    if (existing) {
      return prisma.projectMember.update({
        where: { projectId_employeeId: { projectId, employeeId } },
        data: { isActive: true, role, leftAt: null },
      });
    }

    return prisma.projectMember.create({ data: { projectId, employeeId, role } });
  }

  async removeMember(projectId: string, employeeId: string) {
    await prisma.projectMember.update({
      where: { projectId_employeeId: { projectId, employeeId } },
      data: { isActive: false, leftAt: new Date() },
    });
    await redisCache.del(`project:${projectId}`);
  }

  async updateProgress(projectId: string) {
    const tasks = await prisma.task.findMany({
      where: { projectId, deletedAt: null },
      select: { completionPercentage: true },
    });

    if (tasks.length === 0) return;

    const avgProgress = tasks.reduce((sum, t) => sum + t.completionPercentage, 0) / tasks.length;
    await prisma.project.update({
      where: { id: projectId },
      data: { completionPercentage: Math.round(avgProgress) },
    });
    await redisCache.del(`project:${projectId}`);
  }
}

export const projectService = new ProjectService();
