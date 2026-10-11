import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
const apiPort = Number(process.env.DEMO_API_PORT || 5004);
const clientPort = Number(process.env.DEMO_CLIENT_PORT || 5184);
for (const port of [apiPort, clientPort]) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid demo port');
  await new Promise((resolve,reject)=>{ const listener=createServer();listener.once('error',()=>reject(new Error(`Port ${port} is already in use; stop that service or configure DEMO_API_PORT/DEMO_CLIENT_PORT.`)));listener.listen(port,()=>listener.close(resolve)); });
}
const env = {...process.env,NODE_ENV:'development',DEMO_ENV:'true',MONGODB_DB_NAME:'meditrack_demo',TEST_DNS_SERVERS:process.env.TEST_DNS_SERVERS || '8.8.8.8,1.1.1.1',PORT:String(apiPort),CLIENT_URL:`http://localhost:${clientPort}`,VITE_API_BASE_URL:`http://localhost:${apiPort}/api`};
const children = [];
function start(cwd,args) { const child=spawn(process.platform==='win32'?'npm.cmd':'npm',args,{cwd,env,stdio:'inherit',windowsHide:true,shell:process.platform==='win32'}); children.push(child); child.on('error',error=>{console.error(error.message);stop();}); child.on('exit',code=>{if(!stopping){process.exitCode=code ?? 1;stop();}}); }
let stopping=false;
function stop(){if(stopping)return;stopping=true;for(const child of children){ if(process.platform==='win32' && child.pid && child.exitCode===null){spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}else child.kill('SIGTERM'); }}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
console.log(`Patient: http://localhost:${clientPort}/login\nStaff: http://localhost:${clientPort}/staff/login\nHealth: http://localhost:${apiPort}/api/health`);
start('server',['run','dev']);start('client',['run','dev','--','--host','localhost','--port',String(clientPort),'--strictPort']);
