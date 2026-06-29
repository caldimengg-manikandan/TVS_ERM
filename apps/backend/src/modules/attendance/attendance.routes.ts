import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler, sendSuccess, sendCreated } from '../../utils/response';
import { prisma } from '../../config/database';
import { CheckInSchema, CheckOutSchema, ManualAttendanceSchema } from '@tvs/shared';
import { isAdmin } from '../../middleware/auth';
import { z } from 'zod';
import { format } from 'date-fns';

const router = Router();
router.use(authenticate);

// GET /api/attendance/today
router.get('/today', asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const today = format(new Date(), 'yyyy-MM-dd');
  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: new Date(today) } },
  });

  sendSuccess(res, attendance || { status: 'NOT_CHECKED_IN' }, 'Today attendance retrieved');
}));

// POST /api/attendance/check-in
router.post('/check-in', asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing?.checkIn) throw new Error('Already checked in today');

  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    update: { checkIn: new Date(), status: 'PRESENT' },
    create: {
      employeeId, date: today,
      checkIn: new Date(),
      status: 'PRESENT',
    },
  });

  sendCreated(res, attendance, 'Check-in recorded');
}));

// POST /api/attendance/check-out
router.post('/check-out', asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!attendance?.checkIn) throw new Error('No check-in found for today');
  if (attendance.checkOut) throw new Error('Already checked out today');

  const now = new Date();
  const workedMs = now.getTime() - attendance.checkIn.getTime();
  const workedHours = Math.round((workedMs / (1000 * 60 * 60)) * 100) / 100;

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: now,
      workedHours,
      status: workedHours >= 4 ? 'PRESENT' : 'HALF_DAY',
    },
  });

  sendSuccess(res, updated, 'Check-out recorded');
}));

// GET /api/attendance - Monthly attendance
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { month, year, employeeId: targetEmpId } = z.object({
    month: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
    year: z.coerce.number().default(new Date().getFullYear()),
    employeeId: z.string().optional(),
  }).parse(req.query);

  const employeeId = targetEmpId || req.user!.employeeId;
  if (!employeeId) throw new Error('Employee profile not found');

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
  });

  const summary = {
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    halfDay: records.filter(r => r.status === 'HALF_DAY').length,
    leave: records.filter(r => r.status === 'LEAVE').length,
    totalWorkedHours: records.reduce((sum, r) => sum + r.workedHours, 0),
    avgWorkedHours: records.length > 0 
      ? records.reduce((sum, r) => sum + r.workedHours, 0) / records.length 
      : 0,
  };

  sendSuccess(res, { records, summary }, 'Attendance retrieved');
}));

// POST /api/attendance/manual - Admin manual entry
router.post('/manual', isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = ManualAttendanceSchema.parse(req.body);
  const date = new Date(data.date);

  const checkIn = data.checkIn ? new Date(`${data.date}T${data.checkIn}`) : undefined;
  const checkOut = data.checkOut ? new Date(`${data.date}T${data.checkOut}`) : undefined;
  const workedHours = checkIn && checkOut
    ? Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100
    : 0;

  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date } },
    update: { checkIn, checkOut, workedHours, status: data.status, notes: data.notes, isManual: true },
    create: {
      employeeId: data.employeeId, date, checkIn, checkOut, workedHours,
      status: data.status, notes: data.notes, isManual: true,
    },
  });

  sendCreated(res, attendance, 'Manual attendance recorded');
}));

export default router;
