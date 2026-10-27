import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MAX_PDF_BYTES, previewScale, reviewProposal, validatePageCount, validatePdfMagic, validatePdfMetadata } from '../src/documents/policy';
import type { Ingredient, PricingProfile, Recipe } from '../src/domain';

const profile: PricingProfile = { inputPriceBasis: 'gross', inputVatRecoverable: false, salePriceBasis: 'gross', saleVatRate: '0', effectiveDate: '2026-10-27' };
const ingredient: Ingredient = { id: 'flour', name: 'Flour', supplier: 'Synthetic', packQuantity: '1', packUnit: 'kg', packPrice: '2.40', vatRate: '0', priceHistory: [] };
const recipe: Recipe = { id: 'bread', name: 'Bread', version: 1, updatedAt: '2026-10-27', lines: [{ ingredientId: 'flour', quantity: '150', unit: 'g' }], yield: { kind: 'portions', portions: '1' }, wastePercent: '0', packagingCost: '0.1', packagingVatRate: '0', otherVariableCost: '0', otherVatRate: '0', salePrice: '2', targetMarginPercent: '60' };

describe('untrusted PDF allowlist and budgets', () => {
  it('requires PDF extension, exact MIME and a bounded non-empty size', () => {
    expect(() => validatePdfMetadata({ name: 'invoice.pdf', type: 'application/pdf', size: 100 })).not.toThrow();
    for (const file of [{ name: 'invoice.html', type: 'application/pdf', size: 100 }, { name: 'invoice.pdf', type: 'text/html', size: 100 }, { name: 'invoice.pdf', type: '', size: 100 }, { name: 'invoice.pdf', type: 'application/pdf', size: MAX_PDF_BYTES + 1 }, { name: 'invoice.pdf', type: 'application/pdf', size: 0 }]) expect(() => validatePdfMetadata(file)).toThrow();
  });
  it('rejects renamed non-PDF payloads and the malformed fixture', () => {
    expect(() => validatePdfMagic(new TextEncoder().encode('<script>alert(1)</script>'))).toThrow();
    expect(() => validatePdfMagic(readFileSync('fixtures/synthetic/malformed.pdf'))).toThrow();
    expect(() => validatePdfMagic(readFileSync('public/synthetic-invoice.pdf'))).not.toThrow();
  });
  it('rejects excessive or impossible page counts', () => {
    expect(() => validatePageCount(10)).not.toThrow();
    for (const count of [0, 11, Infinity, 1.5]) expect(() => validatePageCount(count)).toThrow();
  });
  it('bounds preview pixels even for huge pages and rejects invalid geometry', () => {
    for (const [width, height] of [[595, 842], [100_000, 200_000], [1, 100_000]]) {
      const scale = previewScale(width, height);
      expect(width * height * scale * scale).toBeLessThanOrEqual(2_000_001);
      expect(width * scale).toBeLessThanOrEqual(1200);
      expect(height * scale).toBeLessThanOrEqual(1800);
    }
    expect(() => previewScale(0, 100)).toThrow();
    expect(() => previewScale(Infinity, 100)).toThrow();
  });
});

describe('mandatory human price review contract', () => {
  const review = (key = 'doc-a', price = '3,60', items = [ingredient], recipes = [recipe], p = profile) => reviewProposal(key, 'flour', price, recipes, items, p);
  it('calculates dependent impacts without changing any catalogue or recipe', () => {
    const before = structuredClone({ ingredient, recipe });
    const result = review();
    expect(result.price).toBe('3.6');
    expect(result.impacts[0].before.totalCostPerPortion).toBe('0.46');
    expect(result.impacts[0].after.totalCostPerPortion).toBe('0.64');
    expect({ ingredient, recipe }).toEqual(before);
  });
  it('invalidates approval on document, price, catalogue, recipe or VAT changes', () => {
    const original = review().token;
    for (const changed of [review('doc-b'), review('doc-a', '4.00'), review('doc-a', '3.60', [{ ...ingredient, packQuantity: '2' }]), review('doc-a', '3.60', [ingredient], [{ ...recipe, salePrice: '3' }]), review('doc-a', '3.60', [ingredient], [recipe], { ...profile, saleVatRate: '20' })]) expect(changed.token).not.toBe(original);
  });
  it('rejects missing documents, mappings, ambiguous punctuation and negative prices', () => {
    expect(() => review('')).toThrow();
    expect(() => reviewProposal('doc', 'missing', '4', [recipe], [ingredient], profile)).toThrow();
    expect(() => review('doc', '1,250')).toThrow();
    expect(() => review('doc', '-1')).toThrow();
  });
});
