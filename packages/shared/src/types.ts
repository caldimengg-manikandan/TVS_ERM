// ============================================
// TVS ERM — Shared TypeScript Types & Interfaces
// ============================================
import { 
  UserRole, ProjectStatus, ProjectPriority, TaskStatus, TaskPriority,
  AllocationStatus, ResourceStatus, TimesheetStatus, AttendanceStatus,
  EmployeeStatus, NotificationType, AuditAction, MilestoneStatus
} from './constants';

// ============================================
// Base Types
// ============================================
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// Auth Types
// ============================================
export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  employee?: EmployeeSummary;
  avatar?: string;
  lastLoginAt?: string;
}

// ============================================
// User Types
// ============================================
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  loginCount: number;
}

// ============================================
// Department Types
// ============================================
export interface DepartmentEntity extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  managerId?: string;
  manager?: EmployeeSummary;
  parentId?: string;
  parent?: DepartmentEntity;
  employeeCount?: number;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
}

// ============================================
// Employee Types
// ============================================
export interface Employee extends SoftDeleteEntity {
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  department?: DepartmentSummary;
  designation: string;
  managerId?: string;
  manager?: EmployeeSummary;
  skills: string[];
  experienceYears: number;
  joiningDate: string;
  status: EmployeeStatus;
  userId?: string;
  avatar?: string;
  // Computed
  utilizationPercent?: number;
  allocatedHours?: number;
  availableHours?: number;
  resourceStatus?: ResourceStatus;
}

export interface EmployeeSummary {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  designation: string;
  department?: DepartmentSummary;
  avatar?: string;
}

// ============================================
// Project Types
// ============================================
export interface Project extends SoftDeleteEntity {
  projectCode: string;
  name: string;
  clientName?: string;
  description?: string;
  departmentId: string;
  department?: DepartmentSummary;
  projectManagerId: string;
  projectManager?: EmployeeSummary;
  budget?: number;
  priority: ProjectPriority;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  plannedHours: number;
  actualHours: number;
  completionPercentage: number;
  // Computed
  isDelayed?: boolean;
  daysRemaining?: number;
  teamCount?: number;
}

export interface ProjectSummary {
  id: string;
  projectCode: string;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  completionPercentage: number;
}

export interface ProjectMember extends BaseEntity {
  projectId: string;
  employeeId: string;
  employee?: EmployeeSummary;
  role: string;
  joinedAt: string;
}

// ============================================
// Milestone Types
// ============================================
export interface Milestone extends BaseEntity {
  projectId: string;
  name: string;
  description?: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: MilestoneStatus;
  weight: number;
  completionPercentage: number;
}

// ============================================
// Task Types
// ============================================
export interface Task extends SoftDeleteEntity {
  projectId: string;
  project?: ProjectSummary;
  milestoneId?: string;
  milestone?: Milestone;
  parentTaskId?: string;
  name: string;
  description?: string;
  assignedToId?: string;
  assignedTo?: EmployeeSummary;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  startDate?: string;
  endDate?: string;
  completionPercentage: number;
  subtasks?: Task[];
}

// ============================================
// Resource Allocation Types
// ============================================
export interface ResourceAllocation extends BaseEntity {
  employeeId: string;
  employee?: EmployeeSummary;
  projectId: string;
  project?: ProjectSummary;
  allocatedHours: number;
  startDate: string;
  endDate: string;
  status: AllocationStatus;
  notes?: string;
  approvedById?: string;
}

export interface ResourceAllocationRow {
  sNo: number;
  employeeId: string;
  employeeDbId: string;
  employeeName: string;
  role: string;
  department: string;
  currentProject: string;
  currentHours: number;
  capacityHours: number;
  allocatedHours: number;
  availableHours: number;
  balanceHours: number;
  utilizationPercent: number;
  resourceStatus: ResourceStatus;
}

// ============================================
// Capacity Planning Types
// ============================================
export interface CapacityPlan extends BaseEntity {
  employeeId: string;
  employee?: EmployeeSummary;
  month: number;
  year: number;
  capacityHours: number;
  allocatedHours: number;
  availableHours: number;
}

export interface DepartmentCapacity {
  departmentId: string;
  departmentName: string;
  month: number;
  year: number;
  totalCapacity: number;
  totalAllocated: number;
  totalAvailable: number;
  employeeCount: number;
  utilizationPercent: number;
}

// ============================================
// Timesheet Types
// ============================================
export interface Timesheet extends BaseEntity {
  employeeId: string;
  employee?: EmployeeSummary;
  weekStartDate: string;
  weekEndDate: string;
  status: TimesheetStatus;
  totalHours: number;
  plannedHours: number;
  submittedAt?: string;
  approvedByTLId?: string;
  approvedByTL?: EmployeeSummary;
  approvedByTLAt?: string;
  approvedByAdminId?: string;
  approvedByAdmin?: EmployeeSummary;
  approvedByAdminAt?: string;
  rejectionReason?: string;
  entries: TimesheetEntry[];
}

export interface TimesheetEntry extends BaseEntity {
  timesheetId: string;
  taskId: string;
  task?: { id: string; name: string };
  projectId: string;
  project?: ProjectSummary;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  totalHours: number;
  description?: string;
}

// ============================================
// Attendance Types
// ============================================
export interface Attendance extends BaseEntity {
  employeeId: string;
  employee?: EmployeeSummary;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workedHours: number;
  status: AttendanceStatus;
  notes?: string;
  isManual: boolean;
}

// ============================================
// Notification Types
// ============================================
export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Audit Log Types
// ============================================
export interface AuditLog extends BaseEntity {
  userId: string;
  user?: UserProfile;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// Dashboard Types
// ============================================
export interface DashboardKPIs {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalEmployees: number;
  activeEmployees: number;
  avgResourceUtilization: number;
  availableCapacity: number;
  pendingTimesheets: number;
  pendingApprovals: number;
}

export interface ProjectProgressData {
  projectId: string;
  projectName: string;
  plannedProgress: number;
  actualProgress: number;
  status: ProjectStatus;
}

export interface ResourceUtilizationData {
  name: string;
  utilized: number;
  available: number;
  capacity: number;
}

export interface MonthlyHoursData {
  month: string;
  planned: number;
  actual: number;
  overtime: number;
}

// ============================================
// Report Types
// ============================================
export interface ResourceUtilizationReport {
  employee: EmployeeSummary;
  department: DepartmentSummary;
  month: number;
  year: number;
  capacityHours: number;
  allocatedHours: number;
  loggedHours: number;
  utilizationPercent: number;
  resourceStatus: ResourceStatus;
}

export interface ProjectTrackingRow {
  sequence: number;
  item: string;
  weight: number;
  plannedStart: string;
  actualStart?: string;
  plannedFinish: string;
  actualFinish?: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
  delay: number;
  progressPercent: number;
}

// ============================================
// Settings Types
// ============================================
export interface SystemSettings {
  companyName: string;
  workingHoursPerDay: number;
  workingDaysPerMonth: number;
  fiscalYearStart: number;
  dateFormat: string;
  timezone: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}
