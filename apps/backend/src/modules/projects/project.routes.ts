// Force restart 2: load tsconfig paths mapping
import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticate, isAdmin, isProjectManager, isTeamLead } from '../../middleware/auth';
import { asyncHandler, sendSuccess, sendCreated } from '../../utils/response';
import { projectService } from './project.service';
import { CreateProjectSchema, UpdateProjectSchema, PaginationSchema, CloneProjectSchema } from '@tvs/shared';
import { AuditAction } from '@tvs/shared';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../middleware/validate';
import { auditLog } from '../../middleware/audit';

const router = Router();
router.use(authenticate);

// GET /api/projects
const projectQuerySchema = PaginationSchema.extend({
  status: z.string().optional(),
  priority: z.string().optional(),
  departmentId: z.string().optional(),
  projectManagerId: z.string().optional(),
});

// GET /api/projects
router.get('/', validateQuery(projectQuerySchema), asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as any;
  const result = await projectService.getAll({ ...query, page: query.page, limit: query.limit });
  sendSuccess(res, result, 'Projects retrieved');
}));

// GET /api/projects/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getById(req.params.id);
  sendSuccess(res, project, 'Project retrieved');
}));

// POST /api/projects
router.post('/', isProjectManager, validateBody(CreateProjectSchema), auditLog({ action: AuditAction.CREATE, entityType: 'PROJECT', captureBody: true }), asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.create(req.body, req.user?.userId);
  sendCreated(res, project, 'Project created successfully');
}));

// PUT /api/projects/:id
router.put('/:id', isProjectManager, validateBody(UpdateProjectSchema), auditLog({ action: AuditAction.UPDATE, entityType: 'PROJECT', captureBody: true }), asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.update(req.params.id, req.body);
  sendSuccess(res, project, 'Project updated successfully');
}));

// POST /api/projects/:id/archive
router.post('/:id/archive', isAdmin, auditLog({ action: AuditAction.UPDATE, entityType: 'PROJECT', getDescription: () => 'Archived Project' }), asyncHandler(async (req: Request, res: Response) => {
  await projectService.archive(req.params.id);
  sendSuccess(res, null, 'Project archived');
}));

// DELETE /api/projects/:id
router.delete('/:id', isAdmin, auditLog({ action: AuditAction.DELETE, entityType: 'PROJECT' }), asyncHandler(async (req: Request, res: Response) => {
  await projectService.delete(req.params.id);
  sendSuccess(res, null, 'Project deleted');
}));

// POST /api/projects/:id/clone
router.post('/:id/clone', isProjectManager, validateBody(CloneProjectSchema), auditLog({ action: AuditAction.CREATE, entityType: 'PROJECT', getDescription: (req) => `Cloned from Project ${req.params.id}` }), asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.clone(req.params.id, req.body);
  sendCreated(res, project, 'Project cloned successfully');
}));

const memberSchema = z.object({ employeeId: z.string().uuid(), role: z.string().default('Member') });

// POST /api/projects/:id/members
router.post('/:id/members', isProjectManager, validateBody(memberSchema), auditLog({ action: AuditAction.UPDATE, entityType: 'PROJECT', getDescription: () => 'Added member' }), asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, role } = req.body;
  const member = await projectService.addMember(req.params.id, employeeId, role);
  sendCreated(res, member, 'Member added to project');
}));

// DELETE /api/projects/:id/members/:employeeId
router.delete('/:id/members/:employeeId', isProjectManager, auditLog({ action: AuditAction.UPDATE, entityType: 'PROJECT', getDescription: () => 'Removed member' }), asyncHandler(async (req: Request, res: Response) => {
  await projectService.removeMember(req.params.id, req.params.employeeId);
  sendSuccess(res, null, 'Member removed from project');
}));

export default router;
