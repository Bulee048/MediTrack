import { z } from 'zod';
import { User } from '../models/User.js';
import { AuthService } from '../services/auth.service.js';
import { AppointmentService } from '../services/appointment.service.js';
import { registerSchema } from '../validators/auth.validator.js';
import { bookAppointmentSchema } from '../validators/appointment.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const registerWalkIn = asyncHandler(async (req,res)=>{
  const patient=await AuthService.registerPatient(registerSchema.parse(req.body));
  res.status(201).json({success:true,data:{patient},message:'Patient account registered; book and check in separately.'});
});
export const findPatients = asyncHandler(async (req,res)=>{
  const search=z.string().trim().min(3).max(100).parse(req.query.search);
  // Escape input rather than accepting a caller-supplied regular expression.
  const escaped=search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const patients=await User.find({role:'PATIENT',isActive:true,$or:[{name:{$regex:escaped,$options:'i'}},{phone:search},{email:search.toLowerCase()}]}).select('name phone email').limit(20);
  res.json({success:true,data:{patients}});
});
export const bookForPatient = asyncHandler(async (req,res)=>{
  const payload=z.object({patientId:z.string().regex(/^[a-f0-9]{24}$/i)}).passthrough().parse(req.body);
  const {patientId:id,...input}=payload;
  const appointment=await AppointmentService.bookAppointment(id,bookAppointmentSchema.parse(input));
  res.status(201).json({success:true,data:{appointment},message:'Appointment booked'});
});
