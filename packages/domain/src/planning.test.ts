import { describe, expect, it } from 'vitest';
import { createClothing, createWearEntry, validateClothing } from './rules';
import { inSeason, seasonForMonth, suggestOutfit, wardrobeAnalysis, zozoSearchUrl } from './planning';
import type { Category, ClothingInput } from './model';
const now = '2026-10-31T00:00:00.000Z';
function item(n: number, category: Category, extra: Partial<ClothingInput> = {}) {
  return createClothing({ name: category, category, brand: '', color: '', size: '', notes: '', favorite: false, ...extra }, `c18ef2e1-1e65-41a2-a342-${String(n).padStart(12, '0')}`, now);
}
describe('wardrobe seasons and shopping metadata', () => {
  it('keeps legacy data usable with all seasons and no archive', () => {
    const legacy = item(1, 'トップス');
    const { seasons: _seasons, archived: _archived, ...raw } = legacy;
    expect(validateClothing(raw).seasons).toEqual(['春', '夏', '秋', '冬']);
    expect(validateClothing(raw).archived).toBe(false);
    expect(inSeason(raw, '冬')).toBe(true);
    expect([1, 3, 6, 9, 12].map(seasonForMonth)).toEqual(['冬', '春', '夏', '秋', '冬']);
  });
  it('validates season, archive, HTTPS URL and whole-yen price fields', () => {
    expect(() => item(1, 'トップス', { seasons: [] })).toThrow();
    expect(() => item(1, 'トップス', { seasons: ['春', '春'] })).toThrow();
    expect(() => item(1, 'トップス', { sourceUrl: 'javascript:alert(1)' })).toThrow();
    expect(() => item(1, 'トップス', { sourceUrl: 'https://user:secret@zozo.jp/' })).toThrow();
    expect(() => item(1, 'トップス', { purchasePrice: -1 })).toThrow();
    expect(() => item(1, 'トップス', { purchasePrice: 1.5 })).toThrow();
    expect(item(1, 'トップス', { sourceUrl: 'https://zozo.jp/shop/example/', purchasePrice: 0 }).purchasePrice).toBe(0);
    expect(() => validateClothing({ ...item(1, 'トップス'), archived: 'false' })).toThrow();
  });
});
describe('local outfit suggestions', () => {
  it('excludes stored and out-of-season garments', () => {
    const suggestion = suggestOutfit([item(1, 'トップス', { archived: true }), item(2, 'ボトムス', { seasons: ['夏'] }), item(3, 'シューズ')], [], '冬', '2026-10-31');
    expect(suggestion.items.map(i => i.category)).toEqual(['シューズ']);
    expect(suggestion.missing).toEqual(['トップス', 'ボトムス']);
  });
  it('uses one-piece instead of demanding both top and bottom', () => {
    const suggestion = suggestOutfit([item(1, 'ワンピース'), item(2, 'シューズ')], [], '春', '2026-10-31');
    expect(suggestion.missing).toEqual([]);
    expect(suggestion.items.map(i => i.category)).toEqual(['ワンピース', 'シューズ']);
  });
  it('prefers unworn items and ignores future wears when planning the past', () => {
    const a = item(1, 'トップス'); const b = item(2, 'トップス');
    const wear = createWearEntry(a.id, '2026-10-30', item(9, 'その他').id, now);
    expect(suggestOutfit([a, b], [wear], '秋', '2026-10-31').items[0]?.id).toBe(b.id);
    expect(suggestOutfit([a, b], [wear], '秋', '2026-10-01').items[0]?.id).toBe(a.id);
    expect(suggestOutfit([a, b], [], '秋', '2026-10-31', 1).items[0]?.id).toBe(b.id);
  });
  it('shows missing outerwear only when requested and handles empty wardrobes', () => {
    expect(suggestOutfit([], [], '冬', '2026-10-31', 0, true).missing).toEqual(['トップス', 'ボトムス', 'シューズ', 'アウター']);
    expect(() => suggestOutfit([], [], '冬', '2026-02-30')).toThrow();
  });
});
describe('wardrobe insights and external search', () => {
  it('handles zero prices, zero wears and archived items without division by zero', () => {
    const a = item(1, 'トップス', { purchasePrice: 3000 });
    const b = item(2, 'トップス', { purchasePrice: 0 });
    const c = item(3, 'アウター', { archived: true });
    const wear = createWearEntry(a.id, '2026-10-31', item(9, 'その他').id, now);
    const analysis = wardrobeAnalysis([a, b, c], [wear]);
    expect(analysis.totalPurchasePrice).toBe(3000);
    expect(analysis.pricedCount).toBe(2);
    expect(analysis.unworn.map(i => i.id)).toEqual([b.id]);
    expect(analysis.archivedCount).toBe(1);
    expect(analysis.costPerWear[0]?.cost).toBe(3000);
    expect(wardrobeAnalysis([], []).costPerWear).toEqual([]);
  });
  it('encodes search terms without allowing URL injection', () => {
    const url = new URL(zozoSearchUrl('シャツ & 白'));
    expect(url.origin).toBe('https://zozo.jp');
    expect(url.searchParams.get('p_keyv')).toBe('シャツ & 白');
  });
});
