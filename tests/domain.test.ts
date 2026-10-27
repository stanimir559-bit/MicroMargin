import { describe, expect, it } from 'vitest';
import {
  calculateRecipe, compareIngredientPriceChange, convertQuantity, effectiveInputCost,
  ingredientLineCost, money, parseDecimalInput, portionsForYield, snapshotRecipe,
  unitPrice, updateIngredientPrice, validateIngredient, validateProfile,
  type Ingredient, type PricingProfile, type Recipe, type Unit,
} from '../src/domain';

const profile: PricingProfile = { inputPriceBasis: 'gross', inputVatRecoverable: false, salePriceBasis: 'gross', saleVatRate: '0', effectiveDate: '2026-10-27' };
const flour: Ingredient = { id: 'flour', name: 'Брашно / Flour', supplier: 'Synthetic supplier', packQuantity: '1', packUnit: 'kg', packPrice: '2.40', vatRate: '0', priceHistory: [{ price: '2.40', at: '2026-10-01T00:00:00Z' }] };
const recipe: Recipe = {
  id: 'bread', name: 'Synthetic bread', version: 1, updatedAt: '2026-10-27T00:00:00Z',
  lines: [{ ingredientId: 'flour', quantity: '150', unit: 'g' }],
  yield: { kind: 'portions', portions: '1' }, wastePercent: '0',
  packagingCost: '0.14', packagingVatRate: '0', otherVariableCost: '0.1', otherVatRate: '0',
  salePrice: '2', targetMarginPercent: '60',
};

describe('decimal entries and units', () => {
  it('accepts Bulgarian decimal comma and English point without float drift', () => {
    expect(parseDecimalInput(' 1,25 ')).toBe('1.25');
    expect(parseDecimalInput('0.10')).toBe('0.1');
    expect(money('1.005')).toBe('1.01');
  });
  it.each(['1,250', '1.250', '1,000.25', '1.000,25', '1 250', '1e3', '-1', 'NaN', 'Infinity', '', '.2', '2.'])('rejects ambiguous or invalid input %s', value => {
    expect(() => parseDecimalInput(value)).toThrow();
  });
  it('normalizes 1.2 kg at 4 per kg to 4.80', () => {
    expect(ingredientLineCost({ ...flour, packPrice: '4' }, '1.2', 'kg', profile)).toBe('4.8');
  });
  it('costs 150 g drawn from 1 kg at 2.40 as 0.36', () => {
    expect(ingredientLineCost(flour, '150', 'g', profile)).toBe('0.36');
    expect(unitPrice(flour, 'g', profile)).toBe('0.0024');
  });
  it('normalizes volume and count packs', () => {
    expect(convertQuantity('400', 'ml', 'L')).toBe('0.4');
    expect(ingredientLineCost({ ...flour, packQuantity: '24', packUnit: 'each', packPrice: '6' }, '3', 'each', profile)).toBe('0.75');
  });
  it('conserves the exact whole-pack price with repeating per-unit decimals', () => {
    expect(ingredientLineCost({ ...flour, packQuantity: '3', packPrice: '1' }, '3', 'kg', profile)).toBe('1');
  });
  it('rejects incompatible and unknown units', () => {
    expect(() => convertQuantity('1', 'kg', 'L')).toThrow(/Cannot convert/);
    expect(() => convertQuantity('1', 'oz' as Unit, 'g')).toThrow(/Unknown unit/);
    expect(() => convertQuantity('1', '__proto__' as Unit, 'g')).toThrow(/Unknown unit/);
  });
});

describe('VAT profiles are explicit assumptions', () => {
  it.each([
    ['gross', true, '10'], ['gross', false, '12'], ['net', true, '12'], ['net', false, '14.4'],
  ] as const)('%s input, recoverable=%s yields %s', (basis, recoverable, expected) => {
    expect(effectiveInputCost('12', '20', { ...profile, inputPriceBasis: basis, inputVatRecoverable: recoverable })).toBe(expected);
  });
  it('excludes configured sale VAT and applies it to target display price', () => {
    const cost = calculateRecipe({ ...recipe, salePrice: '2.4', targetMarginPercent: '70' }, [flour], { ...profile, saleVatRate: '20' });
    expect(cost.revenuePerPortion).toBe('2');
    expect(cost.totalCostPerPortion).toBe('0.6');
    expect(cost.targetNetPrice).toBe('2');
    expect(cost.targetDisplayPrice).toBe('2.4');
    expect(cost.marginPercent).toBe('70');
  });
  it('net sale entry is already revenue', () => {
    const cost = calculateRecipe(recipe, [flour], { ...profile, saleVatRate: '20', salePriceBasis: 'net' });
    expect(cost.revenuePerPortion).toBe('2');
    expect(cost.targetDisplayPrice).toBe('1.5');
  });
  it('normalizes packaging and other expenses using their own VAT rates', () => {
    const cost = calculateRecipe({ ...recipe, packagingCost: '0.12', packagingVatRate: '20', otherVariableCost: '0.24', otherVatRate: '20' }, [flour], { ...profile, inputVatRecoverable: true });
    expect(cost.packagingCostPerPortion).toBe('0.1');
    expect(cost.otherCostPerPortion).toBe('0.2');
  });
});

describe('recipe yield and transparent contribution metrics', () => {
  it('distinguishes contribution margin from contribution-on-cost markup', () => {
    const result = calculateRecipe(recipe, [flour], profile);
    expect(result.ingredientBatchCost).toBe('0.36');
    expect(result.totalCostPerPortion).toBe('0.6');
    expect(result.contribution).toBe('1.4');
    expect(result.marginPercent).toBe('70');
    expect(result.markupPercent?.slice(0, 8)).toBe('233.3333');
    expect(result.foodCostPercent).toBe('18');
    expect(result.belowTarget).toBe(false);
    expect(result.targetPriceRoundedUp).toBe('1.50');
  });
  it('divides batch ingredients by eight portions, adds per-portion packaging once', () => {
    const result = calculateRecipe({ ...recipe, yield: { kind: 'portions', portions: '8' } }, [flour], profile);
    expect(result.ingredientCostPerPortion).toBe('0.045');
    expect(result.totalCostPerPortion).toBe('0.285');
  });
  it('supports 400 ml batch with explicit 50 ml portions', () => {
    expect(portionsForYield({ kind: 'quantity', quantity: '0.4', unit: 'L', portionQuantity: '50', portionUnit: 'ml' })).toBe('8');
  });
  it('waste is loss requiring extra ingredient input, excluding packaging and other expenses', () => {
    const result = calculateRecipe({ ...recipe, wastePercent: '20' }, [flour], profile);
    expect(result.ingredientBatchCost).toBe('0.45');
    expect(result.totalCostPerPortion).toBe('0.69');
  });
  it('leaves percentage denominators undefined when zero', () => {
    const result = calculateRecipe({ ...recipe, salePrice: '0', packagingCost: '0', otherVariableCost: '0' }, [{ ...flour, packPrice: '0' }], profile);
    expect(result.marginPercent).toBeNull();
    expect(result.markupPercent).toBeNull();
    expect(result.foodCostPercent).toBeNull();
    expect(result.belowTarget).toBe(true);
  });
  it('reports negative contribution truthfully and rounds recommendation up', () => {
    const result = calculateRecipe({ ...recipe, salePrice: '0.5', targetMarginPercent: '63' }, [flour], profile);
    expect(result.contribution).toBe('-0.1');
    expect(result.marginPercent).toBe('-20');
    expect(result.belowTarget).toBe(true);
    expect(result.targetPriceRoundedUp).toBe('1.63');
  });
  it('sums exact decimal values', () => {
    const result = calculateRecipe({ ...recipe, lines: [{ ingredientId: 'flour', quantity: '1', unit: 'kg' }, { ingredientId: 'flour', quantity: '2', unit: 'kg' }], packagingCost: '0', otherVariableCost: '0' }, [{ ...flour, packPrice: '0.1' }], profile);
    expect(result.totalCostPerPortion).toBe('0.3');
  });
});

describe('validation', () => {
  it.each([
    { ...recipe, wastePercent: '100' }, { ...recipe, wastePercent: '-1' },
    { ...recipe, targetMarginPercent: '100' }, { ...recipe, targetMarginPercent: '-1' },
    { ...recipe, yield: { kind: 'portions' as const, portions: '0' } },
    { ...recipe, yield: { kind: 'quantity' as const, quantity: '400', unit: 'ml' as const, portionQuantity: '0', portionUnit: 'ml' as const } },
    { ...recipe, salePrice: '-1' }, { ...recipe, packagingCost: 'NaN' },
    { ...recipe, lines: [] }, { ...recipe, lines: [{ ingredientId: 'missing', quantity: '1', unit: 'g' as const }] },
    { ...recipe, lines: [{ ingredientId: 'flour', quantity: '0', unit: 'g' as const }] },
    { ...recipe, version: 0 }, { ...recipe, updatedAt: 'nonsense' },
  ])('rejects invalid recipe %#', invalid => { expect(() => calculateRecipe(invalid, [flour], profile)).toThrow(); });
  it('rejects invalid packs and duplicate IDs', () => {
    expect(() => validateIngredient({ ...flour, packQuantity: '0' })).toThrow();
    expect(() => validateIngredient({ ...flour, packPrice: 'Infinity' })).toThrow();
    expect(() => calculateRecipe(recipe, [flour, flour], profile)).toThrow(/Duplicate/);
    expect(() => validateProfile({ ...profile, saleVatRate: '101' })).toThrow();
    expect(() => validateProfile({ ...profile, effectiveDate: '' })).toThrow();
  });
});

describe('price changes and immutable history', () => {
  it('propagates price changes and leaves historical snapshots unchanged', () => {
    const saved = snapshotRecipe(recipe, [flour], profile, '2026-10-27T12:00:00Z');
    const next = updateIngredientPrice(flour, '4.8', '2026-10-27T12:01:00Z');
    expect(calculateRecipe(recipe, [next], profile).totalCostPerPortion).toBe('0.96');
    expect(saved.cost.totalCostPerPortion).toBe('0.6');
    expect(saved.ingredients[0].packPrice).toBe('2.40');
    expect(flour.priceHistory).toHaveLength(1);
    expect(next.priceHistory).toHaveLength(2);
    next.priceHistory[0].price = '999';
    expect(flour.priceHistory[0].price).toBe('2.40');
  });
  it('computes affected recipe before/after and percentage point delta', () => {
    const result = compareIngredientPriceChange('flour', '4.8', [recipe], [flour], profile);
    expect(result).toHaveLength(1);
    expect(result[0].costDelta).toBe('0.36');
    expect(result[0].marginDelta).toBe('-18');
    expect(flour.packPrice).toBe('2.40');
  });
  it('rejects historical backdating and missing ingredient', () => {
    expect(() => updateIngredientPrice(flour, '4', '2025-01-01')).toThrow(/chronological/);
    expect(() => compareIngredientPriceChange('missing', '2', [recipe], [flour], profile)).toThrow();
  });
});
