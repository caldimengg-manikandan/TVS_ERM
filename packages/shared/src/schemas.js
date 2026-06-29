"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.ManualAttendanceSchema = exports.CheckOutSchema = exports.CheckInSchema = exports.ApproveTimesheetSchema = exports.SaveTimesheetSchema = exports.TimesheetEntrySchema = exports.BulkAllocationSchema = exports.UpdateAllocationSchema = exports.CreateAllocationSchema = exports.UpdateTaskSchema = exports.CreateTaskSchema = exports.UpdateMilestoneSchema = exports.CreateMilestoneSchema = exports.CloneProjectSchema = exports.UpdateProjectSchema = exports.CreateProjectSchema = exports.UpdateEmployeeSchema = exports.CreateEmployeeSchema = exports.UpdateDepartmentSchema = exports.CreateDepartmentSchema = exports.UpdateUserSchema = exports.CreateUserSchema = exports.ChangePasswordSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
// ============================================
// Auth Schemas
// ============================================
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: zod_1.z.boolean().optional().default(false),
});
exports.ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: zod_1.z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
// ============================================
// User Schemas
// ============================================
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    role: zod_1.z.nativeEnum(constants_1.UserRole),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.UpdateUserSchema = exports.CreateUserSchema.partial().omit({ password: true });
// ============================================
// Department Schemas
// ============================================
exports.CreateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    code: zod_1.z.string().min(1).max(10).toUpperCase(),
    description: zod_1.z.string().optional(),
    managerId: zod_1.z.string().uuid().optional(),
    parentId: zod_1.z.string().uuid().optional(),
});
exports.UpdateDepartmentSchema = exports.CreateDepartmentSchema.partial();
// ============================================
// Employee Schemas
// ============================================
exports.CreateEmployeeSchema = zod_1.z.object({
    employeeId: zod_1.z.string().min(1).max(20),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().uuid(),
    designation: zod_1.z.string().min(1).max(100),
    managerId: zod_1.z.string().uuid().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional().default([]),
    experienceYears: zod_1.z.number().min(0).max(50).optional(),
    joiningDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    status: zod_1.z.nativeEnum(constants_1.EmployeeStatus).optional().default(constants_1.EmployeeStatus.ACTIVE),
    userId: zod_1.z.string().uuid().optional(),
});
exports.UpdateEmployeeSchema = exports.CreateEmployeeSchema.partial();
// ============================================
// Project Schemas
// ============================================
exports.CreateProjectSchema = zod_1.z.object({
    projectCode: zod_1.z.string().min(3).max(20),
    name: zod_1.z.string().min(3).max(200),
    clientName: zod_1.z.string().max(200).optional(),
    location: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(constants_1.ProjectStatus).default(constants_1.ProjectStatus.YET_TO_START),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    plannedHours: zod_1.z.number().min(0).optional(),
});
exports.UpdateProjectSchema = exports.CreateProjectSchema.partial();
exports.CloneProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    projectCode: zod_1.z.string().min(1).max(20).toUpperCase(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    includeTasks: zod_1.z.boolean().default(true),
    includeMembers: zod_1.z.boolean().default(false),
});
// ============================================
// Milestone Schemas
// ============================================
exports.CreateMilestoneSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    plannedStartDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    plannedEndDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: zod_1.z.nativeEnum(constants_1.MilestoneStatus).default(constants_1.MilestoneStatus.PENDING),
    weight: zod_1.z.number().min(0).max(100).optional(),
});
exports.UpdateMilestoneSchema = exports.CreateMilestoneSchema.partial();
// ============================================
// Task Schemas
// ============================================
exports.CreateTaskSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    milestoneId: zod_1.z.string().uuid().optional(),
    parentTaskId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
    priority: zod_1.z.nativeEnum(constants_1.TaskPriority).default(constants_1.TaskPriority.MEDIUM),
    status: zod_1.z.nativeEnum(constants_1.TaskStatus).default(constants_1.TaskStatus.OPEN),
    estimatedHours: zod_1.z.number().min(0).optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
exports.UpdateTaskSchema = exports.CreateTaskSchema.partial();
// ============================================
// Resource Allocation Schemas
// ============================================
exports.CreateAllocationSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    projectId: zod_1.z.string().uuid(),
    allocatedHours: zod_1.z.number().min(0),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: zod_1.z.string().optional(),
});
exports.UpdateAllocationSchema = exports.CreateAllocationSchema.partial();
exports.BulkAllocationSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    allocations: zod_1.z.array(zod_1.z.object({
        employeeId: zod_1.z.string().uuid(),
        allocatedHours: zod_1.z.number().min(0),
        startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })),
});
// ============================================
// Timesheet Schemas
// ============================================
exports.TimesheetEntrySchema = zod_1.z.object({
    taskId: zod_1.z.string().uuid(),
    projectId: zod_1.z.string().uuid(),
    monday: zod_1.z.number().min(0).max(constants_1.DAILY_MAX_HOURS).default(0),
    tuesday: zod_1.z.number().min(0).max(constants_1.DAILY_MAX_HOURS).default(0),
    wednesday: zod_1.z.number().min(0).max(constants_1.DAILY_MAX_HOURS).default(0),
    thursday: zod_1.z.number().min(0).max(constants_1.DAILY_MAX_HOURS).default(0),
    friday: zod_1.z.number().min(0).max(constants_1.DAILY_MAX_HOURS).default(0),
    saturday: zod_1.z.number().min(0).max(constants_1.DAILY_MAX_HOURS).default(0),
    sunday: zod_1.z.number().min(0).max(constants_1.DAILY_MAX_HOURS).default(0),
    description: zod_1.z.string().optional(),
});
exports.SaveTimesheetSchema = zod_1.z.object({
    weekStartDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    entries: zod_1.z.array(exports.TimesheetEntrySchema),
    status: zod_1.z.nativeEnum(constants_1.TimesheetStatus).optional(),
});
exports.ApproveTimesheetSchema = zod_1.z.object({
    timesheetId: zod_1.z.string().uuid(),
    action: zod_1.z.enum(['APPROVE', 'REJECT']),
    comments: zod_1.z.string().optional(),
});
// ============================================
// Attendance Schemas
// ============================================
exports.CheckInSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
});
exports.CheckOutSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
});
exports.ManualAttendanceSchema = zod_1.z.object({
    employeeId: zod_1.z.string().uuid(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkIn: zod_1.z.string().optional(),
    checkOut: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(constants_1.AttendanceStatus),
    notes: zod_1.z.string().optional(),
});
// ============================================
// Pagination Schema
// ============================================
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(25),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
});
//# sourceMappingURL=schemas.js.map