import { spawn } from 'node:child_process';

const children = [];

function start(cwd, args, name) {
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
    shell: process.platform === 'win32',
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`[${name}] Error:`, error.message);
    stop();
  });
  child.on('exit', (code) => {
    if (!stopping) {
      process.exitCode = code ?? 1;
      stop();
    }
  });
}

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (process.platform === 'win32' && child.pid && child.exitCode === null) {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

console.log(`
=====================================================
  🏥 MediTrack System Running:
  ---------------------------------------------------
  👤 Patient Portal : http://localhost:5173/login
  👩‍⚕️ Staff Portal   : http://localhost:5173/staff/login
  📊 Staff Flow Desk : http://localhost:5173/staff/flow
  🩺 API Health Check: http://localhost:5001/api/health
=====================================================
`);
start('server', ['run', 'dev'], 'server');
start('client', ['run', 'dev'], 'client');
