import { describe, expect, it, vi } from 'vitest';
import { createWorker, SESSION_COOKIE, type Env } from '../worker/auth';

const origin = 'https://workspace.example';
const testPassword = 'test-only-password-43!';
const testSessionSecret = 'test-only-independent-session-secret-32characters';
const start = Date.parse('2026-10-27T10:00:00Z');
function environment(): Env {
  return { ACCESS_PASSWORD: testPassword, SESSION_SECRET: testSessionSecret, ASSETS: { fetch: vi.fn(async () => new Response('protected asset', { headers: { 'Cache-Control': 'public, max-age=31536000' } })) } };
}
function login(password = testPassword, options: { origin?: string; headers?: Record<string, string>; path?: string } = {}) {
  return new Request(`${origin}${options.path ?? '/auth/login'}`, { method: 'POST', headers: { Origin: options.origin ?? origin, 'Content-Type': 'application/x-www-form-urlencoded', ...options.headers }, body: new URLSearchParams({ password }) });
}
function sessionValue(response: Response): string { return (response.headers.get('Set-Cookie') ?? '').split(';')[0]; }

describe('Worker password boundary', () => {
  it('fails closed on every path when either secret is absent, blank or invalid', async () => {
    for (const overrides of [{ ACCESS_PASSWORD: undefined }, { ACCESS_PASSWORD: '  ' }, { SESSION_SECRET: undefined }, { SESSION_SECRET: 'short' }]) {
      const env = { ...environment(), ...overrides }; const worker = createWorker();
      for (const path of ['/', '/auth/login', '/assets/app.js', '/synthetic.pdf']) expect((await worker.fetch(new Request(`${origin}${path}`), env)).status).toBe(503);
      expect(env.ASSETS.fetch).not.toHaveBeenCalled();
    }
  });
  it('provides local bilingual login with no script and a self-only form CSP', async () => {
    const worker = createWorker(); const env = environment();
    const bg = await worker.fetch(new Request(`${origin}/auth/login`), env); expect(await bg.text()).toContain('Парола');
    const en = await worker.fetch(new Request(`${origin}/auth/login?lang=en`), env); const html = await en.text();
    expect(html).toContain('Password'); expect(html).not.toContain('<script'); expect(en.headers.get('Content-Security-Policy')).toContain("form-action 'self'"); expect(en.headers.get('Cache-Control')).toBe('private, no-store');
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it('redirects unauthenticated HTML to login without fetching assets', async () => {
    const env = environment(); const response = await createWorker().fetch(new Request(`${origin}/`, { headers: { Accept: 'text/html' } }), env);
    expect(response.status).toBe(303); expect(response.headers.get('Location')).toBe('/auth/login'); expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it('protects direct JS, index, PDF and worker files for GET and HEAD', async () => {
    const env = environment(); const worker = createWorker();
    for (const path of ['/index.html', '/assets/app.js', '/assets/pdf.worker.mjs', '/synthetic.pdf']) for (const method of ['GET', 'HEAD']) {
      const response = await worker.fetch(new Request(`${origin}${path}`, { method }), env);
      expect(response.status).toBe(401); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
      if (method === 'HEAD') expect(await response.text()).toBe('');
    }
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it('denies wrong password generically and never reflects it', async () => {
    const env = environment(); const response = await createWorker().fetch(login('incorrect-untrusted-value'), env);
    expect(response.status).toBe(401); expect(response.headers.get('Set-Cookie')).toBeNull(); expect(await response.text()).not.toContain('incorrect-untrusted-value'); expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it('sets an eight-hour host-only hardened cookie and ignores arbitrary next URLs', async () => {
    const response = await createWorker(() => start).fetch(login(testPassword, { path: '/auth/login?next=https://untrusted.example' }), environment());
    expect(response.status).toBe(303); expect(response.headers.get('Location')).toBe('/');
    const cookie = response.headers.get('Set-Cookie')!;
    for (const part of [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age=28800']) expect(cookie).toContain(part);
    expect(cookie).not.toContain('Domain='); expect(cookie).not.toContain(testPassword); expect(cookie).not.toContain(testSessionSecret);
  });
  it('serves protected assets with no-store, security headers and Cookie variance', async () => {
    const env = environment(); const worker = createWorker(() => start); const cookie = sessionValue(await worker.fetch(login(), env));
    const response = await worker.fetch(new Request(`${origin}/assets/app.js`, { headers: { Cookie: cookie } }), env);
    expect(response.status).toBe(200); expect(await response.text()).toBe('protected asset'); expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store'); expect(response.headers.get('CDN-Cache-Control')).toBe('no-store'); expect(response.headers.get('Vary')).toContain('Cookie');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff'); expect(response.headers.get('Content-Security-Policy')).toContain("form-action 'none'");
  });
  it('rejects forged and tampered cookies and duplicate host cookies', async () => {
    const env = environment(); const worker = createWorker(() => start); const cookie = sessionValue(await worker.fetch(login(), env));
    const token = cookie.slice(cookie.indexOf('=') + 1); const [payload, signature] = token.split('.');
    for (const raw of [`${SESSION_COOKIE}=forged`, `${SESSION_COOKIE}=${payload}.${signature[0] === 'a' ? 'b' : 'a'}${signature.slice(1)}`, `${cookie}; ${cookie}`, `${SESSION_COOKIE}=${'x'.repeat(9000)}`]) {
      expect((await worker.fetch(new Request(`${origin}/assets/app.js`, { headers: { Cookie: raw } }), env)).status).toBe(401);
    }
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it('rejects expired, excessively future-issued and other-origin sessions', async () => {
    let clock = start; const env = environment(); const worker = createWorker(() => clock); const cookie = sessionValue(await worker.fetch(login(), env));
    clock += 8 * 60 * 60 * 1000; expect((await worker.fetch(new Request(`${origin}/asset`, { headers: { Cookie: cookie } }), env)).status).toBe(401);
    clock = start - 120_000; expect((await worker.fetch(new Request(`${origin}/asset`, { headers: { Cookie: cookie } }), env)).status).toBe(401);
    clock = start; expect((await worker.fetch(new Request('https://different.example/asset', { headers: { Cookie: cookie } }), env)).status).toBe(401);
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it('invalidates existing sessions after either password or independent secret rotation', async () => {
    const env = environment(); const worker = createWorker(() => start); const cookie = sessionValue(await worker.fetch(login(), env));
    for (const override of [{ ACCESS_PASSWORD: 'a-different-test-password' }, { SESSION_SECRET: `${testSessionSecret}-rotated` }]) {
      expect((await worker.fetch(new Request(`${origin}/asset`, { headers: { Cookie: cookie } }), { ...env, ...override })).status).toBe(401);
    }
  });
  it('rejects missing, cross-origin and inconsistent fetch-site CSRF requests', async () => {
    const env = environment(); const worker = createWorker();
    const missing = login(); missing.headers.delete('Origin');
    for (const request of [missing, login(testPassword, { origin: 'https://attacker.example' }), login(testPassword, { headers: { 'Sec-Fetch-Site': 'cross-site' } }), login(testPassword, { headers: { 'Sec-Fetch-Site': 'same-site' } })]) {
      expect((await worker.fetch(request, env)).status).toBe(403);
    }
  });
  it('allows logout only by same-origin POST and clears the host cookie', async () => {
    const env = environment(); const worker = createWorker();
    expect((await worker.fetch(new Request(`${origin}/auth/logout`), env)).status).toBe(405);
    expect((await worker.fetch(new Request(`${origin}/auth/logout`, { method: 'POST' }), env)).status).toBe(403);
    const response = await worker.fetch(new Request(`${origin}/auth/logout`, { method: 'POST', headers: { Origin: origin } }), env);
    expect(response.status).toBe(303); expect(response.headers.get('Location')).toBe('/auth/login'); expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0'); expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; Secure; SameSite=Strict');
  });
  it('rejects unsupported body types, encoded bodies and duplicate password fields', async () => {
    const env = environment(); const worker = createWorker();
    expect((await worker.fetch(login(testPassword, { headers: { 'Content-Type': 'application/json' } }), env)).status).toBe(415);
    expect((await worker.fetch(login(testPassword, { headers: { 'Content-Encoding': 'gzip' } }), env)).status).toBe(415);
    const duplicate = new Request(`${origin}/auth/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `password=${testPassword}&password=other` });
    expect((await worker.fetch(duplicate, env)).status).toBe(401);
  });
  it('caps streamed bytes even without or with a dishonest Content-Length', async () => {
    const env = environment(); const worker = createWorker();
    const variants: Record<string, string>[] = [{}, { 'Content-Length': '10' }, { 'Content-Length': '3000' }];
    for (const headers of variants) {
      const request = new Request(`${origin}/auth/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded', ...headers }, body: `password=${'я'.repeat(1100)}` });
      expect((await worker.fetch(request, env)).status).toBe(413);
    }
  });
  it('applies a bounded per-isolate attempt window and expires it', async () => {
    let clock = start; const env = environment(); const worker = createWorker(() => clock);
    for (let i = 0; i < 10; i++) expect((await worker.fetch(login('wrong'), env)).status).toBe(401);
    const limited = await worker.fetch(login(), env); expect(limited.status).toBe(429); expect(limited.headers.get('Retry-After')).toBe('300');
    clock += 300_001; expect((await worker.fetch(login(), env)).status).toBe(303);
    expect((await worker.fetch(login('wrong', { headers: { 'CF-Connecting-IP': '192.0.2.5' } }), env)).status).toBe(401);
  });
  it('requires HTTPS and rejects mutation methods on assets', async () => {
    const env = environment(); const worker = createWorker();
    expect((await worker.fetch(new Request('http://workspace.example/'), env)).status).toBe(400);
    const response = await worker.fetch(new Request(`${origin}/asset`, { method: 'POST' }), env); expect(response.status).toBe(405); expect(response.headers.get('Allow')).toBe('GET, HEAD'); expect(env.ASSETS.fetch).not.toHaveBeenCalled();
    expect((await worker.fetch(new Request(`${origin}/auth/login`, { method: 'DELETE' }), env)).status).toBe(405);
  });
  it('handles asset failures without leaking exceptions or permitting shared caches', async () => {
    const env = environment(); const worker = createWorker(() => start); const cookie = sessionValue(await worker.fetch(login(), env));
    env.ASSETS.fetch = async () => { throw new Error('internal diagnostic must remain hidden'); };
    const response = await worker.fetch(new Request(`${origin}/asset`, { headers: { Cookie: cookie } }), env);
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('internal diagnostic'); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
