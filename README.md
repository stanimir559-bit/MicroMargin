# MicroMargin

Working Bulgarian-first, English-switchable local recipe costing demo. All bundled ingredients, suppliers, recipes and invoices are fictional. No account, API key, cloud service or payment required.

## Run locally

Requires Node.js 24+ and npm. From this directory:

    npm run demo

This installs the exact lockfile with lifecycle scripts disabled, then starts Vite. Open the printed loopback URL (normally http://127.0.0.1:5173). First setup needs registry access; the running app has no external service dependency. Restart with `npm run dev`; stop with Ctrl+C. No .env is needed; .env.example documents the empty configuration.

From the outer workspace folder:

    npm --prefix .\MicroMargin_Codex_Autonomous_Starter_Kit run demo

Production bundle: `npm run build`, then `npm run preview` (normally port4173). The live password-protected app is https://micromargin.stanimir559.workers.dev/ .

GitHub/Cloudflare preparation is available in [the deployment guide](docs/CLOUDFLARE_DEPLOYMENT.md). Node version and hosted security headers are prepared, with `npm run test:deployment` checking the built UI/PDF under those headers. Source publication was approved at https://github.com/stanimir559-bit/MicroMargin . The live Worker protects all app assets; credentials remain in Cloudflare secrets.

## Try the complete flow

1. Choose Разгледай демото / Explore demo. EN switches language. Dashboard shows products below target and supplier-price movements.
2. Ingredients → Flour → Change price. Enter 3,60, review affected recipes, then confirm. Linked portion costs update; reload preserves them. History and before/after calculation snapshots are retained.
3. Recipes: inspect a batch or create one; add ingredient quantities, saleable yield, loss, packaging and other variable expenses. Set selling price and target contribution margin. The breakdown explains cost, revenue excluding configured VAT, margin, contribution-on-cost markup and suggested price.
4. Invoices: confirm synthetic-only use, open the bundled sample, inspect text/canvas, select the ingredient and type its verified pack price. Review impact and explicitly confirm. Reading a file never updates prices.
5. Settings: configure VAT assumptions, export local JSON, or download unreadable recovery data as plain text. Reset replaces this app's local data after confirmation; export first.

Use comma or point without grouping. Ambiguous 1,250 is rejected; write 1250 for one thousand two hundred fifty, or 1,2500 for a precise decimal. Saved three-place values reopen with an extra trailing zero to stay unambiguous.

## Verification

    npm run check
    npm run test:e2e
    npm run test:auth
    npm audit

`check` runs TypeScript, ESLint, Vitest and production build. Browser tests use existing Microsoft Edge, with 1440px desktop and 360px mobile viewports; no browser download needed here. They start a loopback server if none is running. Screenshots: ignored artifacts/screenshots/. Failures retain Playwright traces. Node tests do not require Edge. Actual results: [docs/STATE.md](docs/STATE.md).

## Financial and data boundaries

Initial demo profile: EUR, gross purchase/sale entry, 0% VAT rates, nonrecoverable input VAT. These are explicit demo assumptions, not a recommendation for actual tax treatment. Confirm the operator's profile with an accountant. Inputs have individual configured VAT rates. Target price rounds up to cents; display uses half-up cents while internal decimal calculations retain precision.

Contribution excludes fixed overhead, labour not entered as variable cost and business taxes; it is not net profit. Loss means extra ingredient input to achieve declared saleable output. Avoid double-counting if quantities already include loss. No implicit mass/volume conversion, automatic menu repricing or historical BGN conversion.

Data lives in this browser profile's localStorage. No authentication, sync or server-side tenant isolation. Shared profiles share data. Export backups before clearing browser storage. Corrupt records are preserved under micromargin.state.v1.recovery; conflicting backups/quota errors block overwrite and show warnings. No history is silently pruned. Limits: 4MiB state, 500 ingredients, 200 recipes, 2000 snapshots; export and plan migration before reaching them.

PDF processing supports synthetic files only, up to 5MiB/10pages, using local worker/canvas/text with cancellation and resource budgets. It is not malware certification or OCR. Real invoices, external AI, production accounts, public deployment and paid providers need separate authorization. No external document requests occurred in tested flows.

## Technical map

- src/domain: pure decimal/unit/VAT/yield/margin engine.
- src/storage: validated versioned repository and snapshots.
- src/documents: lazy PDF.js and confirmation policy.
- src/input.ts: locale-safe editing roundtrip.
- src/App.tsx and styles.css: responsive interface; reviewed shadcn Button under src/components/ui.
- fixtures/synthetic: authored fixtures and reproducible invoice2data evaluation. Python is not required by the app.

[PRD](docs/PRD.md), [research](docs/RESEARCH_AUDIT.md), [architecture](docs/ARCHITECTURE.md), [decisions](docs/DECISIONS.md), [risks](docs/RISK_REGISTER.md), [supply chain](docs/SUPPLY_CHAIN.md), [invoice benchmark](docs/INVOICE_BENCHMARK.md), [notices](THIRD_PARTY_NOTICES.md). Original launch instructions and agent roles remain. Resume with [RESUME_CODEX.md](RESUME_CODEX.md).
