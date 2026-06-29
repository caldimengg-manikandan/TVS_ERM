const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find an allocation
  const alloc = await prisma.resourceAllocation.findFirst({
    where: { project: { projectCode: 'TVS-MFG-002' } },
    include: { project: true }
  });

  if (alloc) {
    console.log(`Fixing allocation for ${alloc.project.name} - Allocated: ${alloc.allocatedHours}h`);
    
    // We want actual < allocated, let's say actual = allocated - 5
    const targetHours = Math.max(0, alloc.allocatedHours - 5);
    
    // Get all timesheet entries for this project and employee
    const entries = await prisma.timesheetEntry.findMany({
      where: { projectId: alloc.projectId, timesheet: { employeeId: alloc.employeeId } },
      include: { timesheet: true }
    });

    console.log(`Found ${entries.length} entries`);
    
    // Set all entries to 0 first
    for (const entry of entries) {
      await prisma.timesheetEntry.update({
        where: { id: entry.id },
        data: {
          totalHours: 0,
          monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0
        }
      });
      // also update timesheet
      await prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: Math.max(0, entry.timesheet.totalHours - entry.totalHours) }
      });
    }

    if (entries.length > 0) {
      // Put targetHours into the first entry
      const entry = entries[0];
      await prisma.timesheetEntry.update({
        where: { id: entry.id },
        data: {
          totalHours: targetHours,
          monday: targetHours
        }
      });
      // update timesheet
      const ts = await prisma.timesheet.findUnique({ where: { id: entry.timesheetId } });
      await prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: ts.totalHours + targetHours }
      });
      console.log(`Set actual hours to ${targetHours}h`);
    }
  }

  const alloc2 = await prisma.resourceAllocation.findFirst({
    where: { project: { projectCode: 'TVS-ERM-001' } },
    include: { project: true }
  });

  if (alloc2) {
    console.log(`Fixing allocation for ${alloc2.project.name} - Allocated: ${alloc2.allocatedHours}h`);
    const targetHours = alloc2.allocatedHours - 20;
    
    const entries = await prisma.timesheetEntry.findMany({
      where: { projectId: alloc2.projectId, timesheet: { employeeId: alloc2.employeeId } },
      include: { timesheet: true }
    });

    for (const entry of entries) {
      await prisma.timesheetEntry.update({
        where: { id: entry.id },
        data: {
          totalHours: 0,
          monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0
        }
      });
      await prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: Math.max(0, entry.timesheet.totalHours - entry.totalHours) }
      });
    }

    if (entries.length > 0) {
      const entry = entries[0];
      await prisma.timesheetEntry.update({
        where: { id: entry.id },
        data: {
          totalHours: targetHours,
          monday: targetHours
        }
      });
      const ts = await prisma.timesheet.findUnique({ where: { id: entry.timesheetId } });
      await prisma.timesheet.update({
        where: { id: entry.timesheetId },
        data: { totalHours: ts.totalHours + targetHours }
      });
      console.log(`Set actual hours to ${targetHours}h`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
