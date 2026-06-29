import { prisma } from '../../config/database';
import { redisCache } from '../../config/redis';
import { SaveTimesheetInput, TimesheetStatus } from '@tvs/shared';
import { emitToUser, SOCKET_EVENTS } from '../../config/socket';
import { addDays, startOfWeek, format } from 'date-fns';

export class TimesheetService {
  async getWeeklyTimesheet(employeeId: string, weekStartDate: string) {
    const startDate = new Date(weekStartDate);
    const endDate = addDays(startDate, 6);

    let timesheet = await prisma.timesheet.findUnique({
      where: { employeeId_weekStartDate: { employeeId, weekStartDate: startDate } },
      include: {
        entries: {
          include: {
            task: { select: { id: true, name: true } },
            project: { select: { id: true, projectCode: true, name: true } },
          },
        },
        employee: { select: { id: true, employeeId: true, firstName: true, lastName: true } },
        approvedByTL: { select: { id: true, firstName: true, lastName: true } },
        approvedByAdmin: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // If no timesheet yet, return empty structure for the week
    if (!timesheet) {
      // Get employee's assigned tasks
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true, employeeId: true, firstName: true, lastName: true,
          taskAssignments: {
            where: {
              status: { in: ['OPEN', 'IN_PROGRESS', 'REVIEW'] },
              deletedAt: null,
            },
            include: {
              project: { select: { id: true, projectCode: true, name: true } },
            },
            take: 10,
          },
        },
      });

      return {
        id: null,
        employeeId,
        employee,
        weekStartDate: format(startDate, 'yyyy-MM-dd'),
        weekEndDate: format(endDate, 'yyyy-MM-dd'),
        status: 'DRAFT',
        totalHours: 0,
        plannedHours: 40,
        entries: [],
        suggestedTasks: employee?.taskAssignments || [],
      };
    }

    return timesheet;
  }

  async saveTimesheet(employeeId: string, data: SaveTimesheetInput) {
    const weekStart = new Date(data.weekStartDate);
    const weekEnd = addDays(weekStart, 6);

    // Validate daily hours don't exceed 24
    for (const entry of data.entries) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      for (const day of days) {
        if ((entry[day] as number) > 24) {
          throw new Error(`Daily hours cannot exceed 24 for ${day}`);
        }
      }
    }

    const totalHours = data.entries.reduce((sum, entry) => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      return sum + days.reduce((daySum, day) => daySum + (entry[day] as number), 0);
    }, 0);

    const status = data.status || 'DRAFT';

    const timesheet = await prisma.timesheet.upsert({
      where: { employeeId_weekStartDate: { employeeId, weekStartDate: weekStart } },
      update: {
        status,
        totalHours,
        submittedAt: status === 'SUBMITTED' ? new Date() : undefined,
      },
      create: {
        employeeId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        status,
        totalHours,
        plannedHours: 40,
        submittedAt: status === 'SUBMITTED' ? new Date() : undefined,
      },
    });

    // Upsert all entries
    await prisma.timesheetEntry.deleteMany({ where: { timesheetId: timesheet.id } });
    
    if (data.entries.length > 0) {
      const entries = data.entries.map(entry => ({
        timesheetId: timesheet.id,
        taskId: entry.taskId,
        projectId: entry.projectId,
        monday: entry.monday,
        tuesday: entry.tuesday,
        wednesday: entry.wednesday,
        thursday: entry.thursday,
        friday: entry.friday,
        saturday: entry.saturday,
        sunday: entry.sunday,
        totalHours: (entry.monday + entry.tuesday + entry.wednesday + entry.thursday + 
                     entry.friday + entry.saturday + entry.sunday),
        description: entry.description,
      }));

      await prisma.timesheetEntry.createMany({ data: entries });
    }

    // Notify Team Lead if submitted
    if (status === 'SUBMITTED') {
      await this.notifyApprovers(employeeId, timesheet.id);
    }

    return this.getWeeklyTimesheet(employeeId, data.weekStartDate);
  }

  async submitTimesheet(timesheetId: string, employeeId: string) {
    const timesheet = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
    if (!timesheet || timesheet.employeeId !== employeeId) throw new Error('Timesheet not found');
    if (timesheet.status !== 'DRAFT') throw new Error('Only draft timesheets can be submitted');

    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });

    await this.notifyApprovers(employeeId, timesheetId);
    return { message: 'Timesheet submitted for approval' };
  }

  async approveTimesheet(timesheetId: string, approverId: string, action: 'APPROVE' | 'REJECT', role: string, comments?: string) {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: { employee: { select: { userId: true } } },
    });
    if (!timesheet) throw new Error('Timesheet not found');

    let updateData: object = {};
    let newStatus: TimesheetStatus;

    if (role === 'TEAM_LEAD') {
      if (timesheet.status !== 'SUBMITTED') throw new Error('Timesheet must be submitted for TL approval');
      newStatus = action === 'APPROVE' ? TimesheetStatus.TEAM_LEAD_APPROVED : TimesheetStatus.REJECTED;
      updateData = {
        status: newStatus,
        approvedByTLId: approverId,
        approvedByTLAt: new Date(),
        tlComments: comments,
        ...(action === 'REJECT' && { rejectionReason: comments }),
      };
    } else {
      if (timesheet.status !== 'TEAM_LEAD_APPROVED') throw new Error('Timesheet must be TL approved first');
      newStatus = action === 'APPROVE' ? TimesheetStatus.APPROVED : TimesheetStatus.REJECTED;
      updateData = {
        status: newStatus,
        approvedByAdminId: approverId,
        approvedByAdminAt: new Date(),
        adminComments: comments,
        ...(action === 'REJECT' && { rejectionReason: comments }),
      };
    }

    await prisma.timesheet.update({ where: { id: timesheetId }, data: updateData });

    // Notify employee
    if (timesheet.employee.userId) {
      emitToUser(timesheet.employee.userId, SOCKET_EVENTS.TIMESHEET_STATUS_CHANGED, {
        timesheetId,
        status: newStatus,
        action,
      });
    }

    return { message: `Timesheet ${action === 'APPROVE' ? 'approved' : 'rejected'}` };
  }

  async getPendingApprovals(approverId: string, role: string) {
    const statusFilter = role === 'TEAM_LEAD' ? 'SUBMITTED' : 'TEAM_LEAD_APPROVED';
    
    return prisma.timesheet.findMany({
      where: { status: statusFilter },
      include: {
        employee: {
          select: {
            id: true, employeeId: true, firstName: true, lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async copyPreviousWeek(employeeId: string, targetWeekStart: string) {
    const targetDate = new Date(targetWeekStart);
    const previousWeekStart = addDays(targetDate, -7);
    
    const previousTimesheet = await prisma.timesheet.findUnique({
      where: {
        employeeId_weekStartDate: {
          employeeId,
          weekStartDate: previousWeekStart,
        },
      },
      include: { entries: true },
    });

    if (!previousTimesheet || previousTimesheet.entries.length === 0) {
      throw new Error('No timesheet found for previous week');
    }

    const entries = previousTimesheet.entries.map(e => ({
      taskId: e.taskId,
      projectId: e.projectId,
      monday: e.monday,
      tuesday: e.tuesday,
      wednesday: e.wednesday,
      thursday: e.thursday,
      friday: e.friday,
      saturday: e.saturday,
      sunday: e.sunday,
      totalHours: e.totalHours,
      description: e.description,
    }));

    return { entries, message: 'Previous week entries loaded' };
  }

  async getTimesheetSummary(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const timesheets = await prisma.timesheet.findMany({
      where: {
        employeeId,
        weekStartDate: { gte: startDate, lte: endDate },
      },
      include: { entries: true },
    });

    const totalActualHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
    const totalPlannedHours = 22 * 8; // Standard monthly hours
    const overtime = Math.max(0, totalActualHours - totalPlannedHours);

    return {
      month, year,
      totalPlannedHours,
      totalActualHours,
      remainingHours: Math.max(0, totalPlannedHours - totalActualHours),
      overtime,
      utilizationPercent: Math.round((totalActualHours / totalPlannedHours) * 100),
      timesheetCount: timesheets.length,
      approvedCount: timesheets.filter(ts => ts.status === 'APPROVED').length,
      pendingCount: timesheets.filter(ts => ['SUBMITTED', 'TEAM_LEAD_APPROVED'].includes(ts.status)).length,
    };
  }

  private async notifyApprovers(employeeId: string, timesheetId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { managerId: true, firstName: true, lastName: true },
    });

    if (!employee?.managerId) return;

    const manager = await prisma.employee.findUnique({
      where: { id: employee.managerId },
      select: { userId: true },
    });

    if (manager?.userId) {
      await prisma.notification.create({
        data: {
          userId: manager.userId,
          type: 'TIMESHEET_SUBMITTED',
          title: 'Timesheet Pending Approval',
          message: `${employee.firstName} ${employee.lastName} has submitted a timesheet for your approval.`,
          actionUrl: `/timesheets/approve/${timesheetId}`,
        },
      });

      emitToUser(manager.userId, SOCKET_EVENTS.NOTIFICATION_NEW, {
        type: 'TIMESHEET_SUBMITTED',
        message: `Timesheet from ${employee.firstName} ${employee.lastName} needs approval`,
      });
    }
  }
}

export const timesheetService = new TimesheetService();
