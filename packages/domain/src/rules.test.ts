import { describe, expect, it } from 'vitest';
import { createClothing, createWearEntry, filterClothing, getWearCounts, updateClothing, validDate, validateClothing } from './rules';
import type { ClothingInput } from './model';

const id = 'c18ef2e1-1e65-41a2-a342-0065e7baaa00';
const id2 = 'e5f7a38c-707a-4d25-ae82-b47e16f3aba3';
const now = '2026-10-31T00:00:00.000Z';
const base: ClothingInput = {
  name: '  リネンシャツ  ', category: 'トップス', brand: '', color: '白', size: 'M', notes: '', favorite: false
};
describe('wardrobe domain', () => {
  it('allows multiline notes but rejects control characters', () => {
    expect(createClothing({ ...base, notes: '購入時のメモ\n洗濯は手洗い\t推奨' }, id, now).notes).toContain('\n');
    expect(() => createClothing({ ...base, notes: 'bad\u0000note' }, id, now)).toThrow();
    expect(() => createClothing({ ...base, name: 'bad\nname' }, id, now)).toThrow();
  });
  it('matches full-width text and multiple terms across fields', () => {
    const item = createClothing({ ...base, brand: 'ＵＮＩＱＬＯ', size: 'Ｍ' }, id, now);
    expect(filterClothing([item], 'uniqlo　白 m', 'すべて', false)).toHaveLength(1);
    expect(filterClothing([item], 'uniqlo 黒', 'すべて', false)).toHaveLength(0);
    expect(filterClothing([item], '　 ', 'すべて', false)).toHaveLength(1);
  });
  it('normalizes values and maintains identity on update', () => {
    const item = createClothing(base, id, now);
    expect(item.name).toBe('リネンシャツ');
    const next = updateClothing(item, { ...base, name: '秋のシャツ' }, now, 'set');
    expect(next.id).toBe(id);
    expect(next.imageId).toBe(id);
  });
  it('rejects XSS-adjacent control text and invalid enum/ids', () => {
    expect(() => createClothing({ ...base, name: '\u0000bad' }, id, now)).toThrow();
    expect(() => validateClothing({ ...createClothing(base, id, now), category: 'javascript:' })).toThrow();
    expect(() => createClothing(base, 'not-an-id', now)).toThrow();
  });
  it('supports search, category and favorites filter', () => {
    const items = [createClothing(base, id, now), createClothing({ ...base, name: '靴', category: 'シューズ', favorite: true }, id2, now)];
    expect(filterClothing(items, 'シャツ', 'すべて', false)).toHaveLength(1);
    expect(filterClothing(items, '', 'シューズ', true)).toHaveLength(1);
  });
});
describe('wear journal domain', () => {
  it('rejects non-existent calendar dates', () => {
    expect(validDate('2026-02-29')).toBe(false);
    expect(validDate('2028-02-29')).toBe(true);
    expect(() => createWearEntry(id, '2026-02-29', id2, now)).toThrow();
  });
  it('counts wears by garment', () => {
    const wear = createWearEntry(id, '2026-10-31', id2, now);
    expect(getWearCounts([wear, wear]).get(id)).toBe(2);
  });
});
