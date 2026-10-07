import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { DepartmentService } from '../services/department.service.js';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const departments = await DepartmentService.getAllDepartments(search);
  res.status(200).json({
    success: true,
    message: 'Departments fetched successfully',
    data: { departments },
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const department = await DepartmentService.getDepartmentById(id);
  res.status(200).json({
    success: true,
    message: 'Department details fetched successfully',
    data: { department },
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const department = await DepartmentService.createDepartment(req.body);
  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: { department },
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const department = await DepartmentService.updateDepartment(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    data: { department },
  });
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const department = await DepartmentService.deactivateDepartment(id);
  res.status(200).json({
    success: true,
    message: 'Department deactivated successfully',
    data: { department },
  });
});
