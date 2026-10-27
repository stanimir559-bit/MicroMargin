# MicroMargin local MVP

2026-10-27. Owner: independent Bulgarian café/bakery operator managing 5–40 menu items. Promise: see how a supplier price affects each saleable portion with explainable arithmetic. Product-market fit, speed and willingness to pay remain hypotheses; no interviews occurred.

## Delivered slice and acceptance

- Open without signup; Bulgarian-first, English toggle; persistent fictional bakery with 8 ingredients and 4 recipes, clearly marked synthetic.
- Enter supplier pack quantity/unit/price/VAT. Search catalogue, inspect price history, preview affected recipes before committing a price. Saved changes survive reload.
- Build/edit ingredient lines; normalize g/kg and ml/L; declare portion count or finished mass/volume and portion size. Reject missing/zero yield and incompatible dimensions. Add ingredient loss and per-portion packaging/other expenses.
- Display ingredient subtotal, variable cost, revenue excluding configured VAT, contribution, margin (denominator revenue), contribution-on-cost markup (denominator variable cost), and target price rounded upward to cents. Never present contribution as net profit.
- User configures purchase/sale gross/net entry, input VAT recovery, expense/ingredient rates and profile effective date. Demo 0% rates are an assumption, never tax advice.
- Changing pack price updates every dependent recipe. Before/after snapshots preserve the recipe, effective profile, ingredient prices and result. Selling prices do not change automatically.
- Synthetic PDF consent, local canvas/text preview, user-selected ingredient/pack-price proposal, impact review and explicit confirmation. Corrupted/unsupported files cannot update catalogue. No OCR or external AI.
- Keyboard navigation and 360px viewport checks; persisted schema validation, visible errors, backup export and corruption recovery.

## Three-minute synthetic walkthrough

1. Explore demo; switch to English if useful. See products below their individual margin targets.
2. Ingredients → Flour → Change price → 3,60 → Review impact → Confirm. Observe linked costs and reload.
3. Recipes → Chocolate brownie. Inspect the ingredient/loss/packaging breakdown; set target and sale price; save.
4. Invoices → synthetic-document checkbox → Open sample invoice. Select Flour, enter the pack price manually, review and confirm. Source text never selects accounting values itself.
5. Settings → inspect VAT assumptions and download local backup.

## Boundaries and validation

EUR only in this slice. Historical BGN conversion is deliberately unimplemented until context-specific rounding is reviewed. No POS, stock, payroll, fixed overhead allocation, payment, automatic menu repricing, authentication, cloud sync or production tenant backend. Data on a shared browser profile is shared. Real invoices, deployment and paid services require separate authorization.

Operator validation backlog: 8–12 authorized sessions comparing one pack update against the owner's existing spreadsheet, measuring task time, corrections, explanation comprehension and return use. No measured adoption or ROI exists.
