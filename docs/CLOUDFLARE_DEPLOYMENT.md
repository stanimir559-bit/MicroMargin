# Cloudflare deployment and GitHub updates

Updated 2026-10-27. Live password-protected app: https://micromargin.stanimir559.workers.dev/ . Source: https://github.com/stanimir559-bit/MicroMargin . The user explicitly approved public source; website access remains restricted separately.

## Current architecture

A Cloudflare Worker runs before every static asset (`assets.run_worker_first: true`). It serves a password-only BG/EN login page and releases the built React application only after a signed session is verified. This supersedes the earlier static-only Pages proposal: a static JavaScript password check would expose the app and credential to visitors.

Cloudflare encrypted secret bindings: ACCESS_PASSWORD and independently generated SESSION_SECRET. No values belong in GitHub, VITE variables, Wrangler vars, local committed files or logs. The session is a signed, eight-hour, host-only Secure/HttpOnly/SameSite=Strict cookie, bound to origin. Rotating either secret invalidates existing sessions. Missing secrets fail closed. Protected responses override public caching with private/no-store; preview URLs and observability are disabled.

No database was needed or created. App data remains in localStorage on each browser/origin. The password does not create accounts, tenant isolation, cloud backup or cross-device synchronization. localhost data does not automatically appear at the hosted address.

Login/sign-out page: `/auth/login`. The sign-out form there clears the current browser cookie. A copied token stays valid until expiry or secret rotation; per-isolate throttling is best-effort, not a distributed brute-force guarantee.

## GitHub and Cloudflare Builds

Repository: `stanimir559-bit/MicroMargin`, branch `main`, root `/`.

- Build: `npm ci --include=dev --ignore-scripts && npm run check`
- Deploy: `npm run deploy` (pinned Wrangler4.153.0)
- Node:24.18.0 via `.node-version` and build NODE_VERSION.
- npm:11.11.0 via exact packageManager field.
- Build variables: SKIP_DEPENDENCY_INSTALL=true, WRANGLER_SEND_METRICS=false.
- Main branch only; no preview-branch deployment configured. No password/session key is copied into build variables.

The existing account-managed `personalprojects build token` is referenced by the Cloudflare build trigger. Its value was never retrieved or copied. The connector could not list account-token permission groups without broader reauthentication, so no new account API token or broader connector permission was created. Other Workers/token settings were not modified.

Worker identifier: micromargin. Worker tag: cc762a2c16ca461591ffe5bf112e897d. Build trigger: f013fc87-122b-4b30-bb1e-f7f18910c3ee. These identifiers are not credentials.

The GitHub plugin uploaded a clean current tree rather than local starter history. The original starter had a real-business name that later matched the selected credential; that reference was removed from the publishable tree, and the unpublished local history was not pushed or rewritten.

## Verification

- `npm run check`:93/93 unit/integration tests, typecheck, lint including Worker, production build passed.
- `npm run test:auth`:2/2 actual local Wrangler HTTPS browser tests at desktop/360px, including protected files, wrong/correct login, cookie attributes, PDF rendering and logout. Synthetic credentials only.
- `npm audit`:0 reported vulnerabilities after Wrangler addition;268 lockfile entries. See SUPPLY_CHAIN.md for development-only LGPL components.
- Live anonymous checks: `/`303 to login; index HTML, app JS, synthetic PDF and PDF worker401; no-store headers.
- Live browser: authorized login opened the app, PDF canvas/text rendered, logout followed by root navigation returned to login. See AUTH_QA.md.
- Initial manual API deployment:74d8c4b1-237c-4cfa-a318-d6fe2bbee408. GitHub build verification is recorded separately in STATE.md when completed; do not infer its success from trigger creation alone.

The initial direct deployment used the Cloudflare plugin for resource/secret operations and the documented short-lived, asset-scoped upload JWT for asset bytes. Temporary upload tokens stayed out of source/files; a terminal line-wrap issue affected parsing and was recovered with a new zero-upload manifest session. No account API credential was extracted.

## Reproduce / operate

Local app: `npm run demo`. Auth boundary tests: `npm run build && npm run test:auth`. Header-only static preflight: `npm run test:deployment` (not a substitute for the real Worker test).

For later CLI deployment, authenticate Wrangler to the intended account, keep ACCESS_PASSWORD and SESSION_SECRET in Cloudflare secrets, then run `npm run check` and `npm run deploy`. Do not pass actual secret values as CLI arguments. Provider-connected deployments can use the Cloudflare plugin. Never remove worker-first routing or publish an unprotected static copy at another URL.

## Official sources (accessed 2026-10-27)

- https://developers.cloudflare.com/workers/static-assets/binding/ — all-path worker-first routing and ASSETS binding.
- https://developers.cloudflare.com/workers/static-assets/direct-upload/ — manifest/session JWT/upload/final deployment protocol.
- https://developers.cloudflare.com/workers/configuration/secrets/ — encrypted secret bindings.
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ — build/deploy/branch settings.
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/ — Node/npm pins and skip-install variable.

Confidence high for observed local/live behavior; this is a shared-password demo, not audited multi-tenant production authentication or legal/tax certification.
