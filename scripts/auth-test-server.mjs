import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
// These credentials are synthetic and confined to the local test runtime.
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--local-protocol', 'https', '--port', '8787', '--var', 'ACCESS_PASSWORD:synthetic-auth-e2e-only', '--var', `SESSION_SECRET:${randomBytes(32).toString('hex')}`], { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('exit', code => process.exit(code ?? 1));
