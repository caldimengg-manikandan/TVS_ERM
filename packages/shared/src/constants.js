"use strict";
// ============================================
// TVS ERM — Shared Enums & Constants
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISPLAY_DATETIME_FORMAT = exports.DISPLAY_DATE_FORMAT = exports.DATETIME_FORMAT = exports.DATE_FORMAT = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.calculateUtilization = exports.getResourceStatus = exports.UTILIZATION_NEAR_CAPACITY_MAX = exports.UTILIZATION_AVAILABLE_MAX = exports.TIMESHEET_DAILY_LIMIT = exports.DAILY_MAX_HOURS = exports.MONTHLY_CAPACITY_HOURS = exports.WORKING_DAYS_PER_MONTH = exports.WORKING_HOURS_PER_DAY = exports.Department = exports.MilestoneStatus = exports.AuditAction = exports.NotificationType = exports.EmployeeStatus = exports.AttendanceStatus = exports.TimesheetStatus = exports.ResourceStatus = exports.AllocationStatus = exports.TaskPriority = exports.TaskStatus = exports.ProjectPriority = exports.ProjectStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PROJECT_MANAGER"] = "PROJECT_MANAGER";
    UserRole["TEAM_LEAD"] = "TEAM_LEAD";
    UserRole["EMPLOYEE"] = "EMPLOYEE";
})(UserRole || (exports.UserRole = UserRole = {}));
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["YET_TO_START"] = "YET_TO_START";
    ProjectStatus["ACTIVE"] = "ACTIVE";
    ProjectStatus["INACTIVE"] = "INACTIVE";
    ProjectStatus["COMPLETED"] = "COMPLETED";
    ProjectStatus["CANCELLED"] = "CANCELLED";
    ProjectStatus["PLANNING"] = "PLANNING";
    ProjectStatus["ON_HOLD"] = "ON_HOLD";
    ProjectStatus["ARCHIVED"] = "ARCHIVED";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
var ProjectPriority;
(function (ProjectPriority) {
    ProjectPriority["CRITICAL"] = "CRITICAL";
    ProjectPriority["HIGH"] = "HIGH";
    ProjectPriority["MEDIUM"] = "MEDIUM";
    ProjectPriority["LOW"] = "LOW";
})(ProjectPriority || (exports.ProjectPriority = ProjectPriority = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["OPEN"] = "OPEN";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["REVIEW"] = "REVIEW";
    TaskStatus["BLOCKED"] = "BLOCKED";
    TaskStatus["COMPLETED"] = "COMPLETED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["CRITICAL"] = "CRITICAL";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["LOW"] = "LOW";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var AllocationStatus;
(function (AllocationStatus) {
    AllocationStatus["ACTIVE"] = "ACTIVE";
    AllocationStatus["COMPLETED"] = "COMPLETED";
    AllocationStatus["CANCELLED"] = "CANCELLED";
})(AllocationStatus || (exports.AllocationStatus = AllocationStatus = {}));
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["AVAILABLE"] = "AVAILABLE";
    ResourceStatus["NEAR_CAPACITY"] = "NEAR_CAPACITY";
    ResourceStatus["OVERLOADED"] = "OVERLOADED";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
var TimesheetStatus;
(function (TimesheetStatus) {
    TimesheetStatus["DRAFT"] = "DRAFT";
    TimesheetStatus["SUBMITTED"] = "SUBMITTED";
    TimesheetStatus["TEAM_LEAD_APPROVED"] = "TEAM_LEAD_APPROVED";
    TimesheetStatus["APPROVED"] = "APPROVED";
    TimesheetStatus["REJECTED"] = "REJECTED";
})(TimesheetStatus || (exports.TimesheetStatus = TimesheetStatus = {}));
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "PRESENT";
    AttendanceStatus["ABSENT"] = "ABSENT";
    AttendanceStatus["HALF_DAY"] = "HALF_DAY";
    AttendanceStatus["LEAVE"] = "LEAVE";
    AttendanceStatus["HOLIDAY"] = "HOLIDAY";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["ACTIVE"] = "ACTIVE";
    EmployeeStatus["INACTIVE"] = "INACTIVE";
    EmployeeStatus["ON_LEAVE"] = "ON_LEAVE";
    EmployeeStatus["TERMINATED"] = "TERMINATED";
})(EmployeeStatus || (exports.EmployeeStatus = EmployeeStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["PROJECT_ASSIGNED"] = "PROJECT_ASSIGNED";
    NotificationType["TASK_ASSIGNED"] = "TASK_ASSIGNED";
    NotificationType["RESOURCE_ALLOCATED"] = "RESOURCE_ALLOCATED";
    NotificationType["TIMESHEET_SUBMITTED"] = "TIMESHEET_SUBMITTED";
    NotificationType["TIMESHEET_APPROVED"] = "TIMESHEET_APPROVED";
    NotificationType["TIMESHEET_REJECTED"] = "TIMESHEET_REJECTED";
    NotificationType["PROJECT_DELAYED"] = "PROJECT_DELAYED";
    NotificationType["APPROVAL_PENDING"] = "APPROVAL_PENDING";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["APPROVE"] = "APPROVE";
    AuditAction["REJECT"] = "REJECT";
    AuditAction["EXPORT"] = "EXPORT";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var MilestoneStatus;
(function (MilestoneStatus) {
    MilestoneStatus["PENDING"] = "PENDING";
    MilestoneStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MilestoneStatus["COMPLETED"] = "COMPLETED";
    MilestoneStatus["DELAYED"] = "DELAYED";
})(MilestoneStatus || (exports.MilestoneStatus = MilestoneStatus = {}));
var Department;
(function (Department) {
    Department["ENGINEERING"] = "ENGINEERING";
    Department["DESIGN"] = "DESIGN";
    Department["MANAGEMENT"] = "MANAGEMENT";
    Department["QA"] = "QA";
    Department["DEVOPS"] = "DEVOPS";
    Department["HR"] = "HR";
    Department["FINANCE"] = "FINANCE";
    Department["OPERATIONS"] = "OPERATIONS";
    Department["SALES"] = "SALES";
    Department["MARKETING"] = "MARKETING";
})(Department || (exports.Department = Department = {}));
// ============================================
// Capacity Constants
// ============================================
exports.WORKING_HOURS_PER_DAY = 8;
exports.WORKING_DAYS_PER_MONTH = 22;
exports.MONTHLY_CAPACITY_HOURS = exports.WORKING_HOURS_PER_DAY * exports.WORKING_DAYS_PER_MONTH; // 176
exports.DAILY_MAX_HOURS = 24;
exports.TIMESHEET_DAILY_LIMIT = 8;
// ============================================
// Utilization Thresholds
// ============================================
exports.UTILIZATION_AVAILABLE_MAX = 75; // < 75% = Available (Green)
exports.UTILIZATION_NEAR_CAPACITY_MAX = 90; // 75-90% = Near Capacity (Yellow)
// > 90% = Overloaded (Red)
const getResourceStatus = (utilizationPercent) => {
    if (utilizationPercent < exports.UTILIZATION_AVAILABLE_MAX)
        return ResourceStatus.AVAILABLE;
    if (utilizationPercent < exports.UTILIZATION_NEAR_CAPACITY_MAX)
        return ResourceStatus.NEAR_CAPACITY;
    return ResourceStatus.OVERLOADED;
};
exports.getResourceStatus = getResourceStatus;
const calculateUtilization = (allocatedHours, capacityHours) => {
    if (capacityHours === 0)
        return 0;
    return Math.round((allocatedHours / capacityHours) * 100 * 100) / 100;
};
exports.calculateUtilization = calculateUtilization;
// ============================================
// Pagination
// ============================================
exports.DEFAULT_PAGE_SIZE = 25;
exports.MAX_PAGE_SIZE = 100;
// ============================================
// Date Formats
// ============================================
exports.DATE_FORMAT = 'yyyy-MM-dd';
exports.DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
exports.DISPLAY_DATE_FORMAT = 'dd MMM yyyy';
exports.DISPLAY_DATETIME_FORMAT = 'dd MMM yyyy, HH:mm';
//# sourceMappingURL=constants.js.map