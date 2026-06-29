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

  for (const allocation of allocations) {
    // Determine worker performance randomly but deterministically
    const isOverWorker = allocation.employeeId.charCodeAt(0) % 3 === 0;
    const isUnderWorker = allocation.employeeId.charCodeAt(0) % 3 === 1;

    const weeklyAllocated = allocation.allocatedHours > 40 ? 40 : (allocation.allocatedHours || 40);
    
    let weeklyMultiplier = 1.0;
    if (isOverWorker) weeklyMultiplier = 1.25; // 25% extra hours
    if (isUnderWorker) weeklyMultiplier = 0.75; // 25% less hours (fast working)

    const targetHoursPerWeek = weeklyAllocated * weeklyMultiplier;
    const dailyHours = targetHoursPerWeek / 5; // Monday to Friday

    let task = allocation.project.tasks[0];
    if (!task) {
      task = await prisma.task.create({
        data: {
          projectId: allocation.projectId,
          name: 'General Project Work',
          status: 'IN_PROGRESS',
        }
      });
    }

    for (let i = 0; i < WEEKS_TO_GENERATE; i++) {
      const weekStart = startOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Sunday

      let timesheet = await prisma.timesheet.findUnique({
        where: {
          employeeId_weekStartDate: {
            employeeId: allocation.employeeId,
            weekStartDate: weekStart
          }
        }
      });

      if (!timesheet) {
        timesheet = await prisma.timesheet.create({
          data: {
            employeeId: allocation.employeeId,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            status: 'APPROVED',
            totalHours: targetHoursPerWeek,
            plannedHours: weeklyAllocated,
            submittedAt: new Date(),
          }
        });
        totalTimesheets++;
      } else {
        timesheet = await prisma.timesheet.update({
          where: { id: timesheet.id },
          data: {
            totalHours: (timesheet.totalHours || 0) + targetHoursPerWeek,
            plannedHours: (timesheet.plannedHours || 0) + weeklyAllocated
          }
        });
      }

      await prisma.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          taskId: task.id,
          projectId: allocation.projectId,
          monday: dailyHours,
          tuesday: dailyHours,
          wednesday: dailyHours,
          thursday: dailyHours,
          friday: dailyHours,
          saturday: 0,
          sunday: 0,
          totalHours: targetHoursPerWeek,
          description: `Worked on ${task.name}`
        }
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
