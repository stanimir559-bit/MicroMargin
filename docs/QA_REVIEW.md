# Independent QA review — 2026-10-27

Scope: read-only review of application, costing domain, dependencies and security boundaries. Reviewer authored the original domain module, so arithmetic review is an additional adversarial pass rather than an independent author review. Coordinator owns fixes. Storage/document source integration and all reported corrections are reviewed.

## Executed evidence

- `npx vitest run tests/domain.test.ts`: **49/49 passed**.
- `npm run check`: **passed**, recorded in `artifacts/check.log`: typecheck, lint, **76/76 tests across four files**, and production build. The earlier missing-module integration errors are resolved. This reviewer also directly reran the 76 tests/typecheck/lint successfully before inspecting the saved aggregate evidence.
- `npm audit --json`: **0 reported vulnerabilities**, 182 dependency entries, recorded in `artifacts/npm-audit.json`. This does not prove packages free of vulnerabilities.
- Development browser run: **10/10 passed in 33.4 seconds**, recorded in `artifacts/e2e.log`.
- Production-bundle browser run: **10/10 passed in 22.6 seconds**, recorded in the completed `artifacts/e2e-production.log`, against the built app served on local port 4173 after the development server was stopped.
- Both Edge browser runs exercise five scenarios at desktop **1440×1000** and mobile **360×800**: price-change review and reload persistence; new ingredient/batch recipe and VAT profile; keyboard/skip-link/local-only requests and horizontal-overflow checks; actual PDF.js worker/canvas sample preview with stale-review invalidation and corrupt-PDF rejection; and empty catalogue/corrupt storage recovery including recovery-backup download. The reviewer inspected the actual completed command logs and current test source, without launching a concurrent duplicate browser run.
- Build output is recorded in `artifacts/check.log`: core JavaScript 321.05 kB (102.69 kB gzip), lazy invoice chunk 440.86 kB (133.62 kB gzip), and PDF worker 1,264.34 kB. Invoice code is split from the core flow; these sizes are build measurements, not a real-phone performance benchmark.

## Findings delivered to coordinator

| Priority | Location at initial review | Reproduction / implication | Requested correction | Status |
|---|---|---|---|---|
| P1 | `src/App.tsx:97,104,107` | Enter `1,250` into recipe sale price, quantity or yield: comma replacement produces `1.250`; domain accepts it as 1.25. Ingredient entry rejects the same ambiguous input. | Preserve raw user input; use the strict locale parser consistently for live calculation and save. | Fixed; unit and E2E regressions present; browser artifact passes |
| P2 | `src/App.tsx:56` | Valid ingredient history beginning at `0`, followed by positive price, divides by string `'0'` because it is truthy and shows Infinity%. | Zero-baseline percentage must be unavailable, with an explanatory label. | Fixed in source with “New price” label |
| P2 | `src/App.tsx:57,119` | Change VAT profile; dashboard footnote/settings banner still declare the original 0% / nonrecoverable assumptions. | Render current profile assumptions and identify the initial defaults separately. | Fixed in source |
| P2 | `src/App.tsx:104` | Switch an existing `150 g` flour line to butter purchased by kg; quantity remains 150 but unit becomes kg. | Preserve a compatible selected recipe unit; reset explicitly for incompatible dimensions. | Fixed in source |
| P2 | `src/storage/repository.ts` ingredientShape | Distinct historical/current prices `9007199254740992` and `9007199254740993` compare equal through Number conversion. | Use Decimal equality. | Fixed; regression included in passing suite |
| P2 | `src/App.tsx` applyPrice | Errors thrown inside the React state updater escape the surrounding scheduling try/catch, e.g. snapshot count limit rejection. | Calculate inside an ordinary try/catch before scheduling state; report failure to invoice confirmation. | Fixed in source; invoice receives boolean success |
| P2 | `src/App.tsx` newRecipe | A structurally valid empty ingredients/recipes state dereferences ingredients[0] on opening Recipes. | Show an empty catalogue path before initializing recipe lines. | Fixed in source with an add-ingredient route |
| P2 | `src/App.tsx` canonicalRecipe | Enter unambiguous `1,0010`, save canonical `1.001`, reload: canonical value is reparsed as ambiguous raw entry, disabling calculation/save. | Format canonical values unambiguously for raw-entry drafts, or parse only edited fields. | Fixed in src/input.ts; roundtrip regression added |

## Positive controls observed

- All monetary domain input values use validated decimal strings; incompatible units fail.
- Price updates and snapshots return detached copies; 49 tests cover decimal arithmetic, VAT combinations, yield, waste, target margins and historical immutability.
- Package versions are exact; package installation scripts are disabled via `.npmrc`.
- CSP denies object embedding, arbitrary external script/connect endpoints and form submissions. Inline styles remain allowed for React/UI; this is a local application, without a server or tenant authorization boundary.
- UI labels associate with inputs, a skip link exists, and navigation uses real buttons. Keyboard/mobile runtime checks passed in both development and production browser runs. Screen-reader testing and independent WCAG certification were not performed.
- Persistence validates untrusted JSON structure before domain calculations, checks references/duplicates, preserves corrupt originals in a verified recovery key, refuses conflicting backup replacement, bounds total UTF-8 bytes and validates historical calculation snapshots against their captured domain inputs.
- PDF pipeline requires extension/MIME/header, limits file bytes, pages, extracted text, preview pixels and elapsed time, disables XFA and external font loading, cancels work on replacement/unmount and escapes extracted text through React. The installed PDF.js 6.4.299 removed the legacy `isEvalSupported` option/eval path; the app does not instantiate the scripting viewer and retains CSP. Document/price/catalogue/recipe/profile changes invalidate a reviewed proposal token. A separate confirm action is mandatory, and failure cannot display a successful import.

## Residual limitations

PDF resource budgets are defensive browser controls, not a hard memory sandbox. Compressed PDF contents can consume resources before text-length checks; a blocked main thread can delay a timeout. Only synthetic files are supported in this demo. A production upload service needs isolated processing, server validation and storage/tenant authorization. There is no server, account system or claim of multi-tenant isolation in this local app.

## Review disposition

All eight reported source findings have been corrected. The aggregate quality gate, dependency audit and development/production browser runs pass in the saved evidence. No unresolved actionable blocker was found in the reviewed local synthetic scope. This review is not production accreditation or a multi-tenant security claim.

The first browser run exposed selector issues (`EN` text overridden by an aria-label, and an implicit select label containing option text). Tests now target the controls' accessible role/name; both subsequent saved browser runs pass. The only warnings in the passing browser logs concern the execution environment's conflicting NO_COLOR/FORCE_COLOR settings.
