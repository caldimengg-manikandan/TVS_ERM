import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // Departments
  // ============================================
  const departments = await Promise.all([
    prisma.department.upsert({ where: { code: 'ENGG' }, update: {}, create: { name: 'Engineering', code: 'ENGG', description: 'Software Engineering Department' } }),
    prisma.department.upsert({ where: { code: 'MGMT' }, update: {}, create: { name: 'Management', code: 'MGMT', description: 'Project Management Office' } }),
    prisma.department.upsert({ where: { code: 'QA' }, update: {}, create: { name: 'Quality Assurance', code: 'QA', description: 'Testing and QA' } }),
    prisma.department.upsert({ where: { code: 'DEVOPS' }, update: {}, create: { name: 'DevOps', code: 'DEVOPS', description: 'Infrastructure and DevOps' } }),
    prisma.department.upsert({ where: { code: 'DESIGN' }, update: {}, create: { name: 'Design', code: 'DESIGN', description: 'UI/UX Design' } }),
    prisma.department.upsert({ where: { code: 'HR' }, update: {}, create: { name: 'Human Resources', code: 'HR', description: 'HR Department' } }),
  ]);

  const [engDept, mgmtDept, qaDept, devopsDept, designDept, hrDept] = departments;
  console.log('✅ Departments seeded');

  // ============================================
  // System Settings
  // ============================================
  const settings = [
    { key: 'company_name', value: 'TVS Group', type: 'string', category: 'general', label: 'Company Name' },
    { key: 'working_hours_per_day', value: '8', type: 'number', category: 'capacity', label: 'Working Hours Per Day' },
    { key: 'working_days_per_month', value: '22', type: 'number', category: 'capacity', label: 'Working Days Per Month' },
    { key: 'fiscal_year_start', value: '4', type: 'number', category: 'general', label: 'Fiscal Year Start Month' },
    { key: 'date_format', value: 'DD MMM YYYY', type: 'string', category: 'general', label: 'Date Format' },
    { key: 'timezone', value: 'Asia/Kolkata', type: 'string', category: 'general', label: 'Timezone' },
    { key: 'notifications_enabled', value: 'true', type: 'boolean', category: 'notifications', label: 'Enable Notifications' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({ where: { key: setting.key }, update: {}, create: setting });
  }
  console.log('✅ System settings seeded');

  // ============================================
  // Users
  // ============================================
  const hashPassword = async (pwd: string) => bcrypt.hash(pwd, 12);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@tvs.com' },
    update: {},
    create: {
      email: 'superadmin@tvs.com',
      passwordHash: await hashPassword('TVS@SuperAdmin2024!'),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tvs.com' },
    update: {},
    create: {
      email: 'admin@tvs.com',
      passwordHash: await hashPassword('TVS@Admin2024!'),
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@tvs.com' },
    update: {},
    create: {
      email: 'pm@tvs.com',
      passwordHash: await hashPassword('TVS@PM2024!'),
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'PROJECT_MANAGER',
      isActive: true,
    },
  });

  const tlUser = await prisma.user.upsert({
    where: { email: 'teamlead@tvs.com' },
    update: {},
    create: {
      email: 'teamlead@tvs.com',
      passwordHash: await hashPassword('TVS@TL2024!'),
      firstName: 'Arjun',
      lastName: 'Singh',
      role: 'TEAM_LEAD',
      isActive: true,
    },
  });

  const empUser = await prisma.user.upsert({
    where: { email: 'employee@tvs.com' },
    update: {},
    create: {
      email: 'employee@tvs.com',
      passwordHash: await hashPassword('TVS@Emp2024!'),
      firstName: 'Kavya',
      lastName: 'Reddy',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  console.log('✅ Users seeded');

  // ============================================
  // Employees
  // ============================================
  const adminEmp = await prisma.employee.upsert({
    where: { employeeId: 'TVS001' },
    update: {},
    create: {
      employeeId: 'TVS001', userId: adminUser.id,
      firstName: 'Rajesh', lastName: 'Kumar',
      email: 'admin@tvs.com',
      departmentId: mgmtDept.id,
      designation: 'Operations Manager',
      skills: ['Management', 'Planning', 'Leadership'],
      experienceYears: 12,
      joiningDate: new Date('2012-04-01'),
      status: 'ACTIVE',
    },
  });

  const pmEmp = await prisma.employee.upsert({
    where: { employeeId: 'TVS002' },
    update: {},
    create: {
      employeeId: 'TVS002', userId: pmUser.id,
      firstName: 'Priya', lastName: 'Sharma',
      email: 'pm@tvs.com',
      departmentId: mgmtDept.id,
      designation: 'Senior Project Manager',
      managerId: adminEmp.id,
      skills: ['Project Management', 'Agile', 'Scrum', 'MS Project'],
      experienceYears: 8,
      joiningDate: new Date('2016-07-15'),
      status: 'ACTIVE',
    },
  });

  const tlEmp = await prisma.employee.upsert({
    where: { employeeId: 'TVS003' },
    update: {},
    create: {
      employeeId: 'TVS003', userId: tlUser.id,
      firstName: 'Arjun', lastName: 'Singh',
      email: 'teamlead@tvs.com',
      departmentId: engDept.id,
      designation: 'Tech Lead',
      managerId: pmEmp.id,
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
      experienceYears: 6,
      joiningDate: new Date('2018-01-10'),
      status: 'ACTIVE',
    },
  });

  const empEmp = await prisma.employee.upsert({
    where: { employeeId: 'TVS004' },
    update: {},
    create: {
      employeeId: 'TVS004', userId: empUser.id,
      firstName: 'Kavya', lastName: 'Reddy',
      email: 'employee@tvs.com',
      departmentId: engDept.id,
      designation: 'Senior Software Engineer',
      managerId: tlEmp.id,
      skills: ['React', 'TypeScript', 'CSS', 'REST APIs'],
      experienceYears: 4,
      joiningDate: new Date('2020-06-01'),
      status: 'ACTIVE',
    },
  });

  // Additional employees
  const emp5 = await prisma.employee.upsert({
    where: { employeeId: 'TVS005' },
    update: {},
    create: {
      employeeId: 'TVS005',
      firstName: 'Vikram', lastName: 'Nair',
      email: 'vikram.nair@tvs.com',
      departmentId: engDept.id,
      designation: 'Backend Developer',
      managerId: tlEmp.id,
      skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis'],
      experienceYears: 3,
      joiningDate: new Date('2021-03-15'),
      status: 'ACTIVE',
    },
  });

  const qaEmp = await prisma.employee.upsert({
    where: { employeeId: 'TVS006' },
    update: {},
    create: {
      employeeId: 'TVS006',
      firstName: 'Meena', lastName: 'Iyer',
      email: 'meena.iyer@tvs.com',
      departmentId: qaDept.id,
      designation: 'QA Lead',
      managerId: pmEmp.id,
      skills: ['Selenium', 'Jest', 'Cypress', 'Test Planning'],
      experienceYears: 5,
      joiningDate: new Date('2019-09-01'),
      status: 'ACTIVE',
    },
  });

  console.log('✅ Employees seeded');

  // ============================================
  // Projects
  // ============================================
  const project1 = await prisma.project.upsert({
    where: { projectCode: 'TVS-ERM-001' },
    update: {},
    create: {
      projectCode: 'TVS-ERM-001',
      name: 'Enterprise Resource Management System',
      clientName: 'TVS Group Internal',
      description: 'Internal ERP system for resource and workforce management',
      departmentId: engDept.id,
      projectManagerId: pmEmp.id,
      budget: 5000000,
      priority: 'CRITICAL',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      plannedHours: 4000,
      actualHours: 1800,
      completionPercentage: 45,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { projectCode: 'TVS-MFG-002' },
    update: {},
    create: {
      projectCode: 'TVS-MFG-002',
      name: 'Manufacturing Process Automation',
      clientName: 'TVS Motors',
      description: 'Automated workflow system for manufacturing operations',
      departmentId: engDept.id,
      projectManagerId: pmEmp.id,
      budget: 3000000,
      priority: 'HIGH',
      status: 'ACTIVE',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-09-30'),
      plannedHours: 2500,
      actualHours: 900,
      completionPercentage: 35,
    },
  });

  console.log('✅ Projects seeded');

  // ============================================
  // Project Members
  // ============================================
  await Promise.all([
    prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId: project1.id, employeeId: tlEmp.id } },
      update: {},
      create: { projectId: project1.id, employeeId: tlEmp.id, role: 'Tech Lead' },
    }),
    prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId: project1.id, employeeId: empEmp.id } },
      update: {},
      create: { projectId: project1.id, employeeId: empEmp.id, role: 'Frontend Developer' },
    }),
    prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId: project1.id, employeeId: emp5.id } },
      update: {},
      create: { projectId: project1.id, employeeId: emp5.id, role: 'Backend Developer' },
    }),
    prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId: project1.id, employeeId: qaEmp.id } },
      update: {},
      create: { projectId: project1.id, employeeId: qaEmp.id, role: 'QA Lead' },
    }),
  ]);

  console.log('✅ Project members seeded');

  // ============================================
  // Milestones
  // ============================================
  const m1 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: 'Phase 1 — Requirements & Design',
      plannedStartDate: new Date('2024-01-01'),
      plannedEndDate: new Date('2024-02-28'),
      actualStartDate: new Date('2024-01-01'),
      actualEndDate: new Date('2024-03-10'),
      status: 'COMPLETED',
      weight: 20,
      completionPercentage: 100,
    },
  }).catch(() => null);

  const m2 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: 'Phase 2 — Backend Development',
      plannedStartDate: new Date('2024-03-01'),
      plannedEndDate: new Date('2024-06-30'),
      actualStartDate: new Date('2024-03-11'),
      status: 'IN_PROGRESS',
      weight: 35,
      completionPercentage: 60,
    },
  }).catch(() => null);

  console.log('✅ Milestones seeded');

  // ============================================
  // Tasks
  // ============================================
  if (m2) {
    await prisma.task.createMany({
      data: [
        {
          projectId: project1.id, milestoneId: m2.id,
          name: 'Setup Backend Architecture',
          assignedToId: tlEmp.id, priority: 'HIGH', status: 'COMPLETED',
          estimatedHours: 40, actualHours: 38, completionPercentage: 100,
          startDate: new Date('2024-03-11'), endDate: new Date('2024-03-25'),
        },
        {
          projectId: project1.id, milestoneId: m2.id,
          name: 'Implement Authentication Module',
          assignedToId: emp5.id, priority: 'CRITICAL', status: 'COMPLETED',
          estimatedHours: 60, actualHours: 55, completionPercentage: 100,
          startDate: new Date('2024-03-26'), endDate: new Date('2024-04-15'),
        },
        {
          projectId: project1.id, milestoneId: m2.id,
          name: 'Build Resource Allocation API',
          assignedToId: emp5.id, priority: 'HIGH', status: 'IN_PROGRESS',
          estimatedHours: 80, actualHours: 40, completionPercentage: 50,
          startDate: new Date('2024-04-16'), endDate: new Date('2024-05-31'),
        },
        {
          projectId: project1.id, milestoneId: m2.id,
          name: 'Frontend Dashboard Implementation',
          assignedToId: empEmp.id, priority: 'HIGH', status: 'IN_PROGRESS',
          estimatedHours: 100, actualHours: 45, completionPercentage: 45,
          startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30'),
        },
        {
          projectId: project1.id, milestoneId: m2.id,
          name: 'Timesheet Module Development',
          assignedToId: empEmp.id, priority: 'MEDIUM', status: 'OPEN',
          estimatedHours: 60, actualHours: 0, completionPercentage: 0,
          startDate: new Date('2024-05-01'), endDate: new Date('2024-06-15'),
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Tasks seeded');

  // ============================================
  // Resource Allocations
  // ============================================
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0);

  await Promise.all([
    prisma.resourceAllocation.create({
      data: {
        employeeId: tlEmp.id, projectId: project1.id,
        allocatedHours: 120, startDate: currentMonthStart, endDate: currentMonthEnd,
        status: 'ACTIVE', approvedById: pmEmp.id,
      },
    }).catch(() => null),
    prisma.resourceAllocation.create({
      data: {
        employeeId: empEmp.id, projectId: project1.id,
        allocatedHours: 140, startDate: currentMonthStart, endDate: currentMonthEnd,
        status: 'ACTIVE', approvedById: pmEmp.id,
      },
    }).catch(() => null),
    prisma.resourceAllocation.create({
      data: {
        employeeId: emp5.id, projectId: project1.id,
        allocatedHours: 100, startDate: currentMonthStart, endDate: currentMonthEnd,
        status: 'ACTIVE', approvedById: pmEmp.id,
      },
    }).catch(() => null),
    prisma.resourceAllocation.create({
      data: {
        employeeId: emp5.id, projectId: project2.id,
        allocatedHours: 60, startDate: currentMonthStart, endDate: currentMonthEnd,
        status: 'ACTIVE', approvedById: pmEmp.id,
      },
    }).catch(() => null),
  ]);

  console.log('✅ Resource allocations seeded');

  // ============================================
  // Activity Logs
  // ============================================
  await prisma.activityLog.createMany({
    data: [
      {
        userId: adminUser.id, entityType: 'Project', entityId: project1.id,
        entityName: 'Enterprise Resource Management System', action: 'created',
        description: 'Project TVS-ERM-001 was created',
      },
      {
        userId: pmUser.id, entityType: 'Employee', entityId: empEmp.id,
        entityName: 'Kavya Reddy', action: 'allocated',
        description: 'Kavya Reddy allocated to TVS-ERM-001 project',
      },
      {
        userId: tlUser.id, entityType: 'Task', entityId: '1',
        entityName: 'Frontend Dashboard Implementation', action: 'updated',
        description: 'Task progress updated to 45%',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Activity logs seeded');

  console.log(`
╔══════════════════════════════════════════════════╗
║               Seed Completed Successfully!        ║
╠══════════════════════════════════════════════════╣
║  Default Login Credentials:                       ║
║  ─────────────────────────────────────────────   ║
║  Super Admin : superadmin@tvs.com                 ║
║  Password    : TVS@SuperAdmin2024!                ║
║  ─────────────────────────────────────────────   ║
║  Admin       : admin@tvs.com                      ║
║  Password    : TVS@Admin2024!                     ║
║  ─────────────────────────────────────────────   ║
║  PM          : pm@tvs.com                         ║
║  Password    : TVS@PM2024!                        ║
║  ─────────────────────────────────────────────   ║
║  Team Lead   : teamlead@tvs.com                   ║
║  Password    : TVS@TL2024!                        ║
║  ─────────────────────────────────────────────   ║
║  Employee    : employee@tvs.com                   ║
║  Password    : TVS@Emp2024!                       ║
╚══════════════════════════════════════════════════╝
  `);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
