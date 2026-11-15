import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.platform === 'win32' ? 'py' : 'python3';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = [];
let shuttingDown = false;

function start(label, command, args, cwd) {
  console.log(`[${label}] starting...`);
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  children.push(child);
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`[${label}] exited with code ${code ?? 1}`);
      shutdown(code ?? 1);
    }
  });
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child.killed || child.exitCode !== null) continue;
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('Rocky-LM');
console.log('  backend  http://localhost:8001');
console.log('  frontend http://localhost:5173');
console.log('  press Ctrl+C to stop both\n');

start('backend', python, ['main.py'], path.join(root, 'backend'));
start('frontend', npm, ['run', 'dev'], path.join(root, 'frontend'));
