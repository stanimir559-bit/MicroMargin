# Executable plan — 2026-10-27

1. Inspect supplied constraints and agent roles. Delegate research, costing, UX, then independent QA within the actual three-subagent limit.
2. Establish a decimal-safe domain contract and synthetic fixtures; review and pin minimal dependencies, with installation scripts disabled.
3. Build a local React/TypeScript app: Bulgarian-first demo, actionable dashboard, ingredient catalogue with price history, editable batch recipes and pricing settings.
4. Integrate local versioned persistence and PDF.js text preview with a mandatory reviewed price proposal. No cloud, production accounts, real invoices or paid services.
5. Run domain/integration tests, typecheck, lint, dependency audit, production build and browser/mobile/keyboard checks. Fix discovered failures.
6. Complete research/architecture/risk documents and resumable STATE/NEXT_ACTIONS. Continue the next safe backlog item within the active session.

Acceptance: price edits propagate to linked recipes; yields, waste, VAT assumptions and target-price formulas remain explainable; reload persists state; invalid inputs/files cannot silently change prices; synthetic end-to-end flow works on a phone viewport.

Coordinator owns package/config files and UI integration. Agents receive disjoint paths. Existing starter files remain in place; this directory is the app root. No existing Git repository was found.

## Completed checkpoint

All six steps completed for the local synthetic slice. Reused the three available worker slots for research, costing, UX, security review, persistence and document pipeline; coordinator integrated and fixed findings. Added a further safe backlog item: exact corrupted-data recovery download. Actual gates:76unit/integration tests,10desktop/mobile browser scenarios against development and production, typecheck/lint/build, dated dependency/license/advisory review and executable synthetic invoice2data benchmark. STATE.md contains evidence/limitations; NEXT_ACTIONS.md records the next session's local backlog. Public release, real invoices and legal/financial business-policy decisions remain outside authorization.
