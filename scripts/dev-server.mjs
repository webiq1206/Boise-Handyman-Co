import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

// Preserve the existing Next.js server while accepting supervised-preview flags.
const require = createRequire(import.meta.url);
const forwarded = process.argv.slice(2);
const args = [];
for (const arg of forwarded) {
  if (arg === '--strictPort') continue; // An explicit Next.js port already fails if occupied.
  args.push(arg === '--host' ? '--hostname' : arg);
}
if (!args.some(arg => arg === '-p' || arg === '--port' || arg.startsWith('--port='))) {
  args.push('--port', '5000');
}
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...args], {
  stdio: 'inherit',
  env: process.env,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
