import 'dotenv/config';

import mongoose from 'mongoose';

import bcrypt from 'bcryptjs';

import { randomBytes, createHash } from 'node:crypto';

import { mkdir, writeFile, access, unlink } from 'node:fs/promises';

import { resolve } from 'node:path';

import { setServers } from 'node:dns';

import { env } from '../src/config/env.js';

import { User } from '../src/models/User.js';

import { Department } from '../src/models/Department.js';

import { Doctor } from '../src/models/Doctor.js';

import { FamilyMember } from '../src/models/FamilyMember.js';

import { Appointment } from '../src/models/Appointment.js';

import { QueueTicket } from '../src/models/QueueTicket.js';

import { QueueCounter } from '../src/models/QueueCounter.js';

import { Notification } from '../src/models/Notification.js';

import { AppointmentReminder } from '../src/models/AppointmentReminder.js';

import { AppointmentService } from '../src/services/appointment.service.js';

import { QueueService } from '../src/services/queue.service.js';

import { ReminderService } from '../src/services/reminder.service.js';

import { hospitalDate } from '../src/utils/hospitalDate.js';

const namespace = 'meditrack-fictional-demo-v1';

const id = (key: string) => new mongoose.Types.ObjectId(createHash('sha256').update(`${namespace}:${key}`).digest('hex').slice(0,24));

const patientIds = Array.from({length:10},(_,i)=>id(`patient:${i}`));

const staffIds = Array.from({length:4},(_,i)=>id(`staff:${i}`));

const userIds = [...patientIds,...staffIds,id('admin')];

const departmentIds = Array.from({length:8},(_,i)=>id(`department:${i}`));

const doctorIds = Array.from({length:16},(_,i)=>id(`doctor:${i}`));

const credentialPath = resolve('.demo/credentials.json');

async function finishRepresentativeData() {
  const today=hospitalDate();
  const departments=['General Medicine','Cardiology','ENT','Dermatology','Pediatrics','Orthopedics','Ophthalmology','General Surgery'];
  // Correct only the fictional seed's display metadata; never change identities or bookings.
  for(let i=0;i<16;i++) await Doctor.updateOne({_id:doctorIds[i]},{$set:{title:`Consultant - ${departments[i%8]}`}});
  for(const i of [8,9]) {
    const reason=`Fictional demo waiting scenario ${i}`;
    const appointment=(await Appointment.findOne({patient:patientIds[i],reason})) ?? await AppointmentService.bookAppointment(String(patientIds[i]),{doctorId:String(doctorIds[0]),date:today,time:'15:00',reason});
    if(!appointment.queueTicket) await QueueService.checkIn(String(patientIds[i]),String(appointment._id));
  }
  // Historical import: preserve a matching occupied slot and a supported terminal appointment.
  // Future/current appointments above always use the real booking and transition services.
  if(!await Appointment.exists({_id:id('historical-appointment')})) await mongoose.connection.transaction(async session=>{
    const date=new Date(new Date(`${today}T00:00:00Z`).getTime()-2*86400000);
    const doctor=await Doctor.findById(doctorIds[15]).session(session);
    if(!doctor)throw new Error('Historical demo doctor missing');
    doctor.availabilitySlots.push({date,startTime:'10:00',endTime:'10:30',capacity:5,bookedCount:1});
    await doctor.save({session});
    await new Appointment({_id:id('historical-appointment'),patient:patientIds[9],doctor:doctorIds[15],appointmentDate:date,timeSlot:'10:00',status:'COMPLETED',reason:'Fictional historical consultation',ref:'DEMO-HISTORICAL-001'}).save({session});
  });
}
async function main() {

  if (env.NODE_ENV === 'production' || process.env.DEMO_ENV !== 'true' || env.MONGODB_DB_NAME !== 'meditrack_demo') throw new Error('Seed refused: require non-production NODE_ENV, DEMO_ENV=true and MONGODB_DB_NAME=meditrack_demo.');

  if (process.env.TEST_DNS_SERVERS) setServers(process.env.TEST_DNS_SERVERS.split(','));

  await mongoose.connect(env.MONGODB_URI,{dbName:'meditrack_demo',serverSelectionTimeoutMS:20000});

  if (mongoose.connection.name !== 'meditrack_demo') throw new Error('Isolated demo database verification failed');

  const manifests = mongoose.connection.collection('demo_seed_manifests');

  const manifest = await manifests.findOne({_id:namespace as any});

  if (process.argv.includes('--reset')) {

    if (process.env.DEMO_RESET_CONFIRM !== 'meditrack_demo:fictional-only') throw new Error('Reset refused: require DEMO_RESET_CONFIRM=meditrack_demo:fictional-only');

    if (!manifest) throw new Error('Reset refused: no owned demo manifest');

    if (await Appointment.exists({doctor:{$in:doctorIds},patient:{$nin:userIds}})) throw new Error('Reset refused: unrelated appointment references a demo doctor.');

    if (await Doctor.exists({department:{$in:departmentIds},_id:{$nin:doctorIds}})) throw new Error('Reset refused: unrelated doctor references a demo department.');
    const appointments = await Appointment.find({patient:{$in:userIds}}).select('_id');

    const appointmentIds = appointments.map(a=>a._id);

    await Promise.all([Notification.deleteMany({user:{$in:userIds}}),AppointmentReminder.deleteMany({user:{$in:userIds}}),QueueTicket.deleteMany({patient:{$in:userIds}}),FamilyMember.deleteMany({owner:{$in:userIds}})]);

    await Appointment.deleteMany({_id:{$in:appointmentIds}});

    await QueueCounter.deleteMany({scopeKey:{$regex:'^DEPT:DEMO[1-8]:'}});

    // Refuse to delete doctors referenced by records outside this demo ownership set.

    if (await Appointment.exists({doctor:{$in:doctorIds}})) throw new Error('Reset stopped: an unrelated appointment uses a demo doctor. Preserve it and review manually.');

    await Doctor.deleteMany({_id:{$in:doctorIds}}); await Department.deleteMany({_id:{$in:departmentIds}}); await User.deleteMany({_id:{$in:userIds}});

    await manifests.deleteOne({_id:namespace as any});
    await unlink(credentialPath).catch(error=>{if(error.code!=='ENOENT')throw error;});

    console.log('Owned fictional demo records reset. Run seed:demo to regenerate credentials and data.'); return;

  }

  if (manifest) {

    if (!manifest.complete) throw new Error('Incomplete demo seed detected. Use explicitly confirmed seed:demo:reset before retrying.');

    await access(credentialPath).catch(()=>{throw new Error('Local credentials missing. Use confirmed demo reset to regenerate; passwords are never recoverable from hashes.');});

    if(manifest.version!==2){
      if(hospitalDate(manifest.createdAt)!==hospitalDate())throw new Error('Older seed needs an explicitly confirmed reset to create current-day queue scenarios.');
      await finishRepresentativeData();
      await manifests.updateOne({_id:namespace as any},{$set:{version:2}});
      console.log('Completed fictional historical and waiting scenarios. Reruns now make no changes.');
    }
    console.log(`Demo already seeded; credentials: ${credentialPath}`); return;

  }

  for (const collection of await mongoose.connection.db!.listCollections().toArray()) {

    if (collection.name !== 'demo_seed_manifests' && await mongoose.connection.db!.collection(collection.name).estimatedDocumentCount()) throw new Error('Seed refused: target contains data without an owned fictional demo manifest.');

  }

  await manifests.insertOne({_id:namespace as any,complete:false,createdAt:new Date(),fictional:true});

  await Promise.all([Notification.init(),AppointmentReminder.init(),QueueCounter.init()]);

  const departments = ['General Medicine','Cardiology','ENT','Dermatology','Pediatrics','Orthopedics','Ophthalmology','General Surgery'];

  for (let i=0;i<8;i++) await Department.create({_id:departmentIds[i],name:departments[i],code:`DEMO${i+1}`,description:'Fictional teaching hospital demo department',roomNumber:`${i+1}01`,isActive:true});

  const names = ['Nimali Senaratne','Kasun Wickramasinghe','Tharushi Jayawardena','Chamath Perera','Dilini Ratnayake','Sahan Fernando','Ishara Bandara','Malithi Abeysekera','Kavindu Gunasekara','Sanduni Ekanayake','Ravindu Samarasinghe','Nethmi Wijesinghe','Lahiru Dissanayake','Hiruni De Silva','Dinesh Karunaratne','Sachini Nanayakkara'];

  const today = hospitalDate();

  const dates = Array.from({length:15},(_,i)=>new Date(new Date(`${today}T00:00:00Z`).getTime()+i*86400000).toISOString().slice(0,10));

  for (let i=0;i<16;i++) await Doctor.create({_id:doctorIds[i],name:`Dr. ${names[i]} (Fictional)`,department:departmentIds[i%8],title:`Consultant — ${departments[i%8]}`,experienceYears:8+i,consultationFee:1500+(i%4)*500,roomNumber:`${i%8+1}0${i<8?1:2}`,availabilityStatus:'AVAILABLE',isActive:true,availabilitySlots:dates.flatMap(date=>['09','10','11','14','15','16'].map(hour=>({date:new Date(`${date}T00:00:00Z`),startTime:`${hour}:00`,endTime:`${hour}:30`,capacity:5,bookedCount:0})))});

  const credentials: {name:string;role:string;email:string;phone:string;password:string}[]=[];

  for (let i=0;i<userIds.length;i++) {

    const role=i<10?'PATIENT':i<14?'STAFF':'ADMIN';

    const name=i<10?`${names[i]} (Fictional Patient)`:i<14?`${names[i]} (Fictional Staff)`:'MediTrack Fictional Admin';

    const password=randomBytes(18).toString('base64url'); const email=`demo.${role.toLowerCase()}.${i+1}@example.invalid`; const phone=`099000${String(i+1).padStart(4,'0')}`;

    await User.create({_id:userIds[i],name,email,phone,passwordHash:await bcrypt.hash(password,12),role,isActive:true,...(role!=='PATIENT'?{staffRole:role==='ADMIN'?'ADMIN':'RECEPTIONIST',staffId:`DEMO-${i+1}`}:{dateOfBirth:new Date('1990-01-01'),address:'Fictional demo address, Kandy',gender:i%2?'Male':'Female'})});

    credentials.push({name,role,email,phone,password});

  }

  await mkdir(resolve('.demo'),{recursive:true}); await writeFile(credentialPath,JSON.stringify({developmentOnly:true,database:'meditrack_demo',accounts:credentials},null,2),{mode:0o600});

  for(let i=0;i<4;i++) await FamilyMember.create({_id:id(`family:${i}`),owner:patientIds[i],name:`Fictional Family Member ${i+1}`,relationship:'Child',dateOfBirth:new Date('2015-01-01')});

  for(let i=0;i<10;i++) await AppointmentService.bookAppointment(String(patientIds[i]),{doctorId:String(doctorIds[i]),date:dates[1],time:'10:00',reason:'Fictional demo follow-up',...(i<4?{familyMemberId:String(id(`family:${i}`))}:{})});

  for(let i=0;i<7;i++) {

    const appointment=await AppointmentService.bookAppointment(String(patientIds[i]),{doctorId:String(doctorIds[i]),date:today,time:'14:00',reason:'Fictional demo OPD consultation'});

    const ticket=await QueueService.checkIn(String(patientIds[i]),String(appointment._id));

    if(i===1) await QueueService.getMyActiveTicket(String(patientIds[i]));

    if([2,3,6].includes(i)) await QueueService.callNext({doctorId:String(doctorIds[i])});

    if([3,6].includes(i)) await QueueService.startConsultation(String(ticket._id));

    if(i===4) await QueueService.hold(String(ticket._id));

    if(i===5) await QueueService.skip(String(ticket._id));

    if(i===6) await QueueService.completeConsultation(String(ticket._id));

  }

  const cancelled=await AppointmentService.bookAppointment(String(patientIds[8]),{doctorId:String(doctorIds[8]),date:dates[2],time:'09:00'});

  await AppointmentService.cancelAppointment(String(cancelled._id),String(patientIds[8]));

  const rescheduled=await AppointmentService.bookAppointment(String(patientIds[9]),{doctorId:String(doctorIds[9]),date:dates[2],time:'09:00'});

  await AppointmentService.rescheduleAppointment(String(rescheduled._id),String(patientIds[9]),{date:dates[3],time:'11:00'});

  await finishRepresentativeData();
  await ReminderService.run();

  await manifests.updateOne({_id:namespace as any},{$set:{complete:true,version:2,completedAt:new Date()}});

  console.log(`Isolated fictional demo seeded: 8 departments, 16 doctors, 10 patients, 4 staff, 1 admin, ${await Appointment.countDocuments()} appointments. Credentials: ${credentialPath}`);

}

main().catch(error=>{console.error(error instanceof Error ? error.message : 'Demo seed failed');process.exitCode=1;}).finally(()=>mongoose.disconnect());
