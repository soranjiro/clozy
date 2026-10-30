import { CATEGORIES, DomainError } from './model';
import type { Category, Clothing, ClothingInput, WearEntry } from './model';

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export function validId(value: unknown): value is string {
  return typeof value === 'string' && idPattern.test(value);
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const d = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function text(value: unknown, label: string, max: number, required = false): string {
  if (typeof value !== 'string') throw new DomainError(label + 'が不正です');
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > max || /[\u0000-\u001f\u007f]/.test(cleaned)) {
    throw new DomainError(label + 'は' + (required ? '1〜' : '0〜') + max + '文字で入力してください');
  }
  return cleaned;
}
function iso(value: unknown): string {
  if (typeof value !== 'string' || !timestampPattern.test(value) || Number.isNaN(Date.parse(value))) {
    throw new DomainError('日時の形式が不正です');
  }
  return value;
}
export function validateClothing(raw: unknown): Clothing {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new DomainError('衣服データが不正です');
  const item = raw as Record<string, unknown>;
  if (!validId(item.id)) throw new DomainError('衣服IDが不正です');
  if (!CATEGORIES.includes(item.category as Category)) throw new DomainError('カテゴリが不正です');
  if (typeof item.favorite !== 'boolean') throw new DomainError('お気に入り設定が不正です');
  if (item.imageId !== undefined && item.imageId !== item.id) throw new DomainError('画像IDが不正です');
  return {
    id: item.id,
    name: text(item.name, '名前', 80, true),
    category: item.category as Category,
    brand: text(item.brand, 'ブランド', 80),
    color: text(item.color, '色', 40),
    size: text(item.size, 'サイズ', 30),
    notes: text(item.notes, 'メモ', 500),
    favorite: item.favorite,
    ...(item.imageId === undefined ? {} : { imageId: item.id }),
    createdAt: iso(item.createdAt),
    updatedAt: iso(item.updatedAt)
  };
}
export function createClothing(input: ClothingInput, id: string, now: string, hasImage = false): Clothing {
  return validateClothing({ ...input, id, createdAt: now, updatedAt: now, ...(hasImage ? { imageId: id } : {}) });
}
export function updateClothing(current: Clothing, input: ClothingInput, now: string, image: 'keep' | 'set' | 'remove'): Clothing {
  return validateClothing({
    ...current, ...input, updatedAt: now,
    imageId: image === 'set' ? current.id : image === 'remove' ? undefined : current.imageId
  });
}
export function validateWearEntry(raw: unknown): WearEntry {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new DomainError('着用履歴が不正です');
  const entry = raw as Record<string, unknown>;
  if (!validId(entry.id) || !validId(entry.clothingId) || !validDate(entry.date)) {
    throw new DomainError('着用履歴のIDまたは日付が不正です');
  }
  return { id: entry.id, clothingId: entry.clothingId, date: entry.date, createdAt: iso(entry.createdAt) };
}
export function createWearEntry(clothingId: string, date: string, id: string, now: string): WearEntry {
  return validateWearEntry({ clothingId, date, id, createdAt: now });
}
export function getWearCounts(wears: WearEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of wears) counts.set(entry.clothingId, (counts.get(entry.clothingId) ?? 0) + 1);
  return counts;
}
export function filterClothing(items: Clothing[], query: string, category: Category | 'すべて', favoritesOnly: boolean): Clothing[] {
  const needle = query.trim().toLocaleLowerCase('ja');
  return items.filter(item =>
    (category === 'すべて' || item.category === category) &&
    (!favoritesOnly || item.favorite) &&
    [item.name, item.category, item.brand, item.color, item.size, item.notes]
      .some(value => value.toLocaleLowerCase('ja').includes(needle))
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
