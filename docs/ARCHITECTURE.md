# Architecture

## Local execution

React 19 + TypeScript 6 + Vite 8. The linter currently excludes TypeScript 7 from its supported peer range, so the latest compatible 6.0.3 is pinned. App assets and PDF.js worker are served on loopback. No API key, backend, telemetry, CDN font, external AI or paid service is used. `npm run demo` installs the lockfile with lifecycle scripts disabled and starts localhost.

`src/domain/index.ts` is pure. Decimal strings enter a private decimal.js constructor (40 significant digits, half-up cent display); native Number never performs money calculations. Unit dimensions are explicit; there is no mass/volume conversion without a future declared density contract. No tax rate is inferred. `src/input.ts` handles strict comma/dot entry and unambiguous rendering of stored three-place decimals.

`src/data/demo.ts` provides only fictional Bulgarian/English data. `src/storage/repository.ts` validates versioned data and historical calculations at storage boundaries, returns new state, and snapshots results before/after mutations. Local storage access failures become visible in-memory mode. Corrupt raw data must be preserved under the recovery key before replacement; conflicting/unwritable backups block overwrite. See DATA_CONTRACT.md for limits and future schema.

`src/App.tsx` composes dashboard, catalogue, recipe and settings flows. All arithmetic comes from domain functions. `src/components/ui/button.tsx` is reviewed shadcn source adapted to project CSS with Slot/CVA composition. Native inputs/selects reduce dependency and accessibility surface. No UI framework starter app was executed.

`src/documents/InvoiceScreen.tsx` is lazy-loaded: PDF.js and its worker are excluded from initial core UI loading. It reads bounded synthetic files in browser memory and renders canvas/text only. No viewer scripting manager, annotation actions, iframe, document HTML, cloud processing or persistent invoice blob. PDF.js 6.4 removed the old isEvalSupported option; installed source/type inspection, patched version and no scripting layer replace that legacy configuration. Limits and stale-review binding live in documents/policy.ts.

## Formula contracts

Effective purchase cost: net entered price + nonrecoverable input VAT, or gross entered price − recoverable input VAT. Recipe-line cost = quantity normalized to supplier unit × pack price ÷ pack quantity. Ingredient loss is an additional input multiplier `1 / (1 − loss/100)` to achieve declared saleable output; it excludes packaging. Avoid double-counting if entered quantities already include loss.

Portion cost = loss-adjusted ingredient batch / saleable portions + effective packaging + other variable expense. Revenue excludes configured sale VAT. Contribution = revenue − variable cost; margin = contribution/revenue; contribution-on-cost markup = contribution/variable cost. Zero denominators yield unavailable percentages. Target revenue = cost/(1−target margin); convert to configured sale basis and round UP to cents. Internal amounts remain unrounded until display/recommendation.

## Future server boundary (not implemented)

PostgreSQL/Supabase is a migration target, not a dependency. Add authenticated server endpoints with tenant membership authorization on every read/write, tenant-scoped keys/foreign keys and RLS as defense in depth. Never trust a browser-supplied tenant ID. Use transactional price-change + version/snapshot writes and concurrency tokens. Revalidate the same domain contract server-side; never expose service keys to the client.

Any future document server needs allowlisted formats, byte/page/decompression/time limits, isolated workers without network, per-tenant object storage, signed access, short retention and audit logging without raw invoice data. Local browser controls are not a production upload boundary or malware certification. Production delivery requires a fresh security review.

## Verification

Vitest tests domain/persistence/proposal contracts. Playwright exercises actual Edge browser desktop/mobile flows, local network requests, corrupted documents and keyboard navigation. Production build confirms lazy chunks. npm audit and a checked dependency metadata report cover known advisories/licenses; neither proves absence of malicious packages or future vulnerabilities.
