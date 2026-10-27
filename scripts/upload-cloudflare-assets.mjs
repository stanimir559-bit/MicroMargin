// Uses only the short-lived upload-session JWT returned by the Cloudflare API.
// Input and the completion JWT are for the calling orchestrator; never persist them.
import { readFileSync } from 'node:fs';
import { resolve, sep, extname } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdout.write('Ready for private upload-session JSON on stdin.\n');
process.stdin.resume(); process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', async chunk => {
  if (chunk.includes('\u0003')) process.exit(130);
  input += chunk;
  if (input.length > 200_000) process.exit(1);
  if (!/[\r\n]/.test(input)) return;
  process.stdin.pause();
  try {
    const { accountId, jwt, buckets } = JSON.parse(input.trim()); input = '';
    if (!/^[a-f0-9]{32}$/.test(accountId) || typeof jwt !== 'string' || !Array.isArray(buckets)) throw new Error('Invalid upload session.');
    const root = resolve('dist');
    const manifest = JSON.parse(readFileSync('.cloudflare/assets-manifest.json', 'utf8'));
    const byHash = new Map(Object.entries(manifest).map(([path, value]) => [value.hash, { path, ...value }]));
    const mime = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.mjs': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8', '.pdf': 'application/pdf', '.txt': 'text/plain;charset=utf-8', '.json': 'application/json' };
    let completionJwt; let uploaded = 0;
    for (const bucket of buckets) {
      process.stderr.write(`Uploading a batch of ${bucket.length} built assets.\n`);
      const boundary = `MicroMarginAsset${randomBytes(16).toString('hex')}`;
      const parts = [];
      for (const hash of bucket) {
        const entry = byHash.get(hash); if (!entry) throw new Error('Unexpected upload hash.');
        const file = resolve(root, entry.path.slice(1));
        if (!file.startsWith(root + sep)) throw new Error('Invalid asset path.');
        const data = readFileSync(file);
        const digest = createHash('sha256').update(data.toString('base64') + extname(file).slice(1)).digest('hex').slice(0, 32);
        if (digest !== hash || data.length !== entry.size) throw new Error('Built asset changed after registration.');
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${hash}"\r\nContent-Type: ${mime[extname(file)] ?? 'application/octet-stream'}\r\n\r\n${data.toString('base64')}\r\n`);
        uploaded += 1;
      }
      parts.push(`--${boundary}--\r\n`);
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/assets/upload?base64=true`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body: parts.join('') });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(`Asset upload failed (${response.status}): ${JSON.stringify(result.errors ?? [])}`);
      if (result.result?.jwt) completionJwt = result.result.jwt;
    }
    if (!completionJwt) throw new Error('No completion token returned.');
    // Keep secret chunks short so terminal wrapping cannot corrupt the protocol.
    process.stdout.write(`UPLOAD_RESULT:${JSON.stringify({ completionJwtChunks: completionJwt.match(/.{1,48}/g), uploaded }, null, 2)}\n`);
    process.exit(0);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exit(1); }
});
