import { parseDecimalInput, type Recipe } from './domain';
/** Preserve unambiguous user-entry spelling when canonical values have 3 decimals. */
export function editableDecimal(value: string): string { return /^\d{1,3}\.\d{3}$/.test(value) ? `${value}0` : value; }
export function editableRecipe(recipe: Recipe): Recipe {
  const next = structuredClone(recipe);
  for (const key of ['wastePercent', 'packagingCost', 'packagingVatRate', 'otherVariableCost', 'otherVatRate', 'salePrice', 'targetMarginPercent'] as const) next[key] = editableDecimal(next[key]);
  next.lines = next.lines.map(line => ({ ...line, quantity: editableDecimal(line.quantity) }));
  next.yield = next.yield.kind === 'portions' ? { ...next.yield, portions: editableDecimal(next.yield.portions) } : { ...next.yield, quantity: editableDecimal(next.yield.quantity), portionQuantity: editableDecimal(next.yield.portionQuantity) };
  return next;
}
export function canonicalRecipe(recipe: Recipe): Recipe {
  const next = structuredClone(recipe);
  for (const key of ['wastePercent', 'packagingCost', 'packagingVatRate', 'otherVariableCost', 'otherVatRate', 'salePrice', 'targetMarginPercent'] as const) next[key] = parseDecimalInput(next[key]);
  next.lines = next.lines.map(line => ({ ...line, quantity: parseDecimalInput(line.quantity) }));
  next.yield = next.yield.kind === 'portions' ? { ...next.yield, portions: parseDecimalInput(next.yield.portions) } : { ...next.yield, quantity: parseDecimalInput(next.yield.quantity), portionQuantity: parseDecimalInput(next.yield.portionQuantity) };
  return next;
}
