import { Router, Request, Response } from 'express';
import { authenticate, isTeamLead, authorize } from '../../middleware/auth';
import { asyncHandler, sendSuccess, sendCreated } from '../../utils/response';
import { timesheetService } from './timesheet.service';
import { SaveTimesheetSchema, ApproveTimesheetSchema } from '@tvs/shared';
import { UserRole } from '@tvs/shared';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

// GET /api/timesheets/week - Get weekly timesheet for current user
router.get('/week', asyncHandler(async (req: Request, res: Response) => {
  const { weekStartDate } = z.object({
    weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(req.query);

  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const timesheet = await timesheetService.getWeeklyTimesheet(employeeId, weekStartDate);
  sendSuccess(res, timesheet, 'Timesheet retrieved');
}));

// POST /api/timesheets - Save/auto-save timesheet
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = SaveTimesheetSchema.parse(req.body);
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const timesheet = await timesheetService.saveTimesheet(employeeId, data);
  sendSuccess(res, timesheet, 'Timesheet saved');
}));

// POST /api/timesheets/:id/submit
router.post('/:id/submit', asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const result = await timesheetService.submitTimesheet(req.params.id, employeeId);
  sendSuccess(res, result, result.message);
}));

// POST /api/timesheets/:id/approve - TL or Admin approval
router.post('/:id/approve', isTeamLead, asyncHandler(async (req: Request, res: Response) => {
  const { action, comments } = ApproveTimesheetSchema.pick({ action: true, comments: true }).parse(req.body);
  const result = await timesheetService.approveTimesheet(
    req.params.id,
    req.user!.userId,
    action,
    req.user!.role,
    comments
  );
  sendSuccess(res, result, result.message);
}));

// GET /api/timesheets/pending - Pending approvals for TL/Admin
router.get('/pending', isTeamLead, asyncHandler(async (req: Request, res: Response) => {
  const pending = await timesheetService.getPendingApprovals(req.user!.userId, req.user!.role);
  sendSuccess(res, pending, 'Pending timesheets retrieved');
}));

// GET /api/timesheets/copy-previous
router.get('/copy-previous', asyncHandler(async (req: Request, res: Response) => {
  const { weekStartDate } = z.object({
    weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).parse(req.query);

  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const result = await timesheetService.copyPreviousWeek(employeeId, weekStartDate);
  sendSuccess(res, result, result.message);
}));

// GET /api/timesheets/summary - Monthly summary
router.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = z.object({
    month: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
    year: z.coerce.number().default(new Date().getFullYear()),
  }).parse(req.query);

  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const summary = await timesheetService.getTimesheetSummary(employeeId, month, year);
  sendSuccess(res, summary, 'Timesheet summary retrieved');
}));

// GET /api/timesheets/summary/performance - Get extra hours and fast working data
router.get('/summary/performance', asyncHandler(async (req: Request, res: Response) => {
  const result = await timesheetService.getPerformanceSummary();
  sendSuccess(res, result, 'Performance summary retrieved');
}));

export default router;
