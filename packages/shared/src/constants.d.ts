export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    PROJECT_MANAGER = "PROJECT_MANAGER",
    TEAM_LEAD = "TEAM_LEAD",
    EMPLOYEE = "EMPLOYEE"
}
export declare enum ProjectStatus {
    YET_TO_START = "YET_TO_START",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    PLANNING = "PLANNING",
    ON_HOLD = "ON_HOLD",
    ARCHIVED = "ARCHIVED"
}
export declare enum ProjectPriority {
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW"
}
export declare enum TaskStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    REVIEW = "REVIEW",
    BLOCKED = "BLOCKED",
    COMPLETED = "COMPLETED"
}
export declare enum TaskPriority {
    CRITICAL = "CRITICAL",
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW"
}
export declare enum AllocationStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum ResourceStatus {
    AVAILABLE = "AVAILABLE",
    NEAR_CAPACITY = "NEAR_CAPACITY",
    OVERLOADED = "OVERLOADED"
}
export declare enum TimesheetStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    TEAM_LEAD_APPROVED = "TEAM_LEAD_APPROVED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum AttendanceStatus {
    PRESENT = "PRESENT",
    ABSENT = "ABSENT",
    HALF_DAY = "HALF_DAY",
    LEAVE = "LEAVE",
    HOLIDAY = "HOLIDAY"
}
export declare enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ON_LEAVE = "ON_LEAVE",
    TERMINATED = "TERMINATED"
}
export declare enum NotificationType {
    PROJECT_ASSIGNED = "PROJECT_ASSIGNED",
    TASK_ASSIGNED = "TASK_ASSIGNED",
    RESOURCE_ALLOCATED = "RESOURCE_ALLOCATED",
    TIMESHEET_SUBMITTED = "TIMESHEET_SUBMITTED",
    TIMESHEET_APPROVED = "TIMESHEET_APPROVED",
    TIMESHEET_REJECTED = "TIMESHEET_REJECTED",
    PROJECT_DELAYED = "PROJECT_DELAYED",
    APPROVAL_PENDING = "APPROVAL_PENDING",
    SYSTEM_ALERT = "SYSTEM_ALERT"
}
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    EXPORT = "EXPORT"
}
export declare enum MilestoneStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    DELAYED = "DELAYED"
}
export declare enum Department {
    ENGINEERING = "ENGINEERING",
    DESIGN = "DESIGN",
    MANAGEMENT = "MANAGEMENT",
    QA = "QA",
    DEVOPS = "DEVOPS",
    HR = "HR",
    FINANCE = "FINANCE",
    OPERATIONS = "OPERATIONS",
    SALES = "SALES",
    MARKETING = "MARKETING"
}
export declare const WORKING_HOURS_PER_DAY = 8;
export declare const WORKING_DAYS_PER_MONTH = 22;
export declare const MONTHLY_CAPACITY_HOURS: number;
export declare const DAILY_MAX_HOURS = 24;
export declare const TIMESHEET_DAILY_LIMIT = 8;
export declare const UTILIZATION_AVAILABLE_MAX = 75;
export declare const UTILIZATION_NEAR_CAPACITY_MAX = 90;
export declare const getResourceStatus: (utilizationPercent: number) => ResourceStatus;
export declare const calculateUtilization: (allocatedHours: number, capacityHours: number) => number;
export declare const DEFAULT_PAGE_SIZE = 25;
export declare const MAX_PAGE_SIZE = 100;
export declare const DATE_FORMAT = "yyyy-MM-dd";
export declare const DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
export declare const DISPLAY_DATE_FORMAT = "dd MMM yyyy";
export declare const DISPLAY_DATETIME_FORMAT = "dd MMM yyyy, HH:mm";
//# sourceMappingURL=constants.d.ts.map