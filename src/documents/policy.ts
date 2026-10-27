import { compareIngredientPriceChange, parseDecimalInput, type Ingredient, type PricingProfile, type Recipe } from '../domain';

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_PAGES = 10;
export const MAX_TEXT_CHARS = 100_000;
export const PDF_BUDGET_MS = 15_000;

export function validatePdfMetadata(file: { name: string; type: string; size: number }): void {
  if (!/\.pdf$/i.test(file.name) || file.type !== 'application/pdf') throw new Error('Only .pdf files with application/pdf MIME type are accepted.');
  if (file.size < 8 || file.size > MAX_PDF_BYTES) throw new Error('PDF size must be between 8 bytes and 5 MB.');
}

export function validatePdfMagic(data: Uint8Array): void {
  if (data.length < 8 || new TextDecoder('ascii').decode(data.subarray(0, 5)) !== '%PDF-') throw new Error('This file does not have a valid PDF header.');
}

export function validatePageCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > MAX_PDF_PAGES) throw new Error('Only PDFs with 1 to 10 pages are accepted.');
}

export function previewScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Invalid PDF page dimensions.');
  return Math.min(1.5, 1200 / width, 1800 / height, Math.sqrt(2_000_000 / (width * height)));
}

/** Token binds explicit human approval to the exact document, price and domain inputs. */
export function reviewProposal(documentKey: string, ingredientId: string, rawPrice: string, recipes: Recipe[], ingredients: Ingredient[], profile: PricingProfile) {
  if (!documentKey) throw new Error('Preview a synthetic document first.');
  const price = parseDecimalInput(rawPrice);
  const ingredient = ingredients.find(item => item.id === ingredientId);
  if (!ingredient) throw new Error('Select the matching catalogue ingredient.');
  const impacts = compareIngredientPriceChange(ingredientId, price, recipes, ingredients, profile);
  return { price, ingredient, impacts, token: JSON.stringify({ documentKey, ingredientId, price, recipes, ingredients, profile }) };
}
