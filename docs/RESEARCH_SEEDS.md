# Dated research seeds (checked 27 Oct 2026; reverify before adopting)

These are **candidate projects, not blanket security endorsements**. Their GitHub prominence, permissive licenses and evidence of maintenance make them reasonable to evaluate, not automatically safe to install. Always examine exact release, lockfile, transitive dependencies, known advisories, source commits, external scripts and build hooks. If any candidate is riskier than a small local implementation, decline it and document why.

| Repo | Intended use | License observed | Current observations and precautions |
|---|---|---|---|
| https://github.com/invoice-x/invoice2data | PDF invoice text extraction and vendor templates, **optional Python sidecar** | MIT | Active in Oct 2026; GitHub security tab had no published advisories but also no SECURITY.md. Strong starting point to benchmark; do not trust parser with untrusted files outside isolation. |
| https://github.com/mozilla/pdf.js | Trusted project for PDF preview/text layer, use official `pdfjs-dist` release | Apache-2.0 | Active v6 releases in 2026; inspect advisories and choose pinned current patched version. File contents remain untrusted. |
| https://github.com/naptha/tesseract.js | Optional client-side OCR for photos/scans | Apache-2.0 | Widely used OCR; validate Bulgarian language data, worker/data download behavior, memory performance and phone usability before adoption. |
| https://github.com/shadcn-ui/ui | Accessible front-end components integrated as audited source | MIT | Highly active in Oct 2026; adopt individual components and review generated code/transitive dependencies. Not a finished SaaS starter to blindly fork. |

Avoid `ocrmypdf/OCRmyPDF` as a blind default for user-uploaded files. The project's own documentation cautions that it is not a PDF malware protection mechanism; its GitHub security page disclosed a moderate 2026 advisory in a watcher component. It could be evaluated later in a sandboxed processing service with pinned patched version, but not as a necessary MVP dependency.

**Official platform sources:**
- Codex subagents: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Codex config: https://learn.chatgpt.com/docs/config-file/config-reference
- Codex sandbox and approvals: https://learn.chatgpt.com/docs/sandboxing
- Safe approval baseline: `workspace-write` + `on-request`; never full access without explicit informed approval.
- Bulgaria euro and fixed rate: https://economy-finance.ec.europa.eu/euro/eu-countries-and-euro/bulgaria-and-euro_en
- Source discovery for competition should include official company websites (e.g., meez), independent owner communities, and primary government publications where claims concern regulation.

**Supply-chain checklist to complete before integration:** current license + SPDX (including transitive deps), maintained release date, security policy/advisories and patched versions, branch/tag provenance, lockfile integrity, install scripts, network behavior, data processing location, vulnerability scan and minimal permissions. Pin exact versions. Document accept/reject decision in `docs/DECISIONS.md`.

**Competitive differentiation hypothesis (not proven):** 60-second mobile cost update from Bulgarian supplier packs and highly legible margin explanation may beat generic recipe costing apps for single-location microbusinesses. Prove with real operators; never claim this is validated beforehand.
