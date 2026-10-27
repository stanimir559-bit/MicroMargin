import { describe, expect, it } from 'vitest';
import { canonicalRecipe, editableDecimal, editableRecipe } from '../src/input';
import { demoRecipes } from '../src/data/demo';
describe('editable decimal roundtrip', () => {
  it('rejects ambiguous new input and preserves valid canonical three-place prices', () => {
    const recipe = { ...structuredClone(demoRecipes[0]), salePrice: '1.001', packagingCost: '0.125', otherVariableCost: '0.1' };
    recipe.lines[0].quantity = '2.345';
    expect(() => canonicalRecipe(recipe)).toThrow(/Ambiguous/);
    expect(canonicalRecipe(editableRecipe(recipe))).toEqual(recipe);
    expect(editableDecimal('1.001')).toBe('1.0010');
  });
});
