import { describe, expect, it } from 'vitest';
import { calculateRecipe } from '../src/domain';
import { changePrice, createDemoState, loadState, MAX_STATE_LENGTH, readRecoveryBackup, RECOVERY_KEY, saveProfile, saveRecipe, saveState, STORAGE_KEY, validateState, type StorageLike } from '../src/storage/repository';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  failWrites = false;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failWrites) throw new Error('QuotaExceeded'); this.values.set(key, value); }
}
const at = '2026-10-28T10:00:00.000Z';

describe('versioned local repository', () => {
  it('clones fixtures and persists a reload without changing decimals', () => {
    const first = createDemoState(); const second = createDemoState();
    first.ingredients[0].name = 'Edited'; expect(second.ingredients[0].name).not.toBe('Edited');
    const storage = new MemoryStorage(); saveState(first, storage);
    expect(loadState(storage)).toEqual({ state: first });
  });
  it('opens a clean demo only when no state exists', () => {
    const storage = new MemoryStorage(); expect(loadState(storage)).toEqual({ state: createDemoState() });
    expect(storage.values.size).toBe(0);
  });
  it('preserves corrupt raw JSON before allowing replacement', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEY, '{broken');
    const loaded = loadState(storage); expect(loaded.warning).toContain('preserved');
    expect(storage.getItem(STORAGE_KEY)).toBe('{broken'); expect(storage.getItem(RECOVERY_KEY)).toBe('{broken');
    saveState(loaded.state, storage); expect(loadState(storage).warning).toBeUndefined();
    expect(storage.getItem(RECOVERY_KEY)).toBe('{broken');
  });
  it('blocks overwriting a corrupt original when recovery cannot be written', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEY, '{broken'); storage.failWrites = true;
    expect(loadState(storage).warning).toContain('recovery blocked');
    expect(() => saveState(createDemoState(), storage)).toThrow();
    expect(storage.getItem(STORAGE_KEY)).toBe('{broken');
  });
  it('does not replace an older different recovery backup', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEY, 'broken again'); storage.setItem(RECOVERY_KEY, 'first broken');
    expect(loadState(storage).warning).toContain('recovery blocked'); expect(() => saveState(createDemoState(), storage)).toThrow('different recovery');
    expect(storage.getItem(STORAGE_KEY)).toBe('broken again'); expect(storage.getItem(RECOVERY_KEY)).toBe('first broken');
  });
  it('surfaces normal storage quota failures', () => {
    const storage = new MemoryStorage(); storage.failWrites = true;
    expect(() => saveState(createDemoState(), storage)).toThrow('quota full');
  });
  it('exports the exact original recovery text without parsing or deleting it', () => {
    const storage = new MemoryStorage(); const raw = '{corrupted}\n<script>untrusted()</script>\nБрашно';
    storage.setItem(STORAGE_KEY, raw); loadState(storage);
    expect(readRecoveryBackup(storage)).toBe(raw); expect(storage.getItem(STORAGE_KEY)).toBe(raw); expect(storage.getItem(RECOVERY_KEY)).toBe(raw);
  });
  it('returns null for no recovery record and reports inaccessible storage without mutation', () => {
    expect(readRecoveryBackup(new MemoryStorage())).toBeNull();
    const inaccessible: StorageLike = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('Must not write'); } };
    expect(() => readRecoveryBackup(inaccessible)).toThrow('Recovery backup is unavailable');
  });
  it('preserves unsupported future schema for explicit migration', () => {
    const storage = new MemoryStorage(); const raw = JSON.stringify({ ...createDemoState(), schemaVersion: 2 }); storage.setItem(STORAGE_KEY, raw);
    expect(loadState(storage).warning).toContain('preserved'); expect(storage.getItem(RECOVERY_KEY)).toBe(raw);
  });
  it('rejects duplicate IDs, unknown references and malformed scalar types', () => {
    const duplicate = createDemoState(); duplicate.ingredients.push(structuredClone(duplicate.ingredients[0])); expect(() => validateState(duplicate)).toThrow('Duplicate');
    const unknown = createDemoState(); unknown.recipes[0].lines[0].ingredientId = 'missing'; expect(() => validateState(unknown)).toThrow('Missing ingredient');
    const wrong = { ...createDemoState(), locale: ['bg'] }; expect(() => validateState(wrong)).toThrow('Locale');
    const malformed = createDemoState() as unknown as { ingredients: { name: unknown }[] }; malformed.ingredients[0].name = 42; expect(() => validateState(malformed)).toThrow('name');
  });
  it('rejects oversized histories and nonchronological records', () => {
    const state = createDemoState(); state.ingredients[0].priceHistory = Array.from({ length: 2001 }, () => ({ price: '2.40', at })); expect(() => validateState(state)).toThrow('at most 2000');
    const reversed = createDemoState(); reversed.ingredients[0].priceHistory.reverse(); expect(() => validateState(reversed)).toThrow('chronological');
  });
  it('compares price-history consistency without binary floating-point coercion', () => {
    const state = createDemoState(); state.ingredients[0].packPrice = '9007199254740992';
    state.ingredients[0].priceHistory.at(-1)!.price = '9007199254740993';
    expect(() => validateState(state)).toThrow('Current price');
    state.ingredients[0].packPrice = '2.40'; state.ingredients[0].priceHistory.at(-1)!.price = '2.4';
    expect(() => validateState(state)).not.toThrow();
  });
  it('enforces the total serialized size limit before parsing', () => {
    const storage = new MemoryStorage(); const raw = ' '.repeat(MAX_STATE_LENGTH + 1); storage.setItem(STORAGE_KEY, raw);
    expect(loadState(storage).warning).toContain('preserved'); expect(storage.getItem(RECOVERY_KEY)).toBe(raw);
  });
});

describe('immutable mutation snapshots', () => {
  it('captures before and after all linked recipes and leaves previous state intact', () => {
    const state = createDemoState(); const original = structuredClone(state); const affected = state.recipes.filter(r => r.lines.some(l => l.ingredientId === 'flour'));
    const next = changePrice(state, 'flour', '3.60', at); expect(state).toEqual(original);
    expect(next.snapshots).toHaveLength(affected.length * 2); expect(next.ingredients[0].priceHistory.at(-1)).toEqual({ price: '3.60', at });
    for (let i = 0; i < affected.length; i++) {
      expect(next.snapshots[i].cost).toEqual(calculateRecipe(affected[i], state.ingredients, state.profile));
      expect(next.snapshots[i + affected.length].cost).toEqual(calculateRecipe(affected[i], next.ingredients, next.profile));
    }
    next.ingredients[0].name = 'Later edit'; expect(next.snapshots[0].ingredients.find(i => i.id === 'flour')?.name).toBe(original.ingredients[0].name);
  });
  it('roundtrips historical snapshots and rejects altered historical totals', () => {
    const state = changePrice(createDemoState(), 'flour', '3.60', at); const storage = new MemoryStorage(); saveState(state, storage);
    expect(loadState(storage).state.snapshots).toEqual(state.snapshots);
    state.snapshots[0].cost.totalCostPerPortion = '0'; expect(() => validateState(state)).toThrow('Historical calculation mismatch');
  });
  it('rejects invalid prices, unknown ingredients and backdated price history', () => {
    const state = createDemoState(); expect(() => changePrice(state, 'missing', '4', at)).toThrow('not found');
    expect(() => changePrice(state, 'flour', '-1', at)).toThrow(); expect(() => changePrice(state, 'flour', '4', '2020-01-01T00:00:00Z')).toThrow('chronological');
  });
  it('increments an edited recipe version and preserves old and new recipe snapshots', () => {
    const state = createDemoState(); const draft = structuredClone(state.recipes[0]); draft.salePrice = '4.50';
    const next = saveRecipe(state, draft, at); expect(next.recipes[0].version).toBe(2); expect(next.recipes[0].updatedAt).toBe(at); expect(state.recipes[0].salePrice).toBe('2.80');
    expect(next.snapshots.map(s => s.recipe.salePrice)).toEqual(['2.80', '4.50']); expect(next.snapshots.map(s => s.recipe.version)).toEqual([1, 2]);
  });
  it('creates new recipes at version 1 and records one initial snapshot', () => {
    const state = createDemoState(); const draft = { ...structuredClone(state.recipes[0]), id: 'new', name: 'New', version: 99 };
    const next = saveRecipe(state, draft, at); expect(next.recipes.at(-1)?.version).toBe(1); expect(next.snapshots).toHaveLength(1);
  });
  it('changing VAT profile snapshots both accounting assumptions without mutating history', () => {
    const state = createDemoState(); const next = saveProfile(state, { ...state.profile, saleVatRate: '20', inputVatRecoverable: true }, at);
    expect(next.snapshots).toHaveLength(state.recipes.length * 2); expect(next.snapshots[0].profile.saleVatRate).toBe('0'); expect(next.snapshots[state.recipes.length].profile.saleVatRate).toBe('20');
    expect(state.profile.saleVatRate).toBe('0'); expect(next.snapshots[0].cost.revenuePerPortion).not.toBe(next.snapshots[state.recipes.length].cost.revenuePerPortion);
  });
});
