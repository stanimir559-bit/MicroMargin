/** Shared-password boundary for the local-data demo; no business data or password is stored here. */
export interface Env {
  ACCESS_PASSWORD?: string;
  SESSION_SECRET?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}
export const SESSION_COOKIE = '__Host-micromargin_session';
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_LOGIN_BYTES = 2048;
const THROTTLE_WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_THROTTLE_KEYS = 1000;
const encoder = new TextEncoder();

function protect(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  headers.set('Pragma', 'no-cache');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (!headers.has('Content-Security-Policy')) headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  headers.set('Vary', [...new Set([...(headers.get('Vary') ?? '').split(',').map(v => v.trim()).filter(Boolean), 'Cookie'])].join(', '));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function text(message: string, status: number, extra: HeadersInit = {}): Response {
  return protect(new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...extra } }));
}
function redirect(path: '/' | '/auth/login', cookie?: string): Response {
  return protect(new Response(null, { status: 303, headers: { Location: path, ...(cookie ? { 'Set-Cookie': cookie } : {}) } }));
}
function methodNotAllowed(allow: string): Response { return text('Method not allowed.', 405, { Allow: allow }); }

function loginPage(lang: 'bg' | 'en', error = false, status = 200): Response {
  const bg = lang === 'bg';
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>MicroMargin · ${bg ? 'Вход' : 'Sign in'}</title><style>
  *{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f7f8f5;color:#163d30;font-family:system-ui,sans-serif;padding:24px}main{width:100%;max-width:410px;background:white;border:1px solid #e4e8e1;border-radius:20px;padding:32px}h1{font-size:30px;letter-spacing:-1.4px;margin:0 0 12px}.brand{font-size:13px;font-weight:750;letter-spacing:.3px;margin-bottom:30px}.brand span{background:#d8ef83;padding:7px 10px;border-radius:8px;margin-right:8px}p{color:#66766b;font-size:14px;line-height:1.6}label{display:block;font-size:13px;font-weight:650;margin:24px 0 8px}input,button{width:100%;min-height:48px;border:1px solid #cbd6c6;border-radius:9px;padding:12px;font:inherit}button{background:#163d30;color:white;border-color:#163d30;font-weight:650;margin-top:14px;cursor:pointer}button:hover{background:#254f3e}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #7d9b53;outline-offset:4px}a{color:#163d30;text-underline-offset:3px}.links{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:23px;font-size:12px}.error{background:#fcf0ec;color:#9c4133;padding:12px;border-radius:8px}.logout{margin-top:24px;border-top:1px solid #e4e8e1;padding-top:8px}.logout button{background:white;color:#163d30;border-color:#dce2d7;font-size:12px}small{font-size:11px;color:#66766b;line-height:1.6;display:block;margin-top:22px}
  </style></head><body><main><div class="brand"><span>m</span>MicroMargin</div><h1>${bg ? 'Вход в работното пространство' : 'Open your workspace'}</h1><p>${bg ? 'Въведете паролата за достъп. Сесията е валидна до 8 часа.' : 'Enter the access password. Your session lasts up to 8 hours.'}</p>${error ? `<p class="error" role="alert">${bg ? 'Достъпът е отказан. Проверете паролата.' : 'Access denied. Check the password.'}</p>` : ''}<form method="post" action="/auth/login?lang=${lang}"><label for="password">${bg ? 'Парола' : 'Password'}</label><input id="password" name="password" type="password" autocomplete="current-password" maxlength="512" required autofocus><button type="submit">${bg ? 'Продължи' : 'Continue'}</button></form><div class="links"><span>${bg ? 'Защитено работно пространство' : 'Protected workspace'}</span><a href="/auth/login?lang=${bg ? 'en' : 'bg'}" lang="${bg ? 'en' : 'bg'}">${bg ? 'English' : 'Български'}</a></div><small>${bg ? 'Данните на приложението остават в този браузър. Паролата не създава акаунт или синхронизация.' : 'App data stays in this browser. This password does not create an account or sync data.'}</small><form class="logout" action="/auth/logout" method="post"><button type="submit">${bg ? 'Изход от текущата сесия' : 'End current session'}</button></form></main></body></html>`;
  return protect(new Response(html, { status, headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  } }));
}

function encode64(bytes: Uint8Array): string {
  let raw = ''; for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function decode64(raw: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error('Invalid encoding.');
  const decoded = atob(raw.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - raw.length % 4) % 4));
  return Uint8Array.from(decoded, char => char.charCodeAt(0));
}
async function keyFor(password: string, purpose: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`MicroMargin:${purpose}:v1\0${password}`));
  return crypto.subtle.importKey('raw', digest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function passwordMatches(candidate: string, expected: string): Promise<boolean> {
  // Native HMAC verification avoids a prefix/length-dependent JavaScript comparison.
  const challenge = encoder.encode('MicroMargin password verification v1');
  const signature = await crypto.subtle.sign('HMAC', await keyFor(candidate, 'password'), challenge);
  return crypto.subtle.verify('HMAC', await keyFor(expected, 'password'), signature, challenge);
}
async function sessionCookie(password: string, sessionSecret: string, origin: string, now: number): Promise<string> {
  const issued = Math.floor(now / 1000); const expires = issued + SESSION_SECONDS;
  const payload = encode64(encoder.encode(JSON.stringify({ v: 1, origin, issued, expires })));
  const signature = await crypto.subtle.sign('HMAC', await keyFor(JSON.stringify([sessionSecret, password]), 'session'), encoder.encode(payload));
  return `${SESSION_COOKIE}=${payload}.${encode64(new Uint8Array(signature))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}
async function authenticated(request: Request, password: string, sessionSecret: string, now: number): Promise<boolean> {
  try {
    const raw = request.headers.get('Cookie') ?? ''; if (raw.length > 8192) return false;
    const matches = raw.split(';').map(part => part.trim()).filter(part => part.startsWith(`${SESSION_COOKIE}=`));
    if (matches.length !== 1) return false;
    const token = matches[0].slice(SESSION_COOKIE.length + 1); if (token.length > 2048) return false;
    const parts = token.split('.'); if (parts.length !== 2 || parts[1].length !== 43) return false;
    const signature = decode64(parts[1]); if (signature.byteLength !== 32) return false;
    const verified = await crypto.subtle.verify('HMAC', await keyFor(JSON.stringify([sessionSecret, password]), 'session'), signature, encoder.encode(parts[0]));
    if (!verified) return false;
    const data: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decode64(parts[0])));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    const value = data as Record<string, unknown>; const seconds = Math.floor(now / 1000);
    return value.v === 1 && value.origin === new URL(request.url).origin &&
      typeof value.issued === 'number' && Number.isSafeInteger(value.issued) && value.issued <= seconds + 60 &&
      typeof value.expires === 'number' && Number.isSafeInteger(value.expires) && value.expires === value.issued + SESSION_SECONDS && value.expires > seconds;
  } catch { return false; }
}
function sameOrigin(request: Request): boolean {
  const site = request.headers.get('Sec-Fetch-Site');
  return request.headers.get('Origin') === new URL(request.url).origin && site !== 'cross-site' && site !== 'same-site';
}
class BodyError extends Error { constructor(readonly status: number) { super('Invalid login request.'); } }
async function readLoginBody(request: Request): Promise<URLSearchParams> {
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_LOGIN_BYTES)) throw new BodyError(413);
  if (request.headers.get('Content-Encoding') && request.headers.get('Content-Encoding') !== 'identity') throw new BodyError(415);
  if (!/^application\/x-www-form-urlencoded(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type') ?? '')) throw new BodyError(415);
  if (!request.body) throw new BodyError(400);
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      total += value.byteLength; if (total > MAX_LOGIN_BYTES) { await reader.cancel(); throw new BodyError(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return new URLSearchParams(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new BodyError(400); }
}

/** Throttling is bounded best-effort per isolate, NOT a globally distributed security limit. */
export function createWorker(now: () => number = Date.now) {
  const attempts = new Map<string, { count: number; expires: number }>();
  async function throttle(request: Request): Promise<number | null> {
    const current = now();
    for (const [key, value] of attempts) if (value.expires <= current) attempts.delete(key);
    const address = (request.headers.get('CF-Connecting-IP') ?? 'unknown').slice(0, 256);
    const id = encode64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(address))));
    let entry = attempts.get(id);
    if (!entry) {
      if (attempts.size >= MAX_THROTTLE_KEYS) attempts.delete(attempts.keys().next().value!);
      entry = { count: 0, expires: current + THROTTLE_WINDOW_MS }; attempts.set(id, entry);
    }
    entry.count += 1;
    return entry.count > MAX_ATTEMPTS ? Math.max(1, Math.ceil((entry.expires - current) / 1000)) : null;
  }
  const handler = {
    async fetch(request: Request, env: Env): Promise<Response> {
      const password = env.ACCESS_PASSWORD;
      const secret = env.SESSION_SECRET;
      if (typeof password !== 'string' || !password.trim() || encoder.encode(password).byteLength > 512 || typeof secret !== 'string' || secret.trim().length < 32 || secret.length > 1024) return text('Access is not configured. Please contact the workspace owner.', 503);
      const url = new URL(request.url);
      if (url.protocol !== 'https:') return text('HTTPS is required.', 400);
      if (url.pathname === '/auth/login') {
        const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'bg';
        if (request.method === 'GET') return loginPage(lang);
        if (request.method === 'HEAD') { const page = loginPage(lang); return new Response(null, { status: page.status, headers: page.headers }); }
        if (request.method !== 'POST') return methodNotAllowed('GET, HEAD, POST');
        if (!sameOrigin(request)) return text('Forbidden request origin.', 403);
        const retryAfter = await throttle(request); if (retryAfter !== null) return text('Too many attempts. Try again later.', 429, { 'Retry-After': String(retryAfter) });
        let form: URLSearchParams;
        try { form = await readLoginBody(request); } catch (error) { return text('Invalid login request.', error instanceof BodyError ? error.status : 400); }
        const values = form.getAll('password'); const candidate = values[0] ?? '';
        if (values.length !== 1 || !candidate || encoder.encode(candidate).byteLength > 512) return loginPage(lang, true, 401);
        if (!await passwordMatches(candidate, password)) return loginPage(lang, true, 401);
        return redirect('/', await sessionCookie(password, secret, url.origin, now()));
      }
      if (url.pathname === '/auth/logout') {
        if (request.method !== 'POST') return methodNotAllowed('POST');
        if (!sameOrigin(request)) return text('Forbidden request origin.', 403);
        return redirect('/auth/login', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
      }
      if (!['GET', 'HEAD'].includes(request.method)) return methodNotAllowed('GET, HEAD');
      if (!await authenticated(request, password, secret, now())) {
        const html = url.pathname === '/' || (request.headers.get('Accept') ?? '').includes('text/html');
        return html ? redirect('/auth/login') : text('Authentication required.', 401);
      }
      return protect(await env.ASSETS.fetch(request));
    },
  };
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      let response: Response;
      try { response = await handler.fetch(request, env); }
      catch { response = text('Workspace temporarily unavailable.', 503); }
      return request.method === 'HEAD' ? new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers }) : response;
    },
  };
}

export default createWorker();
