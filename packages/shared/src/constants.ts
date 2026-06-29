// ============================================
// TVS ERM — Shared Enums & Constants
// ============================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  EMPLOYEE = 'EMPLOYEE',
}

export enum ProjectStatus {
  YET_TO_START = 'YET_TO_START',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PLANNING = 'PLANNING',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED'
}

export enum ProjectPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum AllocationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ResourceStatus {
  AVAILABLE = 'AVAILABLE',
  NEAR_CAPACITY = 'NEAR_CAPACITY',
  OVERLOADED = 'OVERLOADED',
}

export enum TimesheetStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  TEAM_LEAD_APPROVED = 'TEAM_LEAD_APPROVED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
  HOLIDAY = 'HOLIDAY',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

export enum NotificationType {
  PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  RESOURCE_ALLOCATED = 'RESOURCE_ALLOCATED',
  TIMESHEET_SUBMITTED = 'TIMESHEET_SUBMITTED',
  TIMESHEET_APPROVED = 'TIMESHEET_APPROVED',
  TIMESHEET_REJECTED = 'TIMESHEET_REJECTED',
  PROJECT_DELAYED = 'PROJECT_DELAYED',
  APPROVAL_PENDING = 'APPROVAL_PENDING',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXPORT = 'EXPORT',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
}

export enum Department {
  ENGINEERING = 'ENGINEERING',
  DESIGN = 'DESIGN',
  MANAGEMENT = 'MANAGEMENT',
  QA = 'QA',
  DEVOPS = 'DEVOPS',
  HR = 'HR',
  FINANCE = 'FINANCE',
  OPERATIONS = 'OPERATIONS',
  SALES = 'SALES',
  MARKETING = 'MARKETING',
}

// ============================================
// Capacity Constants
// ============================================
export const WORKING_HOURS_PER_DAY = 8;
export const WORKING_DAYS_PER_MONTH = 22;
export const MONTHLY_CAPACITY_HOURS = WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH; // 176
export const DAILY_MAX_HOURS = 24;
export const TIMESHEET_DAILY_LIMIT = 8;

// ============================================
// Utilization Thresholds
// ============================================
export const UTILIZATION_AVAILABLE_MAX = 75;     // < 75% = Available (Green)
export const UTILIZATION_NEAR_CAPACITY_MAX = 90; // 75-90% = Near Capacity (Yellow)
// > 90% = Overloaded (Red)

export const getResourceStatus = (utilizationPercent: number): ResourceStatus => {
  if (utilizationPercent < UTILIZATION_AVAILABLE_MAX) return ResourceStatus.AVAILABLE;
  if (utilizationPercent < UTILIZATION_NEAR_CAPACITY_MAX) return ResourceStatus.NEAR_CAPACITY;
  return ResourceStatus.OVERLOADED;
};

export const calculateUtilization = (allocatedHours: number, capacityHours: number): number => {
  if (capacityHours === 0) return 0;
  return Math.round((allocatedHours / capacityHours) * 100 * 100) / 100;
};

// ============================================
// Pagination
// ============================================
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ============================================
// Date Formats
// ============================================
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'dd MMM yyyy';
export const DISPLAY_DATETIME_FORMAT = 'dd MMM yyyy, HH:mm';
