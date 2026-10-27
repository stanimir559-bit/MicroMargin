# Next actions

The first local vertical slice is implemented and tested. No work runs after this session ends.

## Resume safely

1. Read STATE.md and inspect Git status. App root is the starter-kit subdirectory, not its parent containing the ZIP.
2. Run `npm run check` and `npm run test:e2e` from that app root. Existing Microsoft Edge is used; Playwright starts localhost4173 if required.
3. Run `npm run dev` to inspect the BG/EN demo; no key, account or .env required.

## Next useful local backlog

- Add a readable historical snapshot timeline (currently snapshots are retained, validated and downloadable; count shown in Settings). Keep original captured tax/recipe/ingredient assumptions alongside every comparison.
- Add optimistic revision/concurrent-tab conflict handling before encouraging use in multiple tabs. Current repository is deliberately single-browser-profile/last-writer.
- Profile worst-case catalogue/history size on a physical midrange phone; optimize repeated snapshot validation only from measured evidence. Current browser tests use emulated360px viewport in desktop Edge.
- Improve Bulgarian-only PDF fixtures with embedded Cyrillic fonts, variable supplier tables, discounts/credit notes and malformed/cancellation cases. Existing20text fixtures cover one labelled layout family, not general invoice extraction.
- Add screen-reader and measured contrast audit; current semantic/keyboard checks are not a WCAG certification.

## Requires new information or authorization

- Actual VAT/recovery/rate policies and historical BGN rounding contexts: owner/accountant confirmation.
- Real invoice benchmarks or operator interviews/communications: explicit authorization and anonymization plan.
- Production auth/tenant database, external AI/providers, paid services, public deployment or shared remote push: explicit approval, credentials and separate security gates.

Do not install invoice2data as an application sidecar based on its synthetic positive score: the missing-currency case defaulted to EUR and matched the simpler baseline on all positive cases. See INVOICE_BENCHMARK.md.
