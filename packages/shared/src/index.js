"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Department = exports.MilestoneStatus = exports.AuditAction = exports.NotificationType = exports.EmployeeStatus = exports.AttendanceStatus = exports.TimesheetStatus = exports.ResourceStatus = exports.AllocationStatus = exports.TaskPriority = exports.TaskStatus = exports.ProjectPriority = exports.ProjectStatus = exports.UserRole = void 0;
// TVS ERM — Shared Package Entry Point
__exportStar(require("./constants"), exports);
var constants_1 = require("./constants");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return constants_1.UserRole; } });
Object.defineProperty(exports, "ProjectStatus", { enumerable: true, get: function () { return constants_1.ProjectStatus; } });
Object.defineProperty(exports, "ProjectPriority", { enumerable: true, get: function () { return constants_1.ProjectPriority; } });
Object.defineProperty(exports, "TaskStatus", { enumerable: true, get: function () { return constants_1.TaskStatus; } });
Object.defineProperty(exports, "TaskPriority", { enumerable: true, get: function () { return constants_1.TaskPriority; } });
Object.defineProperty(exports, "AllocationStatus", { enumerable: true, get: function () { return constants_1.AllocationStatus; } });
Object.defineProperty(exports, "ResourceStatus", { enumerable: true, get: function () { return constants_1.ResourceStatus; } });
Object.defineProperty(exports, "TimesheetStatus", { enumerable: true, get: function () { return constants_1.TimesheetStatus; } });
Object.defineProperty(exports, "AttendanceStatus", { enumerable: true, get: function () { return constants_1.AttendanceStatus; } });
Object.defineProperty(exports, "EmployeeStatus", { enumerable: true, get: function () { return constants_1.EmployeeStatus; } });
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return constants_1.NotificationType; } });
Object.defineProperty(exports, "AuditAction", { enumerable: true, get: function () { return constants_1.AuditAction; } });
Object.defineProperty(exports, "MilestoneStatus", { enumerable: true, get: function () { return constants_1.MilestoneStatus; } });
Object.defineProperty(exports, "Department", { enumerable: true, get: function () { return constants_1.Department; } });
__exportStar(require("./schemas"), exports);
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map