import { z } from 'zod';
import {
  UserRole, ProjectStatus, ProjectPriority, TaskStatus, TaskPriority,
  TimesheetStatus, EmployeeStatus, AttendanceStatus, MilestoneStatus,
  TIMESHEET_DAILY_LIMIT, DAILY_MAX_HOURS
} from './constants';

// ============================================
// Auth Schemas
// ============================================
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// User Schemas
// ============================================
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean().optional().default(true),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

// ============================================
// Department Schemas
// ============================================
export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(10).toUpperCase(),
  description: z.string().optional(),
  managerId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// ============================================
// Employee Schemas
// ============================================
export const CreateEmployeeSchema = z.object({
  employeeId: z.string().min(1).max(20),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  departmentId: z.string().uuid(),
  designation: z.string().min(1).max(100),
  managerId: z.string().uuid().optional(),
  skills: z.array(z.string()).optional().default([]),
  experienceYears: z.number().min(0).max(50).optional(),
  joiningDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  status: z.nativeEnum(EmployeeStatus).optional().default(EmployeeStatus.ACTIVE),
  userId: z.string().uuid().optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

// ============================================
// Project Schemas
// ============================================
export const CreateProjectSchema = z.object({
  projectCode: z.string().min(3).max(20),
  name: z.string().min(3).max(200),
  clientName: z.string().max(200).optional(),
  location: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.YET_TO_START),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedHours: z.number().min(0).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CloneProjectSchema = z.object({
  name: z.string().min(1).max(200),
  projectCode: z.string().min(1).max(20).toUpperCase(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  includeTasks: z.boolean().default(true),
  includeMembers: z.boolean().default(false),
});

// ============================================
// Milestone Schemas
// ============================================
export const CreateMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  plannedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.nativeEnum(MilestoneStatus).default(MilestoneStatus.PENDING),
  weight: z.number().min(0).max(100).optional(),
});

export const UpdateMilestoneSchema = CreateMilestoneSchema.partial();

// ============================================
// Task Schemas
// ============================================
export const CreateTaskSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN),
  estimatedHours: z.number().min(0).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

// ============================================
// Resource Allocation Schemas
// ============================================
export const CreateAllocationSchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  allocatedHours: z.number().min(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export const UpdateAllocationSchema = CreateAllocationSchema.partial();

export const BulkAllocationSchema = z.object({
  projectId: z.string().uuid(),
  allocations: z.array(z.object({
    employeeId: z.string().uuid(),
    allocatedHours: z.number().min(0),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })),
});

// ============================================
// Timesheet Schemas
// ============================================
export const TimesheetEntrySchema = z.object({
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  monday: z.number().min(0).max(DAILY_MAX_HOURS).default(0),
  tuesday: z.number().min(0).max(DAILY_MAX_HOURS).default(0),
  wednesday: z.number().min(0).max(DAILY_MAX_HOURS).default(0),
  thursday: z.number().min(0).max(DAILY_MAX_HOURS).default(0),
  friday: z.number().min(0).max(DAILY_MAX_HOURS).default(0),
  saturday: z.number().min(0).max(DAILY_MAX_HOURS).default(0),
  sunday: z.number().min(0).max(DAILY_MAX_HOURS).default(0),
  description: z.string().optional(),
});

export const SaveTimesheetSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(TimesheetEntrySchema),
  status: z.nativeEnum(TimesheetStatus).optional(),
});

export const ApproveTimesheetSchema = z.object({
  timesheetId: z.string().uuid(),
  action: z.enum(['APPROVE', 'REJECT']),
  comments: z.string().optional(),
});

// ============================================
// Attendance Schemas
// ============================================
export const CheckInSchema = z.object({
  notes: z.string().optional(),
});

export const CheckOutSchema = z.object({
  notes: z.string().optional(),
});

export const ManualAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional(),
});

// ============================================
// Pagination Schema
// ============================================
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateAllocationInput = z.infer<typeof CreateAllocationSchema>;
export type UpdateAllocationInput = z.infer<typeof UpdateAllocationSchema>;
export type SaveTimesheetInput = z.infer<typeof SaveTimesheetSchema>;
export type TimesheetEntryInput = z.infer<typeof TimesheetEntrySchema>;
export type CloneProjectInput = z.infer<typeof CloneProjectSchema>;
