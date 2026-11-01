import type { Clothing } from '@clozy/domain';
export const zones = [
  { id: 'tops', label: 'トップス', kind: 'rail', categories: ['トップス'] },
  { id: 'bottoms', label: 'ボトムス', kind: 'rail', categories: ['ボトムス'] },
  { id: 'shoes', label: 'シューズ', kind: 'shelf', categories: ['シューズ'] },
  { id: 'long', label: 'アウター・ワンピース', kind: 'rail', categories: ['アウター', 'ワンピース'] },
  { id: 'accessories', label: 'バッグ・小物', kind: 'shelf', categories: ['バッグ', 'アクセサリー', 'その他'] },
  { id: 'stored', label: '衣替えの収納', kind: 'shelf', categories: [] }
] as const;
export function zoneFor(item: Clothing) {
  return item.archived ? 'stored' : zones.find(z => (z.categories as readonly string[]).includes(item.category))!.id;
}
export function addToOutfit(ids: string[], item: Clothing, all: Clothing[]) {
  const incompatible = item.category === 'ワンピース' ? ['トップス', 'ボトムス', 'ワンピース']
    : ['トップス', 'ボトムス'].includes(item.category) ? [item.category, 'ワンピース'] : [item.category];
  return [...ids.filter(id => { const old = all.find(i => i.id === id); return old && !incompatible.includes(old.category); }), item.id];
}
