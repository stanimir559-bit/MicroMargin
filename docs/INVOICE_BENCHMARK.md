# Invoice pipeline verification — 2026-10-27

## Shipped local workflow

`src/documents/InvoiceScreen.tsx` imports pinned `pdfjs-dist` 6.4.299 and a same-origin Vite worker URL. The owner first checks a synthetic-data declaration, then chooses a PDF or opens the bundled fictional invoice. No actual customer document is authorized by this demo.

Allowlist checks: `.pdf` extension, exact `application/pdf` MIME, `%PDF-` magic, 8 bytes–5 MiB, 1–10 pages and at most 100,000 extracted characters. Processing has a 15-second budget and cancellation. Only page 1 is rasterized, capped at approximately 2 million pixels, 1200px wide and 1800px high. Worker/task and canvas resources are cancelled/destroyed on replacement, error or unmount. Oversized, incompatible or corrupt files produce visible errors and cannot enable import. A budget reduces accidental resource exhaustion; it does not certify a hostile PDF as safe.

There is no native PDF iframe, annotation layer, XFA, viewer scripting manager, automatic supplier mapping, external AI, OCR, or external document request. The source PDF and extracted text live in component memory. Text is rendered as React text, never HTML. The only sample-file request is `/synthetic-invoice.pdf` on the app's origin.

The user selects a catalogue ingredient, types a verified pack price, reviews the source supplier/pack/VAT basis and before/after recipe costs, then explicitly confirms. The review token binds the document, ingredient, price, catalogue, recipes and profile. Changes invalidate approval. The parent callback must return true before success is shown; failed domain/persistence validation cannot show successful import. Catalogue updates use the existing price history/snapshot repository.

**PDF.js API correction:** the older `isEvalSupported: false` mitigation is not a supported `DocumentInitParameters` field in installed 6.4.299. Searches of the installed types, API build and worker found no `isEvalSupported` references; it was removed rather than hidden behind a type cast. This version includes the upstream removal of the old eval path. No scripting viewer is instantiated. Keep patched versions and the app CSP; do not reintroduce old viewer defaults. Research references the 2024 and 2026 PDF.js advisories in `RESEARCH_AUDIT.md`.

## Actual synthetic invoice2data experiment

The package was initially absent (`python -m pip show invoice2data`). Research reviewed official repository/PyPI license and dependencies first. Downloaded **wheels only** for invoice2data 1.0.1 and its minimal dependencies into `fixtures/synthetic/.benchmark-wheels`; no source build/install script was executed. Each wheel's SHA256 matched its version-specific PyPI metadata. Metadata/licenses were inspected and no `.pth` hooks existed. OSV's batch query returned no listed advisories for the seven exact versions on the access date. This is a dated advisory lookup, not a guarantee of safety. Machine-readable evidence: `fixtures/synthetic/benchmark-dependency-audit.json`.

Minimal benchmark dependencies: invoice2data 1.0.1 (MIT), click 8.5.0 (BSD-3-Clause), python-dateutil 3.0.0 (Apache/BSD dual-license metadata; included license inspected), PyYAML 6.0.3 (MIT), regex 2026.9.29 (Apache-2.0 AND CNRI-Python), six 1.17.0 (MIT), tzdata 2026.5 (Apache-2.0 metadata). These are test-only, isolated in `.benchmark-runtime`, and are **not app dependencies or a running sidecar**. Wheels/runtimes should stay ignored in Git; retain audit/results and authored scripts/fixtures.

Installation used `pip install --no-index --no-deps --no-compile --only-binary=:all: --target fixtures/synthetic/.benchmark-runtime <reviewed wheel paths>`. It did not change the global Python environment. No cloud/AI/PDF/OCR extras were installed. The runner blocks Python network sockets and subprocess creation; it directly invokes trusted in-memory `InvoiceTemplate` objects with the explicit text reader, bypassing the library's backend/last-resort APIs.

### Dataset and ground truth

Twenty generated UTF-8 text fixtures: ten with Bulgarian headings/product/supplier names and ten English; comma/dot decimals; varied positive prices, supplier pack sizes and kg/L/each units; explicitly fictional VAT rates; extra column headers and reordered labelled fields. Eight labelled expected fields per document are stored independently in `ground-truth.json`: pack price, line total, pack quantity/unit, currency, VAT rate, input basis and invoice number.

This is **one narrow, intentionally labelled layout family**. Text fields still use English structural labels; it does not validate arbitrary Bulgarian invoice labels, table reconstruction, supplier matching, PDF fonts, scans, photographs, real discounts, multi-page invoices or real accounting policies. The twenty fixtures are not twenty independent real suppliers. Four unsupported-input checks remove currency, introduce a negative credit line, use an unknown pack unit, or change a key label. A prompt-injection string is also checked as inert text.

### Executed result

| Measure | invoice2data trusted templates | Small regex text baseline |
|---|---:|---:|
| Positive documents with all eight expected fields | 20 / 20 | 20 / 20 |
| Positive fields exact | 160 / 160 | 160 / 160 |
| Unsupported inputs that still produced a proposal | 1 / 4 | 0 / 4 |
| Last recorded warm extraction time for all 20 (ms) | 3.322 | 0.476 |

Last recorded invoice2data import: 90.459 ms. Timing is one local run, not a stable performance guarantee or phone benchmark. Full observed rows/timing are in `fixtures/synthetic/benchmark-results.json`.

**Material finding:** removing `Currency: EUR` still yielded a complete invoice2data result with EUR because `InvoiceTemplate.extract` supplies `options.currency` when no currency field is captured. Required-field checks then accept that default. This is expected generic-library behavior, but incompatible with silently trusting source currency. The baseline required an actual currency capture. All three other unsupported cases returned no proposal, and the embedded instruction text did not alter the captured price or trigger external execution.

**Decision:** do not adopt the Python sidecar for this MVP. It showed no extraction advantage on this narrow corpus and needs additional provenance/required-source-field validation; Python maintenance and process isolation add costs. The app uses PDF.js preview/text and explicit reviewed entry. This decision can be revisited with authorized anonymized supplier-layout evidence, not by treating synthetic 20/20 as production accuracy. Neither benchmark parser is automatically wired to catalogue updates.

## Reproduce

From the project root (Python 3.12 on this host):

```powershell
python -m pip download --only-binary=:all: --no-cache-dir --dest fixtures/synthetic/.benchmark-wheels invoice2data==1.0.1 click==8.5.0 python-dateutil==3.0.0 PyYAML==6.0.3 regex==2026.9.29 six==1.17.0 tzdata==2026.5
python fixtures/synthetic/audit-benchmark-wheels.py
# Inspect the manifest/advisory report before installing. Abort on unexpected changes.
$benchmarkWheels = Get-ChildItem -LiteralPath 'fixtures/synthetic/.benchmark-wheels' -Filter '*.whl' | ForEach-Object { $_.FullName }
python -m pip install --no-index --no-deps --no-compile --only-binary=:all: --target fixtures/synthetic/.benchmark-runtime @benchmarkWheels
python -X utf8 fixtures/synthetic/benchmark-invoice2data.py
npm exec vitest run tests/documents.test.ts
```

The PDF sample was generated with bundled ReportLab and rendered with bundled Poppler. `fixtures/synthetic/preview-qa.png` was visually inspected: readable, no clipping or missing visible glyphs. Poppler printed missing Symbol/ArialUnicode fallback-font warnings, which did not affect this English fixture. The generator supports `--text-only` without ReportLab. Its PDF-generation path requires ReportLab; that library is not needed to run the shipped app.

## Verification and limits

Executed: `npm run typecheck` passed; scoped ESLint passed; seven `tests/documents.test.ts` tests passed, covering allowlist/budgets, malformed header, actual sample magic, bounded canvas geometry, non-mutating impact math, invalid input and stale review tokens. The coordinator owns browser integration tests for actual worker/canvas rendering, synthetic confirmation, malformed rejection, zero external document requests and mobile navigation; do not infer those results from unit tests. The public PDF and deliberately malformed fixture are synthetic.

OCR is deferred: no real/anonymized invoice corpus, scanned-image extraction, Bulgarian language-model benchmark or phone CPU/memory measurement was performed. Server upload isolation/tenant authorization are outside this browser-only architecture. A production upload service would require its own size/type/resource checks and authorization before any processing.
