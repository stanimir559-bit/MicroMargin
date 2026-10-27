import Decimal from 'decimal.js';

// Clone prevents another library changing the precision of the costing engine.
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'each';
export type PriceBasis = 'gross' | 'net';
export interface PriceRecord { price: string; at: string }
export interface Ingredient {
  id: string;
  name: string;
  supplier: string;
  packQuantity: string;
  packUnit: Unit;
  packPrice: string;
  vatRate: string;
  priceHistory: PriceRecord[];
}
export interface PricingProfile {
  inputPriceBasis: PriceBasis;
  inputVatRecoverable: boolean;
  salePriceBasis: PriceBasis;
  saleVatRate: string;
  effectiveDate: string;
}
export interface RecipeLine { ingredientId: string; quantity: string; unit: Unit }
export type RecipeYield =
  | { kind: 'portions'; portions: string }
  | { kind: 'quantity'; quantity: string; unit: Unit; portionQuantity: string; portionUnit: Unit };
export interface Recipe {
  id: string;
  name: string;
  version: number;
  updatedAt: string;
  lines: RecipeLine[];
  yield: RecipeYield;
  wastePercent: string;
  packagingCost: string;
  packagingVatRate: string;
  otherVariableCost: string;
  otherVatRate: string;
  salePrice: string;
  targetMarginPercent: string;
}
export interface CostedLine extends RecipeLine { name: string; cost: string }
export interface RecipeCost {
  lines: CostedLine[];
  portionCount: string;
  ingredientBatchCost: string;
  ingredientCostPerPortion: string;
  packagingCostPerPortion: string;
  otherCostPerPortion: string;
  totalCostPerPortion: string;
  revenuePerPortion: string;
  contribution: string;
  marginPercent: string | null;
  markupPercent: string | null;
  foodCostPercent: string | null;
  targetNetPrice: string;
  targetDisplayPrice: string;
  targetPriceRoundedUp: string;
  belowTarget: boolean;
}

export class DomainError extends Error {
  constructor(message: string) { super(message); this.name = 'DomainError'; }
}

/** Strict user entry: decimal comma OR point, never grouping or exponent syntax.
 * Three-digit fractional input such as 1,250 is ambiguous and requires an
 * unambiguous form (1,2500 or 1.25). Canonical domain values do not use this parser.
 */
export function parseDecimalInput(value: string): string {
  const input = value.trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(input)) {
    throw new DomainError('Enter a non-negative number with one decimal separator and no thousands separator.');
  }
  if (/^\d{1,3}[.,]\d{3}$/.test(input)) {
    throw new DomainError('Ambiguous thousands separator: use an unambiguous decimal, for example 1.25 or 1250.');
  }
  return amount(input.replace(',', '.'), 'Number').toString();
}

function amount(value: string, label: string, positive = false): Decimal {
  if (typeof value !== 'string' || value.length > 80 || !/^\d+(?:\.\d+)?$/.test(value)) {
    throw new DomainError(`${label} must be a finite, non-negative decimal.`);
  }
  const result = new D(value);
  if (!result.isFinite() || result.isNegative() || (positive && result.isZero())) {
    throw new DomainError(`${label} must be ${positive ? 'greater than zero' : 'non-negative'}.`);
  }
  return result;
}

function percent(value: string, label: string, excludeHundred = false): Decimal {
  const result = amount(value, label);
  if (excludeHundred ? result.gte(100) : result.gt(100)) {
    throw new DomainError(`${label} must be ${excludeHundred ? 'less than' : 'at most'} 100%.`);
  }
  return result;
}

function validDateOnly(value: string): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const units: Record<Unit, { dimension: string; factor: string }> = {
  g: { dimension: 'mass', factor: '1' },
  kg: { dimension: 'mass', factor: '1000' },
  ml: { dimension: 'volume', factor: '1' },
  L: { dimension: 'volume', factor: '1000' },
  each: { dimension: 'count', factor: '1' },
};

function unitDefinition(unit: Unit) {
  if (!Object.prototype.hasOwnProperty.call(units, unit)) throw new DomainError(`Unknown unit: ${String(unit)}`);
  return units[unit];
}

export function convertQuantity(quantity: string, from: Unit, to: Unit): string {
  const source = unitDefinition(from);
  const destination = unitDefinition(to);
  if (source.dimension !== destination.dimension) {
    throw new DomainError(`Cannot convert ${from} to ${to} without an explicit conversion.`);
  }
  return amount(quantity, 'Quantity').mul(source.factor).div(destination.factor).toString();
}

export function validateProfile(profile: PricingProfile): void {
  if (!['gross', 'net'].includes(profile.inputPriceBasis) || !['gross', 'net'].includes(profile.salePriceBasis)) {
    throw new DomainError('Select gross or net price entry.');
  }
  if (typeof profile.inputVatRecoverable !== 'boolean') throw new DomainError('Declare input VAT recovery.');
  percent(profile.saleVatRate, 'Sale VAT rate');
  if (!validDateOnly(profile.effectiveDate)) {
    throw new DomainError('Pricing profile needs an effective date.');
  }
}

export function effectiveInputCost(price: string, vatRate: string, profile: PricingProfile): string {
  validateProfile(profile);
  const input = amount(price, 'Input price');
  const multiplier = percent(vatRate, 'Input VAT rate').div(100).plus(1);
  if (profile.inputPriceBasis === 'gross') return (profile.inputVatRecoverable ? input.div(multiplier) : input).toString();
  return (profile.inputVatRecoverable ? input : input.mul(multiplier)).toString();
}

export function validateIngredient(ingredient: Ingredient): void {
  if (!ingredient.id || !ingredient.name.trim()) throw new DomainError('Ingredient ID and name are required.');
  unitDefinition(ingredient.packUnit);
  amount(ingredient.packQuantity, 'Pack quantity', true);
  amount(ingredient.packPrice, 'Pack price');
  percent(ingredient.vatRate, 'Ingredient VAT rate');
  if (!Array.isArray(ingredient.priceHistory)) throw new DomainError('Price history is required.');
  for (const entry of ingredient.priceHistory) {
    amount(entry.price, 'Historical price');
    if (!entry.at || Number.isNaN(Date.parse(entry.at))) throw new DomainError('Price history date is invalid.');
  }
}

/** Price per requested unit, on the effective input-cost basis. */
export function unitPrice(ingredient: Ingredient, unit: Unit, profile: PricingProfile): string {
  validateIngredient(ingredient);
  const packInRequestedUnit = new D(convertQuantity(ingredient.packQuantity, ingredient.packUnit, unit));
  return new D(effectiveInputCost(ingredient.packPrice, ingredient.vatRate, profile)).div(packInRequestedUnit).toString();
}

export function ingredientLineCost(ingredient: Ingredient, quantity: string, unit: Unit, profile: PricingProfile): string {
  validateIngredient(ingredient);
  amount(quantity, 'Recipe quantity');
  // Multiply before dividing so consuming a whole pack conserves its price,
  // even when the price per small unit is a repeating decimal.
  const quantityInPackUnits = convertQuantity(quantity, unit, ingredient.packUnit);
  return new D(effectiveInputCost(ingredient.packPrice, ingredient.vatRate, profile))
    .mul(quantityInPackUnits).div(ingredient.packQuantity).toString();
}

export function portionsForYield(output: RecipeYield): string {
  if (!output || !['portions', 'quantity'].includes(output.kind)) throw new DomainError('Declare recipe output.');
  if (output.kind === 'portions') return amount(output.portions, 'Portions', true).toString();
  if (output.unit === 'each' || output.portionUnit === 'each') {
    throw new DomainError('Quantity output uses mass or volume; use portions for count output.');
  }
  const batchQuantity = amount(output.quantity, 'Batch output', true);
  const portionInBatchUnit = new D(convertQuantity(output.portionQuantity, output.portionUnit, output.unit));
  if (portionInBatchUnit.lte(0)) throw new DomainError('Portion size must be greater than zero.');
  return batchQuantity.div(portionInBatchUnit).toString();
}

export function calculateRecipe(recipe: Recipe, ingredients: Ingredient[], profile: PricingProfile): RecipeCost {
  validateProfile(profile);
  if (!recipe.id || !recipe.name.trim()) throw new DomainError('Recipe ID and name are required.');
  if (!Number.isInteger(recipe.version) || recipe.version < 1) throw new DomainError('Recipe version must be a positive integer.');
  if (!recipe.updatedAt || Number.isNaN(Date.parse(recipe.updatedAt))) throw new DomainError('Recipe update date is invalid.');
  if (!Array.isArray(recipe.lines) || recipe.lines.length === 0) throw new DomainError('Add at least one ingredient.');
  const ingredientMap = new Map<string, Ingredient>();
  for (const ingredient of ingredients) {
    if (ingredientMap.has(ingredient.id)) throw new DomainError(`Duplicate ingredient ID: ${ingredient.id}`);
    ingredientMap.set(ingredient.id, ingredient);
  }
  const lines = recipe.lines.map(line => {
    const ingredient = ingredientMap.get(line.ingredientId);
    if (!ingredient) throw new DomainError(`Missing ingredient: ${line.ingredientId}`);
    amount(line.quantity, 'Recipe quantity', true);
    return { ...line, name: ingredient.name, cost: ingredientLineCost(ingredient, line.quantity, line.unit, profile) };
  });
  const portionCount = new D(portionsForYield(recipe.yield));
  const wasteMultiplier = new D(1).minus(percent(recipe.wastePercent, 'Waste', true).div(100));
  const rawBatch = lines.reduce((sum, line) => sum.plus(line.cost), new D(0));
  // Declared output is saleable yield. Loss adds the extra ingredient input
  // needed to produce that output; packaging and other per-sale costs are not wasted.
  const ingredientBatch = rawBatch.div(wasteMultiplier);
  const ingredientPortion = ingredientBatch.div(portionCount);
  const packaging = new D(effectiveInputCost(recipe.packagingCost, recipe.packagingVatRate, profile));
  const other = new D(effectiveInputCost(recipe.otherVariableCost, recipe.otherVatRate, profile));
  const total = ingredientPortion.plus(packaging).plus(other);
  const saleVatMultiplier = percent(profile.saleVatRate, 'Sale VAT rate').div(100).plus(1);
  const sale = amount(recipe.salePrice, 'Sale price');
  const revenue = profile.salePriceBasis === 'gross' ? sale.div(saleVatMultiplier) : sale;
  const contribution = revenue.minus(total);
  const target = percent(recipe.targetMarginPercent, 'Target contribution margin', true);
  const targetNet = total.div(new D(1).minus(target.div(100)));
  const targetDisplay = profile.salePriceBasis === 'gross' ? targetNet.mul(saleVatMultiplier) : targetNet;
  const margin = revenue.isZero() ? null : contribution.div(revenue).mul(100);
  return {
    lines,
    portionCount: portionCount.toString(),
    ingredientBatchCost: ingredientBatch.toString(),
    ingredientCostPerPortion: ingredientPortion.toString(),
    packagingCostPerPortion: packaging.toString(),
    otherCostPerPortion: other.toString(),
    totalCostPerPortion: total.toString(),
    revenuePerPortion: revenue.toString(),
    contribution: contribution.toString(),
    marginPercent: margin?.toString() ?? null,
    markupPercent: total.isZero() ? null : contribution.div(total).mul(100).toString(),
    foodCostPercent: revenue.isZero() ? null : ingredientPortion.div(revenue).mul(100).toString(),
    targetNetPrice: targetNet.toString(),
    targetDisplayPrice: targetDisplay.toString(),
    // Recommendations round UP to cents, so display rounding cannot undercut target.
    targetPriceRoundedUp: targetDisplay.toDecimalPlaces(2, Decimal.ROUND_CEIL).toFixed(2),
    belowTarget: margin === null || contribution.lt(revenue.mul(target).div(100)),
  };
}

export function money(value: string): string { return new D(value).toFixed(2, Decimal.ROUND_HALF_UP); }

/** Validate the full referenced recipe at a persistence boundary. */
export function validateRecipe(recipe: Recipe, ingredients: Ingredient[], profile: PricingProfile): void {
  calculateRecipe(recipe, ingredients, profile);
}

export function updateIngredientPrice(ingredient: Ingredient, price: string, at: string): Ingredient {
  validateIngredient(ingredient);
  amount(price, 'New pack price');
  if (!at || Number.isNaN(Date.parse(at))) throw new DomainError('Price change date is invalid.');
  const last = ingredient.priceHistory.at(-1);
  if (last && Date.parse(at) < Date.parse(last.at)) throw new DomainError('Price changes must be chronological.');
  return { ...ingredient, packPrice: price, priceHistory: [...ingredient.priceHistory.map(record => ({ ...record })), { price, at }] };
}

export interface PriceImpact { recipeId: string; recipeName: string; before: RecipeCost; after: RecipeCost; costDelta: string; marginDelta: string | null }
export function compareIngredientPriceChange(
  ingredientId: string, price: string, recipes: Recipe[], ingredients: Ingredient[], profile: PricingProfile,
): PriceImpact[] {
  amount(price, 'New pack price');
  if (!ingredients.some(ingredient => ingredient.id === ingredientId)) throw new DomainError('Ingredient not found.');
  const next = ingredients.map(ingredient => ingredient.id === ingredientId ? { ...ingredient, packPrice: price } : ingredient);
  return recipes.filter(recipe => recipe.lines.some(line => line.ingredientId === ingredientId)).map(recipe => {
    const before = calculateRecipe(recipe, ingredients, profile);
    const after = calculateRecipe(recipe, next, profile);
    return {
      recipeId: recipe.id, recipeName: recipe.name, before, after,
      costDelta: new D(after.totalCostPerPortion).minus(before.totalCostPerPortion).toString(),
      marginDelta: before.marginPercent === null || after.marginPercent === null ? null : new D(after.marginPercent).minus(before.marginPercent).toString(),
    };
  });
}

export interface RecipeSnapshot { at: string; recipe: Recipe; ingredients: Ingredient[]; profile: PricingProfile; cost: RecipeCost }
export function snapshotRecipe(recipe: Recipe, ingredients: Ingredient[], profile: PricingProfile, at: string): RecipeSnapshot {
  if (!at || Number.isNaN(Date.parse(at))) throw new DomainError('Snapshot date is invalid.');
  const relevant = ingredients.filter(ingredient => recipe.lines.some(line => line.ingredientId === ingredient.id));
  return structuredClone({ at, recipe, ingredients: relevant, profile, cost: calculateRecipe(recipe, ingredients, profile) });
}
