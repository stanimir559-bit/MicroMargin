# MicroMargin checkpoint — 2026-10-27 (Europe/Sofia)

## Current deployment update

Live protected URL: https://micromargin.stanimir559.workers.dev/ . Cloudflare Worker/password gate deployed and live login/PDF/logout verified. ACCESS_PASSWORD and random SESSION_SECRET are encrypted provider secrets, never source/build variables. No database or sync was created.93 tests + lint/typecheck/build and2 real local auth browser scenarios passed; audit0 with268 dependency entries. Source public status was explicitly approved by the user after creating https://github.com/stanimir559-bit/MicroMargin . GitHub source upload and first automatic build are in progress; do not report that pipeline verified until its actual remote build succeeds.

Cloudflare build trigger f013fc87-122b-4b30-bb1e-f7f18910c3ee connects repo1435546563/main to Worker tagcc762a2c16ca461591ffe5bf112e897d. Build uses npm ci --include=dev --ignore-scripts && npm run check; deploy npm run deploy. Node24.18.0 and npm11.11.0 pinned. The existing account-managed build token is referenced without reading its value; no broader token-management permission was granted. The source tree is uploaded as a clean snapshot, not unpublished local starter history. See CLOUDFLARE_DEPLOYMENT.md and AUTH_QA.md. Older checkpoints below are historical.
## Earlier update: GitHub / Cloudflare preparation

User requested GitHub-backed Cloudflare access. Added `.node-version` (24.18.0), Cloudflare static response headers/robots, exact build instructions and a desktop/mobile hosted-header preflight. `npm run check` passed (76 tests plus typecheck/lint/build); `npm run test:deployment` passed2/2, including PDF worker/canvas. See CLOUDFLARE_DEPLOYMENT.md.

Connected GitHub profile is `stanimir559-bit`; CLI is installed but unauthenticated, and no Git remote exists. Cloudflare plugin search returned no matches; browser/dashboard is the fallback after account/access approval. Proposed private repository `stanimir559-bit/micromargin` and public synthetic demo require confirmation under the original launch gates. No account login, remote create/push, Cloudflare project or deployment occurred. Current local demo on5173 was started at the user's request after the earlier teardown checkpoint. Hosted/local browser data do not synchronize.

Status: working, tested local synthetic MVP. App root: `C:\Users\OpenClaw\Documents\Codex\MicroMargin\MicroMargin_Codex_Autonomous_Starter_Kit`. Parent directory retains the original ZIP; no unknown files were deleted or moved.

## Delivered

Bulgarian-first/English UI, optional onboarding, fictional8ingredient/4recipe bakery, actionable dashboard, searchable catalogue, supplier packs and individual VAT rates, price history, reviewed linked-recipe impact, recipe creation/editing, portion or mass/volume yield, explicit extra-input loss, packaging/other costs, contribution/margin/markup/food-cost percentages, target price rounded up, formula disclosure and explicit configurable VAT profile.

Validated local persistence retains immutable before/after historical inputs/results and recipe versions. Corrupt originals are preserved before replacement; quota/conflicting recovery prevents overwrite and displays warnings. Settings downloads current JSON and exact unreadable recovery text. Empty catalogue is recoverable.

Lazy PDF.js6.4.299 synthetic-only local text/canvas preview has file/page/text/preview/time budgets, cancellation, no viewer scripting or external processing. Price proposals are manually mapped, reviewed and explicitly confirmed; stale approvals are invalidated. A corrupt file cannot mutate prices.

Four competitors and all research seeds reviewed with dated source/confidence records. Reviewed shadcn Button source and official PDF.js distribution adopted. Actual invoice2data experiment:20synthetic text fixtures,160/160positive fields, but missing-currency input falsely defaultedEUR; sidecar rejected. OCR deferred. Research does not claim interviews, real supplier coverage or production accuracy.

## Verified commands and evidence

Environment: Node24.18.0, npm11.11.0, Windows, existing Microsoft Edge; Python3.12 only for optional isolated benchmark. No browser installation was performed.

| Command / check | Actual result |
|---|---|
| `npm install --ignore-scripts` | Exact pinned dependencies installed; lifecycle scripts disabled. Initial TypeScript7/linter peer conflict fixed by supported6.0.3, without force flags. |
| `npm run check` | PASS: typecheck, ESLint,76/76Vitest tests across4files, production build. Latest output in artifacts/check.log. |
| `npm run test:e2e` with dev server | PASS10/10 (33.4s): desktop1440px/mobile360px, price propagation+reload, new ingredient/recipe, locale ambiguity/loss validation, VAT persistence, keyboard/overflow, local-only requests, real PDF worker/canvas, invalidated review, malformed rejection, empty catalogue, corruption preservation and recovery download. artifacts/e2e.log. |
| Same browser suite against production build | PASS10/10. artifacts/e2e-production.log. Actual built assets served via `npm run preview -- --port 4173 --strictPort`; HTTP200/title/built-assets checked. |
| `npm audit --json` |0reported vulnerabilities; artifacts/npm-audit.json. Not proof of no unknown vulnerability. |
| Dependency inventory |182lockfile entries with integrity; listed licenses reviewed; installed-platform lifecycle hooks inspected. artifacts/dependency-review.json, docs/SUPPLY_CHAIN.md. |
| Secret-pattern scan | No API-key/private-key/AWS-access-key pattern matches in authored/tracked scope; generated runtimes/builds excluded. Heuristic, not a guarantee. |
| invoice2data benchmark | Actually executed; exact results/audits/reproduction in docs/INVOICE_BENCHMARK.md and fixtures/synthetic/benchmark-results.json. Test-only wheels/runtime ignored. |
| Visual inspection | Desktop/mobile dashboard screenshots and PDF fixture render inspected; no clipping observed. Screenshots in ignored artifacts/screenshots/. Browser keyboard checks are not screen-reader certification. |

The initial browser selector failures (accessible names versus raw label contents) were corrected and rerun. No unresolved required local test failed. Playwright prints a harmless NO_COLOR/FORCE_COLOR warning. The source review found and corrected8issues; reviewer originally authored domain code, and that independence limit is recorded in QA_REVIEW.md.

Build sizes at last gate: core JS approximately321kB/103kB gzip, CSS27kB/6.4kB gzip; invoice chunk441kB/134kB gzip and local PDF worker1.26MB lazy-loaded. These are bundle sizes, not measured phone performance.

## Run/resume

From app root: `npm run demo` (one-command install/start), or `npm run dev` after setup. From outer workspace: `npm --prefix .\MicroMargin_Codex_Autonomous_Starter_Kit run demo`. No .env/API key/cloud account required. Production: `npm run build` then `npm run preview`.

Preview/test servers are stopped during session teardown; restart with the commands above. No ongoing automation/scheduler is configured and no work continues after this session. Local Git initialized; starter constraints and tested implementation committed using explicit `Codex <codex@local.invalid>` identity because no user Git identity was configured. No remote, push, deployment, payment or production account was created.

## Limits and next safe work

Synthetic data only. No backend/auth/tenant security, real-invoice processing, OCR, physical-phone performance study, screen-reader certification, real-user interviews, historical BGN conversion or actual tax-policy determination. Actual VAT/recovery entitlement and legal rounding remain owner/accountant decisions. Browser storage is shared by a browser profile and has last-writer semantics; snapshots are exportable but lack a dedicated history screen.

No blocker prevents running the local demo. Consent-gated production services and actual documents were deliberately not attempted. Next safe task: historical snapshot timeline and/or concurrent-tab conflict handling, followed by targeted tests. See NEXT_ACTIONS.md, PLAN.md and RESUME_CODEX.md.
