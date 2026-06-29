import { Request, Response } from 'express';
import { employeeService } from './employee.service';
import { sendSuccess, sendCreated, sendError, asyncHandler } from '../../utils/response';
import { PaginationSchema, CreateEmployeeSchema, UpdateEmployeeSchema } from '@tvs/shared';
import { z } from 'zod';

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const query = PaginationSchema.extend({
    departmentId: z.string().optional(),
    status: z.string().optional(),
  }).parse(req.query);

  const result = await employeeService.getAll({
    page: query.page,
    limit: query.limit,
    search: query.search,
    departmentId: query.departmentId,
    status: query.status,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  sendSuccess(res, result, 'Employees retrieved');
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.getById(req.params.id);
  sendSuccess(res, employee, 'Employee retrieved');
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = CreateEmployeeSchema.parse(req.body);
  const employee = await employeeService.create(data, req.user?.userId);
  sendCreated(res, employee, 'Employee created successfully');
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = UpdateEmployeeSchema.parse(req.body);
  const employee = await employeeService.update(req.params.id, data);
  sendSuccess(res, employee, 'Employee updated successfully');
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await employeeService.delete(req.params.id);
  sendSuccess(res, null, 'Employee deactivated successfully');
});

export const getEmployeeAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = z.object({
    month: z.coerce.number().min(1).max(12),
    year: z.coerce.number().min(2020).max(2100),
  }).parse(req.query);

  const availability = await employeeService.getAvailability(req.params.id, month, year);
  sendSuccess(res, availability, 'Employee availability retrieved');
});

export const getSkillMatrix = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId } = z.object({ departmentId: z.string().optional() }).parse(req.query);
  const matrix = await employeeService.getSkillMatrix(departmentId);
  sendSuccess(res, matrix, 'Skill matrix retrieved');
});
