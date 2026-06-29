import { Router } from 'express';
import * as employeeController from './employee.controller';
import { authenticate, isAdmin, isProjectManager } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', isProjectManager, employeeController.getEmployees);
router.get('/skill-matrix', isProjectManager, employeeController.getSkillMatrix);
router.get('/:id', isProjectManager, employeeController.getEmployee);
router.get('/:id/availability', isProjectManager, employeeController.getEmployeeAvailability);
router.post('/', isAdmin, employeeController.createEmployee);
router.put('/:id', isAdmin, employeeController.updateEmployee);
router.delete('/:id', isAdmin, employeeController.deleteEmployee);

export default router;
