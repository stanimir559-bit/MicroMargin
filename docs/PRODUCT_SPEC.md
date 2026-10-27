# MicroMargin — first product specification

## Who it serves
A café, bakery, pastry shop, wrap/sandwich counter, dessert shop or small takeaway operator. Typical initial test business: 5–40 menu items, ingredients purchased in variable supplier packs, recipes kept in notebooks or spreadsheets. Use **synthetic** sample businesses; any real business context is inspiration only, not permission to use proprietary assets or claim endorsement.

## Primary job-to-be-done
1. Save ingredients and supplier pack prices (e.g., 1 kg skyr, 500 g flour, 24 eggs, 5 L milk).
2. Create a recipe/batch from ingredients with normalized units and a declared number or mass of saleable portions.
3. Add packaging, delivery or payment-related per-unit variable expenses; set waste/yield if applicable.
4. Set a displayed sale price and pricing tax profile.
5. Instantly show true cost per portion, contribution amount, contribution margin %, markup %, and target-margin price. Every number has an expandable formula and a link to its source ingredient price.
6. Change one purchase price; see affected menu items and before/after differences.
7. Optional later: photograph/upload supplier invoice, review extracted line items, and explicitly accept proposed price updates.

## Pricing/accounting model
- Primary working currency EUR, with localizable decimal comma and configurable import of historical BGN. If historical BGN must be converted, use fixed official EUR/BGN conversion rate **1 EUR = 1.95583 BGN** and correct legal rounding for the context; don't reprice invoices silently. Source: European Commission https://economy-finance.ec.europa.eu/euro/eu-countries-and-euro/bulgaria-and-euro_en .
- Do not assume every operator is VAT-registered or entitled to deduct input VAT. Explicit **pricing profile**: input costs entered as gross or net, whether input VAT is recoverable, sale price entered gross/net, configured sale VAT rate when applicable, and effective date. Default to a visible non-assertive demonstration assumption, not a recommendation. Ask owner to confirm with accountant for actual business accounting.
- Unit normalization: g/kg, ml/L, each/pack, yield/conversion and supplier quantity/pack; never convert between volume and mass without an explicit density value. Detect incompatible units; never silently treat 1 unit = 1 kg.
- Use a decimal-number library for currency, fixed rounding rules, and tests for decimal edge cases. Display cents but preserve precision internally. Avoid floating-point drift. Money input must respect Bulgarian/English locale without misreading 1,25 as 125.
- Formula (per finished portion): ingredient cost sum + packaging + other variable expense + optionally allocated waste; *effective revenue per portion* excludes sale VAT where applicable. Contribution = effective revenue - total variable cost. Contribution margin % = contribution / effective revenue * 100, when revenue > 0. Markup % = contribution / variable cost * 100, when variable cost > 0; label as contribution-on-cost (not accounting gross markup) if including packaging and other variable expenses. For a "food-cost percentage" display ingredient subtotal separately divided by revenue. A target-contribution-margin price should solve revenue = variable_cost/(1-target_margin), with validation for target >= 100% and conversions to display sale price gross/net.
- "Net profit" is not available from ingredient costs alone. Explicitly avoid promising business profit or tax compliance.
- Prices and recipes are versioned/date-stamped; updating an ingredient should not silently rewrite historical reports.

## MVP screens
1. Public product explanation/demo, no forced sign-up to try synthetic example.
2. Dashboard: 3–5 meaningful actionable signals (products below target, largest recent cost increases, item cost list), no vanity KPIs.
3. Ingredients: supplier/pack, unit and price, editable current cost and history.
4. Recipes/menu: recipe builder, yield/portion, cost breakdown, pricing, exact formula inspectability.
5. Supplier price change: select ingredient, update price, compare affected recipes.
6. Invoice preview/import: optional safe alpha behind feature flag and confirmation gates, not required for usable core MVP.
7. Settings: business locale, currency, tax profile, margin target, privacy/data controls.

## Deliberate exclusions in first release
POS integration, stock counts, inventory management, shelf-life management, payroll, accounting, live VAT advice, ordering supplies, auto-adjusting menu prices, full kitchen ERP, automatic payments, automated external email, real customer data without consent, enterprise roles. Avoid features added only to make the dashboard look busy.

## Research and testing
- Compare with at least 3 existing products, including meez. Verify pricing and features at the time of research and retain source date.
- Interview plan: 8–12 operators with different invoice sources; only report responses that actually occurred.
- Benchmark actual invoice extraction **only with permission and anonymization**. Use 20+ documents across PDFs/photographs/scan qualities if available; until then label scores as synthetic-only.
- Aim for repeatable unit costing with automated cases and a single 3-minute end-to-end synthetic walkthrough before advanced AI functionality.

## Critical acceptance tests
- 1.2 kg at €4/kg is €4.80, not €0.0048 or €480.
- 150 g drawn from 1 kg at €2.40 contributes €0.36.
- Gross and net revenue/cost treatment changes when VAT profile changes; never mix them.
- Recipe 8 portions and one 400 ml batch have explicitly defined yields; never divide by zero.
- Price changes propagate to dependent recipes and do not mutate historical snapshots.
- Errors surfaced for unknown unit, missing yields, zero denominators, negative numbers and ambiguous locale punctuation.
- File upload is limited and cannot update catalogue without user confirmation.
