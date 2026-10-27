# Decision log — 2026-10-27

| Decision | Reason / reversible default |
|---|---|
| Existing starter-kit directory is app root | Preserve supplied files/ZIP without moving or deleting unknown material. No existing Git repository found. |
| Use actual collaboration tools, three workers maximum | Current session offers four total slots including lead. Role instructions from .codex/agents are assigned explicitly. Supplied TOML does not override running permissions. Official behavior: https://learn.chatgpt.com/docs/agent-configuration/subagents (accessed 2026-10-27). |
| Local React/TypeScript/Vite, exact pins, scripts disabled | Minimal operational client; no paid/cloud dependency. TypeScript7 peer conflict detected rather than forced; pin supported6.0.3. |
| Private decimal.js constructor; strings at boundaries | Avoid monetary floating-point drift. 40-digit significant precision is ample for bounded microbusiness quantities, not arbitrary infinite precision. No implicit density or legal rounding claims. |
| EUR and configurable tax assumptions | Official euro adoption verified in RESEARCH_AUDIT. No hard-coded legal VAT profile. BGN conversion deferred rather than silently repricing. |
| Explicit extra-input loss convention | Divide ingredient requirements by retained fraction; declared output is saleable. Packaging is per sold portion. UI warns against double-counting. |
| Adapt shadcn Button only | Retain MIT provenance, Slot/CVA composition and project CSS; avoid generated whole app and unnecessary Tailwind installation. Official registry source: https://ui.shadcn.com/r/styles/new-york/button.json (accessed2026-10-27). |
| Adopt PDF.js6.4.299 | Official patched package and local worker, lazy import, no scripting manager or annotation actions. Current and historical advisories recorded. Legacy eval option removed upstream; do not cast unsupported config. |
| Strict synthetic PDF gate, reviewed manual pack-price proposal | No permission to process real customer invoices. Text extraction is not semantic accounting extraction. Import cannot automatically choose unit/currency/VAT/price. |
| invoice2data sidecar/OCR not required | Benchmark recorded separately; fixtures cannot establish real supplier-layout accuracy. Cloud readers, backend cascade and AI remain disabled. |
| Immutable snapshots + browser localStorage | Works without infrastructure. Invalid old JSON is backed up before replacement; quota/conflicting recovery blocks overwrite. No silent retention deletion. Shared-profile privacy limit made visible. |
| No public deployment, remote push or production connection | User explicitly restricts them. Sites workflow used only for local preview guidance; no registration or publishing. |

## Open questions

Nonblocking for synthetic demo: real supplier pack/discount layouts, recoverable VAT entitlement and rates by operator/product, density needs, historical BGN rounding context, retention/export preferences, willingness to maintain recipes and pay, time saved versus a linked spreadsheet. Require owner/accountant decisions or authorized research before production financial claims.
