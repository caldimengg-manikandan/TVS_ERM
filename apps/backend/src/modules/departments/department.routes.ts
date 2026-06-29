import { Router, Request, Response } from 'express';
import { authenticate, isAdmin } from '../../middleware/auth';
import { asyncHandler, sendSuccess, sendCreated } from '../../utils/response';
import { prisma } from '../../config/database';
import { CreateDepartmentSchema, UpdateDepartmentSchema, PaginationSchema } from '@tvs/shared';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { employees: true } },
      children: { select: { id: true, name: true, code: true } },
    },
    orderBy: { name: 'asc' },
  });
  sendSuccess(res, departments, 'Departments retrieved');
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const dept = await prisma.department.findUnique({
    where: { id: req.params.id },
    include: {
      employees: {
        where: { deletedAt: null, status: 'ACTIVE' },
        select: { id: true, employeeId: true, firstName: true, lastName: true, designation: true },
      },
      children: true,
      parent: { select: { id: true, name: true, code: true } },
      _count: { select: { employees: true } },
    },
  });
  if (!dept) throw new Error('Department not found');
  sendSuccess(res, dept, 'Department retrieved');
}));

router.post('/', isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = CreateDepartmentSchema.parse(req.body);
  const dept = await prisma.department.create({ data: { ...data, code: data.code.toUpperCase() } });
  sendCreated(res, dept, 'Department created');
}));

router.put('/:id', isAdmin, asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateDepartmentSchema.parse(req.body);
  const dept = await prisma.department.update({ where: { id: req.params.id }, data });
  sendSuccess(res, dept, 'Department updated');
}));

router.delete('/:id', isAdmin, asyncHandler(async (req: Request, res: Response) => {
  await prisma.department.update({ where: { id: req.params.id }, data: { isActive: false } });
  sendSuccess(res, null, 'Department deactivated');
}));

export default router;
