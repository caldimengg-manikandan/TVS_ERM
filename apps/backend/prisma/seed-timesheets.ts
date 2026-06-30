import { PrismaClient } from '@prisma/client';
import { startOfWeek, endOfWeek, subWeeks, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting timesheet dummy data generation...');

  // Get all resource allocations
  const allocations = await prisma.resourceAllocation.findMany({
    include: {
      employee: true,
      project: {
        include: {
          tasks: true
        }
      }
    }
  });

  if (!allocations.length) {
    console.log('❌ No resource allocations found. Please run main seed first.');
    return;
  }

  const currentDate = new Date();
  const WEEKS_TO_GENERATE = 12; // ~3 months

  console.log(`Generating data for ${allocations.length} allocations over ${WEEKS_TO_GENERATE} weeks...`);

  let totalTimesheets = 0;
  let totalEntries = 0;

  for (let idx = 0; idx < allocations.length; idx++) {
    const allocation = allocations[idx];
    let task = allocation.project.tasks[0];
    if (!task) {
      task = await prisma.task.create({
        data: { projectId: allocation.projectId, name: 'General Project Work', status: 'IN_PROGRESS' }
      });
    }

    // UI TEST SCENARIOS (First 3 allocations)
    if (idx === 0) {
      // Scenario 1: Overrun (120 allocated, 130 actual, Delayed)
      await prisma.resourceAllocation.update({ where: { id: allocation.id }, data: { allocatedHours: 120 } });
      await prisma.project.update({ where: { id: allocation.projectId }, data: { endDate: addDays(currentDate, -5) } });
      
      const ts = await prisma.timesheet.create({
        data: { employeeId: allocation.employeeId, weekStartDate: startOfWeek(currentDate, { weekStartsOn: 1 }), weekEndDate: endOfWeek(currentDate, { weekStartsOn: 1 }), status: 'APPROVED', totalHours: 130, plannedHours: 120, submittedAt: new Date() }
      });
      await prisma.timesheetEntry.create({
        data: { timesheetId: ts.id, taskId: task.id, projectId: allocation.projectId, monday: 26, tuesday: 26, wednesday: 26, thursday: 26, friday: 26, totalHours: 130, description: 'Overrun Scenario' }
      });
      totalTimesheets++; totalEntries++;
      continue;
    }

    if (idx === 1) {
      // Scenario 2: Saved/Early (120 allocated, 90 actual, On Time/Early)
      await prisma.resourceAllocation.update({ where: { id: allocation.id }, data: { allocatedHours: 120 } });
      await prisma.project.update({ where: { id: allocation.projectId }, data: { endDate: addDays(currentDate, 10) } });
      
      const ts = await prisma.timesheet.create({
        data: { employeeId: allocation.employeeId, weekStartDate: startOfWeek(currentDate, { weekStartsOn: 1 }), weekEndDate: endOfWeek(currentDate, { weekStartsOn: 1 }), status: 'APPROVED', totalHours: 90, plannedHours: 120, submittedAt: new Date() }
      });
      await prisma.timesheetEntry.create({
        data: { timesheetId: ts.id, taskId: task.id, projectId: allocation.projectId, monday: 18, tuesday: 18, wednesday: 18, thursday: 18, friday: 18, totalHours: 90, description: 'Saved Scenario' }
      });
      totalTimesheets++; totalEntries++;
      continue;
    }

    if (idx === 2) {
      // Scenario 3: On Track (120 allocated, 60 actual, exactly 50%)
      await prisma.resourceAllocation.update({ where: { id: allocation.id }, data: { allocatedHours: 120 } });
      await prisma.project.update({ where: { id: allocation.projectId }, data: { endDate: addDays(currentDate, 15) } });
      
      const ts = await prisma.timesheet.create({
        data: { employeeId: allocation.employeeId, weekStartDate: startOfWeek(currentDate, { weekStartsOn: 1 }), weekEndDate: endOfWeek(currentDate, { weekStartsOn: 1 }), status: 'APPROVED', totalHours: 60, plannedHours: 60, submittedAt: new Date() }
      });
      await prisma.timesheetEntry.create({
        data: { timesheetId: ts.id, taskId: task.id, projectId: allocation.projectId, monday: 12, tuesday: 12, wednesday: 12, thursday: 12, friday: 12, totalHours: 60, description: 'On Track Scenario' }
      });
      totalTimesheets++; totalEntries++;
      continue;
    }

    // Default Random Generation for the rest
    const isOverWorker = allocation.employeeId.charCodeAt(0) % 3 === 0;
    const isUnderWorker = allocation.employeeId.charCodeAt(0) % 3 === 1;

    const weeklyAllocated = allocation.allocatedHours > 40 ? 40 : (allocation.allocatedHours || 40);
    
    let weeklyMultiplier = 1.0;
    if (isOverWorker) weeklyMultiplier = 1.25; 
    if (isUnderWorker) weeklyMultiplier = 0.75; 

    const targetHoursPerWeek = weeklyAllocated * weeklyMultiplier;
    const dailyHours = targetHoursPerWeek / 5;

    for (let i = 0; i < WEEKS_TO_GENERATE; i++) {
      const weekStart = startOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      let timesheet = await prisma.timesheet.findUnique({
        where: { employeeId_weekStartDate: { employeeId: allocation.employeeId, weekStartDate: weekStart } }
      });

      if (!timesheet) {
        timesheet = await prisma.timesheet.create({
          data: { employeeId: allocation.employeeId, weekStartDate: weekStart, weekEndDate: weekEnd, status: 'APPROVED', totalHours: targetHoursPerWeek, plannedHours: weeklyAllocated, submittedAt: new Date() }
        });
        totalTimesheets++;
      } else {
        timesheet = await prisma.timesheet.update({
          where: { id: timesheet.id },
          data: { totalHours: (timesheet.totalHours || 0) + targetHoursPerWeek, plannedHours: (timesheet.plannedHours || 0) + weeklyAllocated }
        });
      }

      await prisma.timesheetEntry.create({
        data: { timesheetId: timesheet.id, taskId: task.id, projectId: allocation.projectId, monday: dailyHours, tuesday: dailyHours, wednesday: dailyHours, thursday: dailyHours, friday: dailyHours, saturday: 0, sunday: 0, totalHours: targetHoursPerWeek, description: `Worked on ${task.name}` }
      });
      totalEntries++;
    }
  }

  console.log(`✅ Generated ${totalTimesheets} timesheets with ${totalEntries} entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
