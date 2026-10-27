# Codex autonomy and decision gates

## Continue without asking
Local product research via available tools, writing architecture and code, local integration tests, demo data, read-only auditing, synthetic invoice fixtures, package evaluation (without executing untrusted code), bug fixes, local refactorings, accessibility improvements, locally creating git branches/commits when the sandbox allows, and additional safe backlog items.

## Ask me in one grouped message (provide recommended default)
- Credentials, login, paid API or provider, creating a hosted project, public deployment, real-world billing, production database, actual customer invoices, sharing business data with AI providers, making a repository public or pushing commits to a remote.
- User-facing financial/legal policies where a wrong assumption affects actual business decisions (especially VAT handling).
- Repository destructive actions, secret rotation, external communications or changes to devices/accounts outside the project.
- Any sandbox escalation to broader filesystem or network permissions. Never evade a denied escalation.

## Retry protocol
When an external permission or service is blocked, log it and switch to another local ticket. When one task is done, pick the next highest-value unblocked task, run tests, and update `docs/STATE.md`. Do not loop forever on a broken install or failing test; after 2 targeted fixes, reduce scope/diagnose root cause, then move to another safe task and document blocker. Do not claim you can run indefinitely outside an active Codex session or beyond actual usage limits.

## Never use
`--yolo` or equivalent unrestricted flags; blanket `approval_policy = "never"` combined with unrestricted sandbox; unauthorized cloud logins; unattended production deploy; real document processing by a third-party AI without consent; source code with unresolved restrictive licenses; `curl | sh`/`wget | bash` for unknown projects; hidden analytics/trackers or seeded live personal data.
