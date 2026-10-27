# Risk register

Reviewed2026-10-27; local synthetic prototype, not production accreditation.

| Risk | Implemented mitigation / evidence | Remaining gate |
|---|---|---|
| Wrong units/pack denominator | Dimensional checks; positive pack/yield; tests for150g from1kg and1.2kg at4EUR/kg. No automatic mass↔volume. | Real supplier layouts/density/discount modelling. |
| VAT basis or recovery mixed | Explicit profile, per-input rates, named net revenue and visible effective date. Multiple VAT scenarios tested. | Actual accounting policy confirmed by owner/accountant; no compliance claim. |
| Margin confused with markup/profit | Named denominators, contribution labels, profit exclusion and formulas in UI. | Observe operator comprehension. |
| Locale punctuation corrupts amounts | Strict parser rejects mixed/grouping/ambiguous3-place entry; saved3-place values displayed unambiguously. | Broader operator input usability testing. |
| Price change rewrites historical costs | Detached before/after recipe+ingredient+profile+result snapshots; strict history validation. | Future database transactions/concurrency control. |
| Corrupt/quota/unavailable local storage | Bounded schema, validated snapshots, recover raw before overwrite, visible memory-only warning, current-state JSON and raw-recovery text downloads in Settings. | No cloud backup; browser clearing loses data. Multiple tabs use last-writer semantics. |
| Malicious PDF/DoS | Patched6.4.299; no viewer scripting; local worker; extension/MIME/header/5MB/10pages/text/canvas/15s limits; cancel/destroy; no automatic price mutation. | Browser worker cannot guarantee protection from unknown renderer bugs/decompression attacks. Synthetic documents only; isolated service before real-file support. |
| Document prompt injection/XSS | Treat extracted text as React text; no HTML, instructions, URL actions, shell, LLM or auto-mapping. | Security review for every future extraction backend. |
| Tenant leakage | No backend or identity claim; data only in current browser profile; no invoice persistence/network transfer. | Server auth, tenant FKs/RLS, storage isolation and adversarial tests before shared deployment. |
| Supply chain/license | Exact lockfile integrity, no lifecycle scripts; registry/source review; dependency license report; npm audit. | Audit is dated and does not certify packages. MPL2 tooling retained unmodified; distribution notices retained. |
| Mobile/a11y barriers | Semantic forms, skip link, keyboard focus,44px core targets,360px browser check; no external fonts. | No independent WCAG certification/screen-reader testing. |
| Incorrect adoption claims | Evidence audit separates vendor claims/anecdotes/hypotheses; synthetic fixtures clearly labelled. | Authorized operator interviews and real-layout evaluation. |

No secrets, real invoice data, billable integration, remote push or public deployment is part of this slice.
