import 'dotenv/config';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setServers } from 'node:dns';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Doctor } from '../src/models/Doctor.js';
import { Appointment } from '../src/models/Appointment.js';
import { QueueTicket } from '../src/models/QueueTicket.js';
const id=(key:string)=>new mongoose.Types.ObjectId(createHash('sha256').update(`meditrack-fictional-demo-v1:${key}`).digest('hex').slice(0,24));
const patients=Array.from({length:10},(_,i)=>id(`patient:${i}`));
async function invoke(extra:NodeJS.ProcessEnv,args:string[]=[]){
 return new Promise<{code:number|null;output:string}>((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/seed-demo.ts',...args],{env:{...process.env,DEMO_ENV:'true',MONGODB_DB_NAME:'meditrack_demo',NODE_ENV:'development',...extra},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);child.on('error',reject);child.on('exit',code=>resolve({code,output}));});
}
async function snapshot(){return JSON.stringify({users:await User.find({email:{$regex:'^demo\\.'}}).sort('_id').lean(),doctors:await Doctor.find({name:{$regex:'\\(Fictional\\)$'}}).sort('_id').lean(),appointments:await Appointment.find({patient:{$in:patients}}).sort('_id').lean(),tickets:await QueueTicket.find({patient:{$in:patients}}).sort('_id').lean()});}
async function main(){
 if(process.env.RUN_ATLAS_TESTS!=='true'||env.MONGODB_DB_NAME!=='meditrack_demo'||env.NODE_ENV==='production')throw new Error('Explicit isolated demo test opt-in required');
 if(process.env.TEST_DNS_SERVERS)setServers(process.env.TEST_DNS_SERVERS.split(','));await mongoose.connect(env.MONGODB_URI,{dbName:'meditrack_demo',serverSelectionTimeoutMS:20000});
 try{
 assert.equal(await User.countDocuments({_id:{$in:patients},role:'PATIENT'}),10);assert.equal(await User.countDocuments({role:'STAFF',email:{$regex:'^demo\\.'}}),4);assert.equal(await User.countDocuments({role:'ADMIN',email:{$regex:'^demo\\.'}}),1);assert.equal(await Doctor.countDocuments({_id:{$in:Array.from({length:16},(_,i)=>id(`doctor:${i}`))}}),16);console.log('PASS fictional account and doctor counts');
 const states=await QueueTicket.distinct('status',{patient:{$in:patients}});for(const status of ['WAITING','ALMOST_TURN','CALLING','IN_CONSULTATION','HELD','SKIPPED','COMPLETED'])assert.ok(states.includes(status),`Missing ${status}`);console.log('PASS representative valid queue states');
 const before=await snapshot();const seeded=await invoke({});assert.equal(seeded.code,0);assert.equal(await snapshot(),before);console.log('PASS seed rerun preserves records and capacities exactly');
 const production=await invoke({NODE_ENV:'production'});assert.equal(production.code,1);assert.match(production.output,/Seed refused/);console.log('PASS production seed refused');
 const unconfigured=await invoke({DEMO_ENV:'false'});assert.equal(unconfigured.code,1);assert.match(unconfigured.output,/Seed refused/);console.log('PASS missing explicit demo opt-in refused');
 const reset=await invoke({DEMO_RESET_CONFIRM:''},['--reset']);assert.equal(reset.code,1);assert.match(reset.output,/Reset refused/);assert.equal(await snapshot(),before);console.log('PASS unconfirmed reset refused without deleting records');
 for(const appointment of await Appointment.find({patient:{$in:patients},status:{$ne:'CANCELLED'}})){
 const doctor=await Doctor.findById(appointment.doctor);const slot=doctor?.availabilitySlots.find(s=>s.date.toISOString().slice(0,10)===appointment.appointmentDate.toISOString().slice(0,10)&&s.startTime===appointment.timeSlot);assert.ok(slot&&slot.bookedCount<=slot.capacity&&slot.bookedCount>0);
 if(appointment.queueTicket){const ticket=await QueueTicket.findById(appointment.queueTicket);assert.ok(ticket);assert.equal(String(ticket.patient),String(appointment.patient));if(ticket.status==='COMPLETED')assert.equal(appointment.status,'COMPLETED');}
 }
 console.log(`PASS ${await Appointment.countDocuments({patient:{$in:patients}})} persisted demo/patient-browser appointments satisfy slots, capacity and queue ownership`);
 }finally{await mongoose.disconnect();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Seed verification failed');process.exitCode=1;});
