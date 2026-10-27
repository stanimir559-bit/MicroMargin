import { calculateRecipe, snapshotRecipe, updateIngredientPrice, validateIngredient, validateProfile, type Ingredient, type Recipe, type PricingProfile, type RecipeSnapshot } from '../domain';
import { demoIngredients, demoRecipes, demoProfile } from '../data/demo';
import Decimal from 'decimal.js';

export interface AppState {
  schemaVersion: 1;
  locale: 'bg' | 'en';
  onboarded: boolean;
  ingredients: Ingredient[];
  recipes: Recipe[];
  profile: PricingProfile;
  snapshots: RecipeSnapshot[];
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const STORAGE_KEY = 'micromargin.state.v1';
export const RECOVERY_KEY = `${STORAGE_KEY}.recovery`;
export const MAX_STATE_LENGTH = 4 * 1024 * 1024;

function reject(message: string): never { throw new Error(`Local data: ${message}`); }
function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) reject(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function string(value: unknown, label: string, max = 160, empty = false): asserts value is string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) reject(`${label} is invalid or too long.`);
}
function decimal(value: unknown, label: string): void {
  string(value, label, 80);
  if (!/^\d+(?:\.\d+)?$/.test(value)) reject(`${label} must be a decimal string.`);
}
function date(value: unknown, label: string): asserts value is string {
  string(value, label, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) reject(`${label} must be an ISO timestamp.`);
}
function array(value: unknown, label: string, max: number): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length > max) reject(`${label} must be an array of at most ${max} items.`);
}
function unit(value: unknown): void { if (typeof value !== 'string' || !['g', 'kg', 'ml', 'L', 'each'].includes(value)) reject('Unknown unit.'); }
function profileShape(value: unknown): asserts value is PricingProfile {
  const p = object(value, 'Pricing profile');
  string(p.inputPriceBasis, 'Input basis'); string(p.salePriceBasis, 'Sale basis');
  decimal(p.saleVatRate, 'Sale VAT'); string(p.effectiveDate, 'Effective date', 10);
  if (typeof p.inputVatRecoverable !== 'boolean') reject('VAT recovery must be boolean.');
  validateProfile(value as PricingProfile);
}
function ingredientShape(value: unknown): asserts value is Ingredient {
  const i = object(value, 'Ingredient');
  string(i.id, 'Ingredient ID', 80); string(i.name, 'Ingredient name'); string(i.supplier, 'Supplier', 160, true);
  decimal(i.packQuantity, 'Pack quantity'); decimal(i.packPrice, 'Pack price'); decimal(i.vatRate, 'VAT'); unit(i.packUnit);
  array(i.priceHistory, 'Price history', 2000);
  let previous = -Infinity;
  for (const item of i.priceHistory) {
    const record = object(item, 'Price record'); decimal(record.price, 'Historical price'); date(record.at, 'Price date');
    if (Date.parse(record.at) < previous) reject('Price history must be chronological.');
    previous = Date.parse(record.at);
  }
  if (!i.priceHistory.length) reject('Price history must include the current price.');
  const last = object(i.priceHistory.at(-1), 'Last price record');
  // Numeric equivalence (2.40 vs 2.4) is accepted through the domain calculation.
  if (!new Decimal(last.price as string).equals(i.packPrice as string)) reject('Current price must match the last history entry.');
  validateIngredient(value as Ingredient);
}
function recipeShape(value: unknown): asserts value is Recipe {
  const r = object(value, 'Recipe'); string(r.id, 'Recipe ID', 80); string(r.name, 'Recipe name'); date(r.updatedAt, 'Recipe date');
  if (!Number.isSafeInteger(r.version) || Number(r.version) < 1) reject('Recipe version must be a positive safe integer.');
  array(r.lines, 'Recipe lines', 250);
  for (const line of r.lines) { const l = object(line, 'Recipe line'); string(l.ingredientId, 'Referenced ingredient', 80); decimal(l.quantity, 'Line quantity'); unit(l.unit); }
  const y = object(r.yield, 'Recipe yield');
  if (y.kind === 'portions') decimal(y.portions, 'Portions');
  else if (y.kind === 'quantity') { decimal(y.quantity, 'Yield quantity'); unit(y.unit); decimal(y.portionQuantity, 'Portion quantity'); unit(y.portionUnit); }
  else reject('Unknown yield kind.');
  for (const key of ['wastePercent', 'packagingCost', 'packagingVatRate', 'otherVariableCost', 'otherVatRate', 'salePrice', 'targetMarginPercent']) decimal(r[key], key);
}
function unique(values: { id: string }[], label: string): void {
  if (new Set(values.map(item => item.id)).size !== values.length) reject(`Duplicate ${label} IDs.`);
}

/** Structural validation precedes domain calculations; malformed JSON is never trusted as TS. */
export function validateState(value: unknown): asserts value is AppState {
  const s = object(value, 'State');
  if (s.schemaVersion !== 1) reject('Unsupported schema version; preserve/export before migration.');
  if (typeof s.locale !== 'string' || !['bg', 'en'].includes(s.locale) || typeof s.onboarded !== 'boolean') reject('Locale/onboarding is invalid.');
  profileShape(s.profile); array(s.ingredients, 'Ingredients', 500); array(s.recipes, 'Recipes', 200); array(s.snapshots, 'Snapshots', 2000);
  for (const i of s.ingredients) ingredientShape(i);
  unique(s.ingredients as Ingredient[], 'ingredient');
  for (const r of s.recipes) { recipeShape(r); calculateRecipe(r, s.ingredients as Ingredient[], s.profile); }
  unique(s.recipes as Recipe[], 'recipe');
  for (const item of s.snapshots) {
    const snap = object(item, 'Snapshot'); date(snap.at, 'Snapshot date'); recipeShape(snap.recipe); profileShape(snap.profile); array(snap.ingredients, 'Snapshot ingredients', 500);
    for (const i of snap.ingredients) ingredientShape(i);
    unique(snap.ingredients as Ingredient[], 'snapshot ingredient');
    const expected = calculateRecipe(snap.recipe, snap.ingredients as Ingredient[], snap.profile);
    const actual = object(snap.cost, 'Snapshot cost');
    // Compare canonical values by key rather than trusting serialized historical totals.
    for (const [key, result] of Object.entries(expected)) {
      if (JSON.stringify(actual[key]) !== JSON.stringify(result)) reject(`Historical calculation mismatch: ${key}.`);
    }
  }
}

export function createDemoState(): AppState {
  return structuredClone({ schemaVersion: 1, locale: 'bg', onboarded: false, ingredients: demoIngredients, recipes: demoRecipes, profile: demoProfile, snapshots: [] });
}
function browserStorage(): StorageLike {
  try { if (!globalThis.localStorage) reject('Browser storage is unavailable.'); return globalThis.localStorage; }
  catch { reject('Browser storage is unavailable; changes remain in memory.'); }
}
function decode(raw: string): AppState {
  if (raw.length > MAX_STATE_LENGTH || new TextEncoder().encode(raw).byteLength > MAX_STATE_LENGTH) reject('Stored data exceeds the 4 MiB limit.');
  const state: unknown = JSON.parse(raw); validateState(state); return state;
}
function preserve(raw: string, storage: StorageLike): void {
  const existing = storage.getItem(RECOVERY_KEY);
  if (existing !== null && existing !== raw) reject('A different recovery backup already exists. Export both records before replacing local data.');
  if (existing === null) storage.setItem(RECOVERY_KEY, raw);
  if (storage.getItem(RECOVERY_KEY) !== raw) reject('Recovery backup could not be verified. Original data was retained.');
}
export function loadState(storage?: StorageLike): { state: AppState; warning?: string } {
  let raw: string | null = null;
  try {
    const store = storage ?? browserStorage(); raw = store.getItem(STORAGE_KEY);
    if (raw === null) return { state: createDemoState() };
    try { return { state: decode(raw) }; }
    catch {
      preserve(raw, store);
      return { state: createDemoState(), warning: `Saved data could not be read. Synthetic demo opened; original data preserved at ${RECOVERY_KEY}.` };
    }
  } catch (error) {
    return { state: createDemoState(), warning: `Storage unavailable or recovery blocked. ${error instanceof Error ? error.message : 'Changes remain in memory.'} ${raw !== null ? 'Original stored data was retained.' : ''}` };
  }
}
export function saveState(state: AppState, storage?: StorageLike): void {
  validateState(state); const raw = JSON.stringify(state);
  if (raw.length > MAX_STATE_LENGTH || new TextEncoder().encode(raw).byteLength > MAX_STATE_LENGTH) reject('Data exceeds 4 MiB; export a backup before adding more history.');
  const store = storage ?? browserStorage(); const existing = store.getItem(STORAGE_KEY);
  if (existing !== null) { try { decode(existing); } catch { preserve(existing, store); } }
  try { store.setItem(STORAGE_KEY, raw); }
  catch { reject('Could not save (storage disabled or quota full). Changes remain in memory; export a backup.'); }
}
/** Return the original untrusted bytes-as-text without parsing, executing or deleting them. */
export function readRecoveryBackup(storage?: StorageLike): string | null {
  try { return (storage ?? browserStorage()).getItem(RECOVERY_KEY); }
  catch { reject('Recovery backup is unavailable because browser storage cannot be read. Original data was not changed.'); }
}
function snapshotAll(state: AppState, recipes: Recipe[], at: string): RecipeSnapshot[] {
  return recipes.map(recipe => snapshotRecipe(recipe, state.ingredients, state.profile, at));
}
function finish(state: AppState): AppState { validateState(state); return structuredClone(state); }
export function changePrice(state: AppState, id: string, price: string, at: string): AppState {
  validateState(state); date(at, 'Change date');
  const ingredient = state.ingredients.find(item => item.id === id); if (!ingredient) reject('Ingredient not found.');
  const affected = state.recipes.filter(recipe => recipe.lines.some(line => line.ingredientId === id));
  const before = snapshotAll(state, affected, at);
  const ingredients = state.ingredients.map(item => item.id === id ? updateIngredientPrice(ingredient, price, at) : item);
  const next = { ...state, ingredients };
  return finish({ ...next, snapshots: [...state.snapshots, ...before, ...snapshotAll(next, affected, at)] });
}
export function saveRecipe(state: AppState, draft: Recipe, at: string): AppState {
  validateState(state); date(at, 'Save date'); recipeShape(draft);
  const existing = state.recipes.find(recipe => recipe.id === draft.id);
  if (existing && Date.parse(at) < Date.parse(existing.updatedAt)) reject('Recipe changes must be chronological.');
  const recipe = structuredClone({ ...draft, version: existing ? existing.version + 1 : 1, updatedAt: at });
  calculateRecipe(recipe, state.ingredients, state.profile);
  const before = existing ? snapshotAll(state, [existing], at) : [];
  const recipes = existing ? state.recipes.map(item => item.id === recipe.id ? recipe : item) : [...state.recipes, recipe];
  return finish({ ...state, recipes, snapshots: [...state.snapshots, ...before, ...snapshotAll(state, [recipe], at)] });
}
export function saveProfile(state: AppState, profile: PricingProfile, at: string): AppState {
  validateState(state); date(at, 'Profile change date'); profileShape(profile);
  const before = snapshotAll(state, state.recipes, at); const next = { ...state, profile: structuredClone(profile) };
  return finish({ ...next, snapshots: [...state.snapshots, ...before, ...snapshotAll(next, next.recipes, at)] });
}
