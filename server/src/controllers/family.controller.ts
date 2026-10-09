import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { FamilyService } from '../services/family.service.js';
export const listFamilyMembers = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: { familyMembers: await FamilyService.list(req.user!.id) } });
});
export const createFamilyMember = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: { familyMember: await FamilyService.create(req.user!.id, req.body) } });
});
export const updateFamilyMember = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: { familyMember: await FamilyService.update(req.user!.id, req.params.id as string, req.body) } });
});
export const deleteFamilyMember = asyncHandler(async (req: Request, res: Response) => {
  await FamilyService.remove(req.user!.id, req.params.id as string);
  res.status(204).send();
});
