import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AppointmentService } from '../services/appointment.service.js';
import { registerSchema } from '../validators/auth.validator.js';
import { bookAppointmentSchema } from '../validators/appointment.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { StaffService } from '../services/staff.service.js';
import { staffProfileSchema, staffPreferencesSchema, createStaffSchema, updateStaffSchema } from '../validators/staff.validator.js';
export const getStaffProfile = asyncHandler(async (req, res) => { res.json({ success: true, data: { profile: await StaffService.profile(req.user!.id) } }); });
export const updateStaffProfile = asyncHandler(async (req, res) => { res.json({ success: true, data: { profile: await StaffService.updateProfile(req.user!.id, staffProfileSchema.parse(req.body)) } }); });
export const updateStaffPreferences = asyncHandler(async (req, res) => { res.json({ success: true, data: { profile: await StaffService.preferences(req.user!.id, staffPreferencesSchema.parse(req.body)) } }); });
export const getTeam = asyncHandler(async (_req, res) => { res.json({ success: true, data: { members: await StaffService.team() } }); });
export const createTeamMember = asyncHandler(async (req, res) => { res.status(201).json({ success: true, data: { member: await StaffService.create(createStaffSchema.parse(req.body)) } }); });
export const updateTeamMember = asyncHandler(async (req, res) => { res.json({ success: true, data: { member: await StaffService.updateTeam(String(req.params.id), updateStaffSchema.parse(req.body)) } }); });
export const registerWalkIn = asyncHandler(async (req,res)=>{
  const patient=await AuthService.registerPatient(registerSchema.parse(req.body));
  res.status(201).json({success:true,data:{patient},message:'Patient account registered; book and check in separately.'});
});
export const findPatients = asyncHandler(async (req,res)=>{
  const search=z.string().trim().min(3).max(100).parse(req.query.search);
  const patients=await StaffService.findPatients(search);
  res.json({success:true,data:{patients}});
});
export const bookForPatient = asyncHandler(async (req,res)=>{
  const payload=z.object({patientId:z.string().regex(/^[a-f0-9]{24}$/i)}).passthrough().parse(req.body);
  const {patientId:id,...input}=payload;
  const appointment=await AppointmentService.bookAppointment(id,bookAppointmentSchema.parse(input));
  res.status(201).json({success:true,data:{appointment},message:'Appointment booked'});
});
