# Optional: fewer interruptions without full access

Codex currently supports `approvals_reviewer = "auto_review"` (when available), which automatically evaluates *eligible* requests while preserving the `workspace-write` sandbox and `on-request` approval policy. In the ChatGPT desktop/IDE UI this may appear as **Approve for me**. This is **more autonomous but not risk-free**: a model decides on eligible approvals, and the actual available controls can vary by client.

If your local Codex supports it and you explicitly choose this tradeoff, you can change one line in `.codex/config.toml`:

```
approvals_reviewer = "auto_review"
```

**Do not** change `sandbox_mode = "workspace-write"` to unrestricted access; do not change `approval_policy` to `never` as a workaround; retain the product's explicit approval gates in `AGENTS.md` and `docs/DECISION_GATES.md`. Auto-review may not handle every escalation, external action, user question or credential need.

If a session needs to install packages or access the internet, prefer one reviewed scope-limited permission request for official package registries over granting unrestricted filesystem/network access. Treat all third-party `postinstall` and setup scripts as supply-chain risks.

Official references: https://learn.chatgpt.com/docs/sandboxing and https://learn.chatgpt.com/docs/permission-modes .
