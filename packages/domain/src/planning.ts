import { SEASONS } from './model';
import type { Category, Clothing, Season, WearEntry } from './model';
import { getWearCounts, validDate } from './rules';

export function seasonForMonth(month: number): Season {
  return month >= 3 && month <= 5 ? '春' : month >= 6 && month <= 8 ? '夏' : month >= 9 && month <= 11 ? '秋' : '冬';
}
export function inSeason(item: Clothing, season: Season): boolean {
  return (item.seasons ?? SEASONS).includes(season);
}
export interface OutfitSuggestion { items: Clothing[]; missing: Category[] }
// Transparent, local rules, not AI/style/weather inference. Rotate within least-worn groups.
export function suggestOutfit(items: Clothing[], wears: WearEntry[], season: Season, date: string, rotation = 0, layered = false): OutfitSuggestion {
  if (!validDate(date)) throw new Error('日付が不正です');
  const active = items.filter(item => !item.archived && inSeason(item, season));
  const past = wears.filter(w => w.date <= date);
  const counts = getWearCounts(past);
  const last = new Map<string, string>();
  for (const wear of past) if ((last.get(wear.clothingId) ?? '') < wear.date) last.set(wear.clothingId, wear.date);
  const picked: Clothing[] = [];
  const missing: Category[] = [];
  function choose(category: Category): Clothing | undefined {
    const candidates = active.filter(i => i.category === category).sort((a, b) =>
      (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) ||
      (last.get(a.id) ?? '').localeCompare(last.get(b.id) ?? '') ||
      Number(b.favorite) - Number(a.favorite) || a.id.localeCompare(b.id));
    return candidates.length ? candidates[((rotation % candidates.length) + candidates.length) % candidates.length] : undefined;
  }
  const dress = choose('ワンピース');
  const top = choose('トップス');
  const bottom = choose('ボトムス');
  if (dress && ((!top || !bottom) || rotation % 2 === 1)) picked.push(dress);
  else {
    if (top) picked.push(top); else missing.push('トップス');
    if (bottom) picked.push(bottom); else missing.push('ボトムス');
  }
  const shoes = choose('シューズ');
  if (shoes) picked.push(shoes); else missing.push('シューズ');
  if (layered) { const outer = choose('アウター'); if (outer) picked.push(outer); else missing.push('アウター'); }
  return { items: picked, missing };
}
export function wardrobeAnalysis(items: Clothing[], wears: WearEntry[]) {
  const counts = getWearCounts(wears);
  const active = items.filter(item => !item.archived);
  const unworn = active.filter(item => !counts.has(item.id));
  const priced = items.filter((item): item is Clothing & { purchasePrice: number } => item.purchasePrice !== undefined);
  return {
    active, unworn, archivedCount: items.length - active.length,
    totalPurchasePrice: priced.reduce((sum, item) => sum + item.purchasePrice, 0), pricedCount: priced.length,
    costPerWear: priced.filter(item => counts.has(item.id)).map(item => ({ item, cost: item.purchasePrice / counts.get(item.id)! }))
      .sort((a, b) => b.cost - a.cost)
  };
}
export function zozoSearchUrl(query: string): string {
  return 'https://zozo.jp/search/?p_keyv=' + encodeURIComponent(query.trim());
}
