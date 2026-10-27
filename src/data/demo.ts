import type { Ingredient, Recipe, PricingProfile } from '../domain';
const at = '2026-10-27T09:00:00.000Z';
export const demoProfile: PricingProfile = { inputPriceBasis: 'gross', inputVatRecoverable: false, salePriceBasis: 'gross', saleVatRate: '0', effectiveDate: '2026-10-27' };
export const demoIngredients: Ingredient[] = [
  { id: 'flour', name: 'Брашно / Flour', supplier: 'Мелница Демо', packQuantity: '1', packUnit: 'kg', packPrice: '2.40', vatRate: '0', priceHistory: [{ price: '2.10', at: '2026-10-01T09:00:00.000Z' }, { price: '2.40', at }] },
  { id: 'butter', name: 'Масло / Butter', supplier: 'Demo Dairy', packQuantity: '0.25', packUnit: 'kg', packPrice: '3.20', vatRate: '0', priceHistory: [{ price: '2.80', at: '2026-10-01T09:00:00.000Z' }, { price: '3.20', at }] },
  { id: 'eggs', name: 'Яйца / Eggs', supplier: 'Ферма Пример', packQuantity: '10', packUnit: 'each', packPrice: '3.00', vatRate: '0', priceHistory: [{ price: '3.00', at }] },
  { id: 'sugar', name: 'Захар / Sugar', supplier: 'Мелница Демо', packQuantity: '1', packUnit: 'kg', packPrice: '1.60', vatRate: '0', priceHistory: [{ price: '1.60', at }] },
  { id: 'chocolate', name: 'Шоколад / Chocolate', supplier: 'Cacao Demo', packQuantity: '1', packUnit: 'kg', packPrice: '14.50', vatRate: '0', priceHistory: [{ price: '12.00', at: '2026-10-01T09:00:00.000Z' }, { price: '14.50', at }] },
  { id: 'milk', name: 'Мляко / Milk', supplier: 'Demo Dairy', packQuantity: '1', packUnit: 'L', packPrice: '1.80', vatRate: '0', priceHistory: [{ price: '1.80', at }] },
  { id: 'skyr', name: 'Скир / Skyr', supplier: 'Demo Dairy', packQuantity: '1', packUnit: 'kg', packPrice: '4.00', vatRate: '0', priceHistory: [{ price: '4.00', at }] },
  { id: 'berries', name: 'Горски плодове / Berries', supplier: 'Плод Демо', packQuantity: '0.5', packUnit: 'kg', packPrice: '3.50', vatRate: '0', priceHistory: [{ price: '3.50', at }] },
];
const base = { version: 1, updatedAt: at, wastePercent: '5', packagingCost: '0.15', packagingVatRate: '0', otherVariableCost: '0.10', otherVatRate: '0', targetMarginPercent: '65' };
export const demoRecipes: Recipe[] = [
  { ...base, id: 'brownie', name: 'Шоколадово брауни / Chocolate brownie', yield: { kind: 'portions', portions: '12' }, salePrice: '2.80', lines: [{ ingredientId: 'chocolate', quantity: '300', unit: 'g' }, { ingredientId: 'butter', quantity: '200', unit: 'g' }, { ingredientId: 'sugar', quantity: '250', unit: 'g' }, { ingredientId: 'flour', quantity: '150', unit: 'g' }, { ingredientId: 'eggs', quantity: '4', unit: 'each' }] },
  { ...base, id: 'cookie', name: 'Маслена бисквита / Butter cookie', yield: { kind: 'portions', portions: '20' }, salePrice: '1.90', lines: [{ ingredientId: 'flour', quantity: '400', unit: 'g' }, { ingredientId: 'butter', quantity: '250', unit: 'g' }, { ingredientId: 'sugar', quantity: '150', unit: 'g' }, { ingredientId: 'eggs', quantity: '2', unit: 'each' }] },
  { ...base, id: 'skyr-cup', name: 'Скир с плодове / Berry skyr cup', yield: { kind: 'portions', portions: '8' }, wastePercent: '2', packagingCost: '0.25', salePrice: '3.60', lines: [{ ingredientId: 'skyr', quantity: '1200', unit: 'g' }, { ingredientId: 'berries', quantity: '400', unit: 'g' }, { ingredientId: 'sugar', quantity: '80', unit: 'g' }] },
  { ...base, id: 'pancake', name: 'Мини палачинки / Mini pancakes', yield: { kind: 'portions', portions: '10' }, salePrice: '3.20', lines: [{ ingredientId: 'flour', quantity: '350', unit: 'g' }, { ingredientId: 'milk', quantity: '600', unit: 'ml' }, { ingredientId: 'eggs', quantity: '3', unit: 'each' }, { ingredientId: 'butter', quantity: '80', unit: 'g' }] },
];
