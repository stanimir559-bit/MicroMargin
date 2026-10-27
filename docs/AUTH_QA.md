# Shared-password gate security review — 2026-10-27

Scope: independent read-only review of the Cloudflare Worker authentication wrapper and deployment routing. The reviewer owns this document only. The shared password must never appear here, in source, client assets, fixtures, command arguments or logs. This gate restricts access to the demonstration; it does not create individual accounts, tenant authorization or server-side business-data storage.

Status: completed for the shared-password demonstration scope. Worker/config review, the coordinator's real local Wrangler HTTPS tests and live authenticated browser checks passed. This reviewer independently rechecked the deployed anonymous HTTP boundary. The live deployment is [MicroMargin](https://micromargin.stanimir559.workers.dev), version `74d8c4b1-237c-4cfa-a318-d6fe2bbee408`.

## Primary-source evidence

All sources accessed 2026-10-27. These are verified platform statements; application correctness still requires code and runtime evidence.

| Source | Relevant verified claim / design implication | Confidence |
|---|---|---|
| [Worker/static asset routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/) | Matching assets normally bypass application Worker execution. Set `assets.run_worker_first: true` for the entire asset collection so authentication precedes every asset. | High |
| [Assets binding](https://developers.cloudflare.com/workers/static-assets/binding/) | `ASSETS.fetch` serves configured assets with HTML/not-found handling; selective worker-first arrays can leave other paths asset-first. Review boolean true and the actual deployed configuration. | High |
| [Workers Cache](https://developers.cloudflare.com/workers/cache/) | Cacheable Worker responses can be served without executing Worker code on later requests. Override protected responses and login/logout/error responses with `Cache-Control: private, no-store`; do not preserve public static-asset caching headers at the external boundary. | High |
| [Encrypted secrets](https://developers.cloudflare.com/workers/configuration/secrets/) | Secrets are encrypted bindings readable by the Worker environment. Supply the shared password/session key through secret bindings rather than Wrangler vars or front-end environment variables. | High |
| [Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) | HMAC signing/verification and cryptographic random APIs are supported. Use authenticated session tokens with explicit expiry rather than storing/transmitting the password in a cookie. | High |
| [Timing-safe comparisons](https://developers.cloudflare.com/workers/examples/protect-against-timing-attacks/) | Native timing-safe comparison requires equal-length buffers and surrounding logic still matters. Prefer fixed-length secret-derived comparisons or cryptographic verify rather than early-exit plaintext equality. | High |
| [Rate-limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) | Binding limits are approximate and separate by Cloudflare location; a global strict limit needs stronger coordination. Document guessing limits and shared-IP false positives. | High |

## Intended boundary

- Only the Worker may call `ASSETS.fetch`, after successful session verification. No asset, HTML fallback, PDF fixture or worker script path may be exempted accidentally.
- Absent/invalid production secrets must fail closed. The login screen and generic unavailable errors contain no secret or business data.
- Session cookies need an authenticated token, bounded lifetime, origin/audience binding where supported, Secure/HttpOnly/SameSite protection and host-only scope. Tampering, expiry, invalid required payload fields/signatures and malformed cookies must fail closed.
- Login/logout are bounded POST operations; reject cross-origin requests before checking credentials. Do not reflect arbitrary return URLs or permit an external redirect.
- Enforce a byte limit while streaming the login body, independent of Content-Length. Reject unsupported content types and excessive credential lengths before expensive work.
- No response containing gated application bytes may be shared-cacheable. Logout clears the browser cookie; signed stateless sessions have their own replay/revocation limitations until expiry or key rotation.
- No password in client bundles, localStorage, query strings, source-controlled env files or logs. A live secret may be sent only through the authorized encrypted provider-secret workflow.

## Adversarial verification matrix

| Area | Required meaningful checks | Final evidence |
|---|---|---|
| Static bypass | Without a cookie request protected paths and HEAD; ensure no unauthorized asset access. Repeat against real routing/runtime. | Handler GET/HEAD tests pass; local real-runtime tests pass; reviewer independently verified live root, index, actual main JS, PDF and PDF.js worker denial |
| Secret failure | Missing/empty/misconfigured secrets deny login and assets; no development fallback credential in production. | Handler tests pass |
| Token integrity | Valid cookie succeeds; modified payload/signature, wrong signing secret, expired/future token, invalid encoding, duplicate-cookie ambiguity and another origin fail. | Handler tests pass |
| Cookie properties | Secure, HttpOnly, host-only Path=/, appropriate SameSite and bounded expiry; logout clears identical cookie scope. | Handler and local HTTPS browser cookie tests pass; coordinator verified live login/logout |
| Origin/CSRF | Cross-site and missing/wrong Origin login/logout POSTs denied; wrong method/content-type rejected; no external next/return redirect. | Handler tests pass |
| Resource abuse | Oversized declared body and chunked/multibyte body without trusted Content-Length rejected; limiter denial/error behavior fail closed. | Byte/throttle handler tests pass; per-isolate limitation retained |
| Cache isolation | Login/logout/error and authenticated assets force no-store; authentication precedes asset responses. | Handler overrides pass; anonymous live responses verified private/no-store and CDN no-store; coordinator confirmed deployment cache disabled. Exhaustive CDN/conditional/range combinations were not independently tested |
| Secret leakage | Review source/build for credential literals, VITE secrets and sourcemaps; never print the real secret. | No client/source secret assignments found in reviewed paths; final coordinator scan removed a credential-matching starter text reference before publication; encrypted binding names verified without values |
| Deployment | Verify actual deployed routing, secret presence without value disclosure, HTTPS gate, direct assets and an isolated authenticated browser session. | Live Cloudflare version deployed; direct anonymous checks reproduced by reviewer; coordinator verified authenticated live app/PDF/logout |

## Executed initial handler checks

A read-only Node/TypeScript in-memory harness imported the current Worker without modifying source or test files. It used an unmistakably synthetic credential and a mocked asset binding, never the deployment password.

- Unauthenticated requests to `/`, `/index.html`, `/assets/app.js`, `/synthetic-invoice.pdf`, `/assets/pdf.worker.mjs` and `/nested/recipe` returned 303/401 with **zero asset-binding calls**.
- Missing password binding returned **503**; cross-origin login returned **403**.
- Synthetic valid login returned **303** with Secure/HttpOnly session-cookie attributes.
- The authenticated asset returned **200**, and a deliberately public cacheable upstream response was overridden to **private, no-store**.
- Reusing the valid session on a different origin or supplying duplicate session-cookie names returned **401**, without another asset call.

These initial checks establish handler behavior only. The later real-runtime and deployed checks below establish the additional routing evidence; they are not inferred from mocked assets.

## Architecture findings sent to coordinator

1. **Separate session key — fixed.** The initial HMAC key was derived solely from the shared password, allowing a captured token to validate offline guesses. The revised Worker requires an independent `SESSION_SECRET` binding (at least 32 non-whitespace characters), derives a context-separated signing key from both secrets, and tests rejection after either password or session-key rotation. The deployment must generate the session secret with a cryptographic random source; length validation alone does not establish entropy.
2. **Throttle strength must stay explicit.** The initial limiter is a bounded per-isolate map (10 attempts/5 minutes). It resets with isolate lifecycle, can be distributed across isolates/locations and is not a global security boundary. A native rate-limit binding improves coordination but is still approximate/per-location; stronger global enforcement needs a deliberate architecture change. Do not describe this as strict distributed brute-force prevention.
3. **P1 gated sample-PDF fetch — fixed and verified.** `src/documents/InvoiceScreen.tsx` initially fetched `/synthetic-invoice.pdf` with `credentials: 'omit'`, dropping the new session cookie. It now uses `credentials: 'same-origin'`. The real local gated PDF workflow passed at desktop/mobile sizes; the coordinator also visually verified the live PDF preview and one-page caption. Earlier unprotected/header-overlay tests alone would not have detected this failure.
4. **Real runtime entry export — fixed.** The first real Wrangler test rejected an exported constant as a Worker runtime entrypoint. `worker/index.ts` now exports only the default Worker handler; reusable code/test exports live in `worker/auth.ts`. Subsequent real-runtime tests pass. This is why handler-only unit tests were insufficient as the deployment gate.

## Revised-handler test evidence

This reviewer independently executed the first **16/16 auth tests**, typecheck and scoped Worker/test lint successfully. The final coordinator quality gate, inspected in the updated `artifacts/check.log`, passed **93/93 tests, including 17 auth tests**, typecheck, lint (now including `worker`) and production build. The added auth case verifies that asset-binding exceptions return a generic no-store 503 without diagnostic leakage. The suite also exercises missing/invalid secrets, bilingual login/no reflection, protected GET/HEAD assets, wrong password, secure host cookie, fixed safe redirect, cache overrides, tampering/duplicate cookies, expiry/future/origin restrictions, secret rotation, CSRF, logout, body type/encoding/duplicate fields, streaming byte caps with dishonest Content-Length, throttle expiry, HTTPS and method restrictions.

`artifacts/npm-audit.json` was inspected after the Wrangler addition: **0 reported vulnerabilities**, 268 dependency entries. Advisory lookup is not a guarantee of package safety.

The signed token grants eight hours with up to 60 seconds of issue-time skew tolerance. Its HMAC verification uses Web Crypto; payload data is checked only after signature verification. It contains no password/session key, and cookies are Secure/HttpOnly/SameSite=Strict with `__Host-` naming, Path=/ and no Domain attribute. App/login responses have distinct CSP form rules; protected responses add anti-framing, MIME and no-store headers. No unresolved actionable authentication blocker was found for this reviewed shared-password demonstration scope.

## Configuration/source inspection

The reviewed `wrangler.jsonc` points `main` at `worker/index.ts`, binds `ASSETS` to `./dist`, and sets boolean `run_worker_first: true` for all assets. Preview URLs are disabled; observability is disabled; there is no public route exception or database binding. Secrets are absent from Wrangler vars. `.gitignore` covers `.env`, `.dev.vars`, `.dev.vars.*`, `.wrangler/` and `.cloudflare/`. Reviewed client/Worker/public/config paths contain no secret assignments or VITE credential usage, and the inspected build contains no sourcemaps. Synthetic test credentials are clearly labelled and separate from provider secrets. These checks did not disclose or search by the real password value.

## Real runtime and live verification

- **Coordinator-executed local test:** `npm run test:auth` passed **2/2 in 10.9 seconds**, confirmed in `artifacts/auth-browser.log`, against real local Wrangler HTTPS in Edge at 1440×1000 and 360×800. The inspected `tests/auth-browser/gate.spec.ts` checks anonymous actual main-JS/index/PDF 401 responses, wrong-password denial, synthetic correct login, Secure/HttpOnly/SameSite cookie attributes, application startup, PDF.js sample rendering/fetch, and logout followed by direct-asset denial. It uses a synthetic test credential and an independently random test session key; it does not use the live password. Local HTTPS tests explicitly allow the local runtime certificate; certificate-handshake diagnostics appear in the log while both test scenarios pass. This test-only setting is not a change to live HTTPS verification.
- **Live deployment:** the coordinator deployed Cloudflare version `74d8c4b1-237c-4cfa-a318-d6fe2bbee408` at the URL above. Provider metadata was checked by the coordinator for binding names/types only: encrypted `ACCESS_PASSWORD` and `SESSION_SECRET` plus `ASSETS`. Cache options and preview URLs were disabled. No secret value was put into this review.
- **Reviewer-executed independent live HTTP checks:** anonymous root returned **303** to `/auth/login`; `/index.html`, the current `/assets/index-3eF9iATR.js`, `/synthetic-invoice.pdf` and `/assets/pdf.worker.min-CjEcRF4W.mjs` returned **401**. All five responses had `Cache-Control: private, no-store` and `Cloudflare-CDN-Cache-Control: no-store`. No password, session cookie or authenticated browser context was used in these checks.
- **Coordinator-executed live browser checks:** the authorized password opened the Bulgarian application; the synthetic PDF visibly rendered with a one-page caption; logout completed and the root redirected back to login. This reviewer did not independently repeat the live password entry and does not claim to have done so.
- **Publication boundary:** the user explicitly approved public source in `stanimir559-bit/MicroMargin`. The coordinator prepared a clean GitHub snapshot without pushing local history, removed a starter text reference that matched the requested credential, and reported no real customer/business document data or credentials committed. Public source visibility and protected demo access are separate controls. The actual password is neither repeated nor represented here.

## Limits to state explicitly

This is a shared-password demonstration gate. Anyone given the password has the same access. There is no per-person revocation or tenant membership model, server-side business database, production tenant isolation or cloud sync. Existing business/demo data remains in the browser profile/origin. Logout removes this browser's cookie; a copied signed token remains replayable until expiry unless either secret is rotated. The per-isolate IP limiter resets/scales independently, can inconvenience users sharing a network and cannot guarantee protection against distributed guessing. This review does not certify hostile PDF safety, exhaustive edge-cache combinations or every future deployment variant. Changes to routing, secrets, session/caching logic or upload/storage scope require renewed checks.
