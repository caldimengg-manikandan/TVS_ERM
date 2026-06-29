import { Router, Request, Response } from 'express';
import { authenticate, isAdmin, isProjectManager } from '../../middleware/auth';
import { asyncHandler, sendSuccess, sendCreated } from '../../utils/response';
import { resourceService } from './resource.service';
import { CreateAllocationSchema, BulkAllocationSchema, PaginationSchema, AuditAction } from '@tvs/shared';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../middleware/validate';
import { auditLog } from '../../middleware/audit';

const router = Router();
router.use(authenticate);

const gridQuerySchema = PaginationSchema.extend({
  departmentId: z.string().optional(),
  projectId: z.string().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).optional(),
});

// GET /api/resources/grid - Main resource allocation grid
router.get('/grid', isProjectManager, validateQuery(gridQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as any;
  const result = await resourceService.getAllocationGrid(query);
  sendSuccess(res, result, 'Resource allocation grid retrieved');
}));

const utilQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
  year: z.coerce.number().default(new Date().getFullYear()),
});

// GET /api/resources/utilization - Monthly utilization summary
router.get('/utilization', isProjectManager, validateQuery(utilQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = req.query as any;
  const result = await resourceService.getUtilizationSummary(month, year);
  sendSuccess(res, result, 'Utilization summary retrieved');
}));

// GET /api/resources/employee/:id - Employee allocations
router.get('/employee/:id', isProjectManager, asyncHandler(async (req: Request, res: Response) => {
  const allocations = await resourceService.getEmployeeAllocations(req.params.id);
  sendSuccess(res, allocations, 'Employee allocations retrieved');
}));

// GET /api/resources/project/:id - Project allocations
router.get('/project/:id', isProjectManager, asyncHandler(async (req: Request, res: Response) => {
  const allocations = await resourceService.getProjectAllocations(req.params.id);
  sendSuccess(res, allocations, 'Project allocations retrieved');
}));

// POST /api/resources - Create allocation
router.post('/', isProjectManager, validateBody(CreateAllocationSchema), auditLog({ action: AuditAction.CREATE, entityType: 'RESOURCE_ALLOCATION', captureBody: true }), asyncHandler(async (req: Request, res: Response) => {
  const allocation = await resourceService.allocate(req.body, req.user?.userId);
  sendCreated(res, allocation, 'Resource allocated successfully');
}));

// POST /api/resources/bulk - Bulk allocation
router.post('/bulk', isProjectManager, validateBody(BulkAllocationSchema), auditLog({ action: AuditAction.CREATE, entityType: 'RESOURCE_ALLOCATION', captureBody: true, getDescription: () => 'Bulk Allocation' }), asyncHandler(async (req: Request, res: Response) => {
  const { projectId, allocations } = req.body;
  const result = await resourceService.bulkAllocate(
    projectId,
    allocations.map((a: any) => ({ ...a, projectId })),
    req.user?.userId
  );
  sendCreated(res, result, 'Bulk allocation processed');
}));

// PUT /api/resources/:id - Update allocation
router.put('/:id', isProjectManager, validateBody(CreateAllocationSchema.partial()), auditLog({ action: AuditAction.UPDATE, entityType: 'RESOURCE_ALLOCATION', captureBody: true }), asyncHandler(async (req: Request, res: Response) => {
  const allocation = await resourceService.updateAllocation(req.params.id, req.body);
  sendSuccess(res, allocation, 'Allocation updated');
}));

// DELETE /api/resources/:id - Cancel allocation
router.delete('/:id', isProjectManager, auditLog({ action: AuditAction.DELETE, entityType: 'RESOURCE_ALLOCATION' }), asyncHandler(async (req: Request, res: Response) => {
  await resourceService.cancelAllocation(req.params.id);
  sendSuccess(res, null, 'Allocation cancelled');
}));

export default router;
