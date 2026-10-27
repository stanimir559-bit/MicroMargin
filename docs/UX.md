# MicroMargin UX contract — 2026-10-27

## Intent and assumptions

An owner should be able to inspect a demo, change a supplier pack price and understand its menu impact from a phone. Bulgarian is the initial UI language; English is a persistent, accessible language choice. Every fixture is visibly synthetic. Currency is EUR; VAT rates and recoverability are explicit demonstration settings, never claimed as business advice. Local storage status and a lack of cloud sync should be visible.

Use a warm off-white canvas, forest navigation, lime emphasis, quiet borders and system fonts. No external font or image request is needed. Use restrained food glyphs only as supplementary decoration, never as the sole label. Main actions are dark forest buttons; lime is reserved for emphasis and the active sidebar item.

## Primary flow

1. **Welcome/demo:** explain the job in one sentence; enter a populated synthetic bakery without signup. Keep a small demo banner after entry. No fake usage counters or testimonials.
2. **Dashboard:** show products below target, recent cost changes and the menu cost list. Each signal opens its source recipe or ingredient. Show contribution margin with revenue excluding configured sale VAT as denominator. Do not average unrelated margins into a profit claim.
3. **Ingredients:** supplier, pack quantity/unit, entered price and effective cost. An edit form validates decimal comma/point and units; save shows dependent recipes and creates dated history. Historical prices remain inspectable.
4. **Recipes:** select or create a recipe, add ingredient quantities, declare finished batch output/portion size, waste, packaging and other variable expenses. The visible price panel shows per-portion variable cost, effective revenue, contribution, contribution margin and target selling price. Expand a formula to see every source and normalization.
5. **Invoices:** only a local synthetic text PDF initially. Show preview and extracted text as untrusted content. Extraction creates no catalogue mutation. Select the matching ingredient, enter/verify pack and price, inspect affected recipes, then explicitly confirm the update. Corrupt/encrypted/scanned/oversized documents have useful error states. Never imply OCR or AI is enabled if absent.
6. **Settings:** language, target margin, input cost basis, input VAT recoverability, sale price basis, sale VAT rate and effective date. Explain what each choice changes. Local export/reset actions must describe the data affected before the user activates them.

## CSS class API

- Shell: `app-shell`, `sidebar`, `brand`, `brand-mark`, `brand-subtitle`, `nav-label`, `nav-item active`, `sidebar-footer`, `workspace-card`, `workspace`, `topbar`, `breadcrumb`, `topbar-actions`, `avatar`, `page-content`, `mobile-nav`.
- Heading/content: `page-heading`, `eyebrow`, `page-title`, `muted`, `actions`, `stack`, `spacer`, `footer-note`, `demo-banner`, `hero`, `hero-illustration`.
- Buttons/status: `button primary|secondary|ghost|lime|small`, `icon-button`, `badge success|warning|danger|neutral|outline`, `dot`, `positive`, `negative`, `warning-text`, `alert warning|error|success`.
- Dashboard: `metrics-grid` (optional `four`), `metric-card` (optional `accent`), `metric-label`, `metric-value`, `metric-note`, `dashboard-grid`, `card`, `card-header`, `card-body`, `card-footer`, `section-label`, `progress`, `bar` (optional `warning`).
- Rows/catalogue: `recipe-list`, `recipe-row` (optional `selected`), `recipe-row-content`, `row-value`, `food-icon` (optional `green|pink`), `price-change`, `ingredient-grid`, `ingredient-card`, `ingredient-price`, `toolbar`, `search-field`.
- Editor: `split-layout`, `price-card`, `big-price`, `breakdown-row` (optional `total`), `formula`, `form-grid`, `field` (optional `full`), `field-hint`, `field-error`, `checkbox-field`, `form-actions`, `inline-fields`.
- Data/empty/document: `table-wrap`, `numeric` on numeric cells, `empty-state`, `upload-zone`, `pdf-preview`, `extracted-text`, `mono`, `money`, `nowrap`.
- Accessibility: `skip-link` targeting main content; `sr-only` for supplementary text. Semantic input/label/select/textarea/details/summary/table styles are supplied.

Use only one of `main` or `.page-content` as the padded content container to avoid nested padding. Default card title hierarchy: page `h1`, card `h2`, row `h3`. `.card-header` accepts title/subtitle group plus one action. `.recipe-row` uses a decorative `.food-icon`, `.recipe-row-content` title/subtitle and `.row-value` amount/status. No CSS-generated text supplies critical labels.

## Responsive and accessibility acceptance

- Desktop uses a 232px sidebar; 761–1000px reduces it to 204px. Content grids stack when narrow. At <=760px the sidebar retains the brand and navigation uses a fixed bottom bar with safe-area spacing. Only one navigation version should be exposed to assistive technology at a time; CSS display handles this at each breakpoint.
- At 360px the body has no horizontal overflow, forms become one column, price/history tables use their own labeled horizontal scroll container and all controls remain usable. Card rows wrap labels and values. Test long Bulgarian ingredient/recipe names and validation messages.
- All interactive controls have at least 44px targets. Use explicit labels, `inputMode="decimal"` for monetary strings, a visible focus ring and `aria-current="page"` on navigation. Unit fields are selects with visible labels. Avoid decimal `type="number"` when comma input must work.
- Mark decorative icons `aria-hidden="true"`. Provide accessible names for icon-only buttons. Use `role="status"` for saved/changed messages and `role="alert"` for validation failures; move focus to the relevant invalid field or error summary after submit.
- Price reductions/increases and target status always include text or signed values as well as color. Explain denominator and VAT assumptions near the result. Unknown or zero denominator states show an explanation, not a fabricated percentage.
- Formula details are native keyboard-operable `details`/`summary`. Avoid blocking dialogs for routine editing; if a dialog is used, test focus trapping/restoration and Escape.

## Validation status

CSS breakpoint rules and selector structure were inspected during authoring. Runtime 360px/desktop screenshots, keyboard traversal, screen-reader semantics and overflow checks require the integrated application; coordinator owns those checks. No user research or real operator usability session has been performed. Proposed 60-second update flow is a design target, not measured evidence.
