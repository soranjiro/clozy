import { describe, it, expect } from 'vitest';
import type { Clothing, Category } from '@clozy/domain';
import { zoneFor, addToOutfit } from './projection';
const item = (id: string, category: Category, archived = false) => ({ id, category, archived } as Clothing);
describe('closet projection', () => {
  it('keeps archived garments out of active rails and gives every category an address', () => {
    expect(zoneFor(item('a', 'トップス'))).toBe('tops');
    expect(zoneFor(item('b', 'ボトムス'))).toBe('bottoms');
    expect(zoneFor(item('c', 'シューズ'))).toBe('shoes');
    expect(zoneFor(item('d', 'ワンピース'))).toBe('long');
    expect(zoneFor(item('e', 'アウター'))).toBe('long');
    for (const c of ['バッグ', 'アクセサリー', 'その他'] as const) expect(zoneFor(item(c, c))).toBe('accessories');
    expect(zoneFor(item('a', 'トップス', true))).toBe('stored');
  });
  it('replaces incompatible outfit slots without losing shoes or retaining deleted references', () => {
    const top = item('t', 'トップス'), pants = item('p', 'ボトムス'), shoe = item('s', 'シューズ'), dress = item('d', 'ワンピース');
    const all = [top, pants, shoe, dress];
    expect(addToOutfit(['t', 'p', 's', 'missing'], dress, all)).toEqual(['s', 'd']);
    expect(addToOutfit(['s', 'd'], top, all)).toEqual(['s', 't']);
    expect(addToOutfit(['s', 't'], top, all)).toEqual(['s', 't']);
  });
});
