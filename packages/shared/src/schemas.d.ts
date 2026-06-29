import { z } from 'zod';
import { UserRole, ProjectStatus, TaskStatus, TaskPriority, TimesheetStatus, EmployeeStatus, AttendanceStatus, MilestoneStatus } from './constants';
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe: boolean;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const ResetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>;
export declare const ChangePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}, {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: UserRole;
    password: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
}, {
    email: string;
    role: UserRole;
    password: string;
    firstName: string;
    lastName: string;
    isActive?: boolean | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<Omit<{
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "password">, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    role?: UserRole | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
}, {
    email?: string | undefined;
    role?: UserRole | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const CreateDepartmentSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    managerId: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    description?: string | undefined;
    managerId?: string | undefined;
    parentId?: string | undefined;
}, {
    code: string;
    name: string;
    description?: string | undefined;
    managerId?: string | undefined;
    parentId?: string | undefined;
}>;
export declare const UpdateDepartmentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    managerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    managerId?: string | undefined;
    parentId?: string | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    managerId?: string | undefined;
    parentId?: string | undefined;
}>;
export declare const CreateEmployeeSchema: z.ZodObject<{
    employeeId: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodString;
    designation: z.ZodString;
    managerId: z.ZodOptional<z.ZodString>;
    skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    experienceYears: z.ZodOptional<z.ZodNumber>;
    joiningDate: z.ZodUnion<[z.ZodString, z.ZodString]>;
    status: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof EmployeeStatus>>>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: EmployeeStatus;
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    departmentId: string;
    designation: string;
    skills: string[];
    joiningDate: string;
    userId?: string | undefined;
    managerId?: string | undefined;
    phone?: string | undefined;
    experienceYears?: number | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    departmentId: string;
    designation: string;
    joiningDate: string;
    status?: EmployeeStatus | undefined;
    userId?: string | undefined;
    managerId?: string | undefined;
    phone?: string | undefined;
    skills?: string[] | undefined;
    experienceYears?: number | undefined;
}>;
export declare const UpdateEmployeeSchema: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    managerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    skills: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    experienceYears: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    joiningDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<typeof EmployeeStatus>>>>;
    userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: EmployeeStatus | undefined;
    userId?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    managerId?: string | undefined;
    employeeId?: string | undefined;
    phone?: string | undefined;
    departmentId?: string | undefined;
    designation?: string | undefined;
    skills?: string[] | undefined;
    experienceYears?: number | undefined;
    joiningDate?: string | undefined;
}, {
    status?: EmployeeStatus | undefined;
    userId?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    managerId?: string | undefined;
    employeeId?: string | undefined;
    phone?: string | undefined;
    departmentId?: string | undefined;
    designation?: string | undefined;
    skills?: string[] | undefined;
    experienceYears?: number | undefined;
    joiningDate?: string | undefined;
}>;
export declare const CreateProjectSchema: z.ZodObject<{
    projectCode: z.ZodString;
    name: z.ZodString;
    clientName: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ProjectStatus>>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    plannedHours: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: ProjectStatus;
    name: string;
    projectCode: string;
    startDate: string;
    endDate: string;
    departmentId?: string | undefined;
    clientName?: string | undefined;
    location?: string | undefined;
    plannedHours?: number | undefined;
}, {
    name: string;
    projectCode: string;
    startDate: string;
    endDate: string;
    status?: ProjectStatus | undefined;
    departmentId?: string | undefined;
    clientName?: string | undefined;
    location?: string | undefined;
    plannedHours?: number | undefined;
}>;
export declare const UpdateProjectSchema: z.ZodObject<{
    projectCode: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    clientName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof ProjectStatus>>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    plannedHours: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: ProjectStatus | undefined;
    name?: string | undefined;
    departmentId?: string | undefined;
    projectCode?: string | undefined;
    clientName?: string | undefined;
    location?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    plannedHours?: number | undefined;
}, {
    status?: ProjectStatus | undefined;
    name?: string | undefined;
    departmentId?: string | undefined;
    projectCode?: string | undefined;
    clientName?: string | undefined;
    location?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    plannedHours?: number | undefined;
}>;
export declare const CloneProjectSchema: z.ZodObject<{
    name: z.ZodString;
    projectCode: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    includeTasks: z.ZodDefault<z.ZodBoolean>;
    includeMembers: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    projectCode: string;
    startDate: string;
    endDate: string;
    includeTasks: boolean;
    includeMembers: boolean;
}, {
    name: string;
    projectCode: string;
    startDate: string;
    endDate: string;
    includeTasks?: boolean | undefined;
    includeMembers?: boolean | undefined;
}>;
export declare const CreateMilestoneSchema: z.ZodObject<{
    projectId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    plannedStartDate: z.ZodString;
    plannedEndDate: z.ZodString;
    status: z.ZodDefault<z.ZodNativeEnum<typeof MilestoneStatus>>;
    weight: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: MilestoneStatus;
    name: string;
    projectId: string;
    plannedStartDate: string;
    plannedEndDate: string;
    description?: string | undefined;
    weight?: number | undefined;
}, {
    name: string;
    projectId: string;
    plannedStartDate: string;
    plannedEndDate: string;
    status?: MilestoneStatus | undefined;
    description?: string | undefined;
    weight?: number | undefined;
}>;
export declare const UpdateMilestoneSchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    plannedStartDate: z.ZodOptional<z.ZodString>;
    plannedEndDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof MilestoneStatus>>>;
    weight: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: MilestoneStatus | undefined;
    name?: string | undefined;
    description?: string | undefined;
    projectId?: string | undefined;
    plannedStartDate?: string | undefined;
    plannedEndDate?: string | undefined;
    weight?: number | undefined;
}, {
    status?: MilestoneStatus | undefined;
    name?: string | undefined;
    description?: string | undefined;
    projectId?: string | undefined;
    plannedStartDate?: string | undefined;
    plannedEndDate?: string | undefined;
    weight?: number | undefined;
}>;
export declare const CreateTaskSchema: z.ZodObject<{
    projectId: z.ZodString;
    milestoneId: z.ZodOptional<z.ZodString>;
    parentTaskId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodNativeEnum<typeof TaskPriority>>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof TaskStatus>>;
    estimatedHours: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: TaskStatus;
    name: string;
    projectId: string;
    priority: TaskPriority;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    milestoneId?: string | undefined;
    parentTaskId?: string | undefined;
    assignedToId?: string | undefined;
    estimatedHours?: number | undefined;
}, {
    name: string;
    projectId: string;
    status?: TaskStatus | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    milestoneId?: string | undefined;
    parentTaskId?: string | undefined;
    assignedToId?: string | undefined;
    priority?: TaskPriority | undefined;
    estimatedHours?: number | undefined;
}>;
export declare const UpdateTaskSchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    milestoneId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentTaskId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof TaskPriority>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof TaskStatus>>>;
    estimatedHours: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    startDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: TaskStatus | undefined;
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    projectId?: string | undefined;
    milestoneId?: string | undefined;
    parentTaskId?: string | undefined;
    assignedToId?: string | undefined;
    priority?: TaskPriority | undefined;
    estimatedHours?: number | undefined;
}, {
    status?: TaskStatus | undefined;
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    projectId?: string | undefined;
    milestoneId?: string | undefined;
    parentTaskId?: string | undefined;
    assignedToId?: string | undefined;
    priority?: TaskPriority | undefined;
    estimatedHours?: number | undefined;
}>;
export declare const CreateAllocationSchema: z.ZodObject<{
    employeeId: z.ZodString;
    projectId: z.ZodString;
    allocatedHours: z.ZodNumber;
    startDate: z.ZodString;
    endDate: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    employeeId: string;
    startDate: string;
    endDate: string;
    projectId: string;
    allocatedHours: number;
    notes?: string | undefined;
}, {
    employeeId: string;
    startDate: string;
    endDate: string;
    projectId: string;
    allocatedHours: number;
    notes?: string | undefined;
}>;
export declare const UpdateAllocationSchema: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    allocatedHours: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    employeeId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    projectId?: string | undefined;
    allocatedHours?: number | undefined;
    notes?: string | undefined;
}, {
    employeeId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    projectId?: string | undefined;
    allocatedHours?: number | undefined;
    notes?: string | undefined;
}>;
export declare const BulkAllocationSchema: z.ZodObject<{
    projectId: z.ZodString;
    allocations: z.ZodArray<z.ZodObject<{
        employeeId: z.ZodString;
        allocatedHours: z.ZodNumber;
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        employeeId: string;
        startDate: string;
        endDate: string;
        allocatedHours: number;
    }, {
        employeeId: string;
        startDate: string;
        endDate: string;
        allocatedHours: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    allocations: {
        employeeId: string;
        startDate: string;
        endDate: string;
        allocatedHours: number;
    }[];
}, {
    projectId: string;
    allocations: {
        employeeId: string;
        startDate: string;
        endDate: string;
        allocatedHours: number;
    }[];
}>;
export declare const TimesheetEntrySchema: z.ZodObject<{
    taskId: z.ZodString;
    projectId: z.ZodString;
    monday: z.ZodDefault<z.ZodNumber>;
    tuesday: z.ZodDefault<z.ZodNumber>;
    wednesday: z.ZodDefault<z.ZodNumber>;
    thursday: z.ZodDefault<z.ZodNumber>;
    friday: z.ZodDefault<z.ZodNumber>;
    saturday: z.ZodDefault<z.ZodNumber>;
    sunday: z.ZodDefault<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    taskId: string;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
    description?: string | undefined;
}, {
    projectId: string;
    taskId: string;
    description?: string | undefined;
    monday?: number | undefined;
    tuesday?: number | undefined;
    wednesday?: number | undefined;
    thursday?: number | undefined;
    friday?: number | undefined;
    saturday?: number | undefined;
    sunday?: number | undefined;
}>;
export declare const SaveTimesheetSchema: z.ZodObject<{
    weekStartDate: z.ZodString;
    entries: z.ZodArray<z.ZodObject<{
        taskId: z.ZodString;
        projectId: z.ZodString;
        monday: z.ZodDefault<z.ZodNumber>;
        tuesday: z.ZodDefault<z.ZodNumber>;
        wednesday: z.ZodDefault<z.ZodNumber>;
        thursday: z.ZodDefault<z.ZodNumber>;
        friday: z.ZodDefault<z.ZodNumber>;
        saturday: z.ZodDefault<z.ZodNumber>;
        sunday: z.ZodDefault<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        projectId: string;
        taskId: string;
        monday: number;
        tuesday: number;
        wednesday: number;
        thursday: number;
        friday: number;
        saturday: number;
        sunday: number;
        description?: string | undefined;
    }, {
        projectId: string;
        taskId: string;
        description?: string | undefined;
        monday?: number | undefined;
        tuesday?: number | undefined;
        wednesday?: number | undefined;
        thursday?: number | undefined;
        friday?: number | undefined;
        saturday?: number | undefined;
        sunday?: number | undefined;
    }>, "many">;
    status: z.ZodOptional<z.ZodNativeEnum<typeof TimesheetStatus>>;
}, "strip", z.ZodTypeAny, {
    entries: {
        projectId: string;
        taskId: string;
        monday: number;
        tuesday: number;
        wednesday: number;
        thursday: number;
        friday: number;
        saturday: number;
        sunday: number;
        description?: string | undefined;
    }[];
    weekStartDate: string;
    status?: TimesheetStatus | undefined;
}, {
    entries: {
        projectId: string;
        taskId: string;
        description?: string | undefined;
        monday?: number | undefined;
        tuesday?: number | undefined;
        wednesday?: number | undefined;
        thursday?: number | undefined;
        friday?: number | undefined;
        saturday?: number | undefined;
        sunday?: number | undefined;
    }[];
    weekStartDate: string;
    status?: TimesheetStatus | undefined;
}>;
export declare const ApproveTimesheetSchema: z.ZodObject<{
    timesheetId: z.ZodString;
    action: z.ZodEnum<["APPROVE", "REJECT"]>;
    comments: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timesheetId: string;
    action: "APPROVE" | "REJECT";
    comments?: string | undefined;
}, {
    timesheetId: string;
    action: "APPROVE" | "REJECT";
    comments?: string | undefined;
}>;
export declare const CheckInSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
}, {
    notes?: string | undefined;
}>;
export declare const CheckOutSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
}, {
    notes?: string | undefined;
}>;
export declare const ManualAttendanceSchema: z.ZodObject<{
    employeeId: z.ZodString;
    date: z.ZodString;
    checkIn: z.ZodOptional<z.ZodString>;
    checkOut: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<typeof AttendanceStatus>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: AttendanceStatus;
    date: string;
    employeeId: string;
    notes?: string | undefined;
    checkIn?: string | undefined;
    checkOut?: string | undefined;
}, {
    status: AttendanceStatus;
    date: string;
    employeeId: string;
    notes?: string | undefined;
    checkIn?: string | undefined;
    checkOut?: string | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
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
//# sourceMappingURL=schemas.d.ts.map