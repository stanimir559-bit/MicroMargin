import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, extname, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve('dist');
const manifest = {};
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const file = join(directory, name);
    if (statSync(file).isDirectory()) { walk(file); continue; }
    if (['_headers', '_redirects', '.assetsignore'].includes(name) || name.endsWith('.map')) continue;
    const data = readFileSync(file);
    manifest[`/${relative(root, file).replaceAll('\\', '/')}`] = {
      hash: createHash('sha256').update(data.toString('base64') + extname(file).slice(1)).digest('hex').slice(0, 32),
      size: data.length,
    };
  }
}
walk(root);
mkdirSync('.cloudflare', { recursive: true });
writeFileSync('.cloudflare/assets-manifest.json', JSON.stringify(manifest, null, 2));
console.log(`Prepared ${Object.keys(manifest).length} built assets; no secrets in manifest.`);
