import {
  createClothing, createWearEntry, DomainError, updateClothing, validId,
  validateClothing, validateWearEntry
} from '@clozy/domain';
import type { Clothing, ClothingInput, WearEntry } from '@clozy/domain';

export interface Snapshot { clothing: Clothing[]; wears: WearEntry[] }
export interface ImageRecord { id: string; blob: Blob }
export interface WardrobeRepository {
  snapshot(): Promise<Snapshot>;
  getImage(id: string): Promise<Blob | undefined>;
  saveClothing(item: Clothing, image?: Blob, removeOldImage?: boolean): Promise<void>;
  setArchived(ids: string[], archived: boolean, updatedAt: string): Promise<void>;
  deleteClothing(id: string): Promise<void>;
  saveWear(entry: WearEntry): Promise<void>;
  saveWears(entries: WearEntry[]): Promise<void>;
  deleteWear(id: string): Promise<void>;
  replaceAll(data: Snapshot, images: ImageRecord[]): Promise<void>;
}
const MAX_BACKUP_BYTES = 75 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CLOTHES = 2000;
const MAX_WEARS = 20000;

export interface Backup {
  version: 1;
  exportedAt: string;
  clothing: Clothing[];
  wears: WearEntry[];
  images: { id: string; type: string; data: string }[];
}
function isAllowedBlob(type: string): boolean { return type === 'image/webp' || type === 'image/jpeg' || type === 'image/png'; }
function asBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('画像を読み取れませんでした'));
    reader.readAsDataURL(blob);
  });
}
function fromBase64(data: string, type: string): Blob {
  if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(data) || data.length % 4 !== 0) throw new DomainError('画像データの形式が不正です');
  let bytes: Uint8Array;
  try {
    const binary = atob(data);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } catch { throw new DomainError('画像データを復号できません'); }
  if (bytes.length > MAX_IMAGE_BYTES) throw new DomainError('画像サイズが上限を超えています');
  return new Blob([bytes.buffer as ArrayBuffer], { type });
}
export function parseBackup(raw: unknown): { snapshot: Snapshot; images: ImageRecord[] } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new DomainError('バックアップの形式が不正です');
  const value = raw as Record<string, unknown>;
  if (value.version !== 1 || !Array.isArray(value.clothing) || !Array.isArray(value.wears) || !Array.isArray(value.images)) {
    throw new DomainError('非対応のバックアップ形式です');
  }
  if (value.clothing.length > MAX_CLOTHES || value.wears.length > MAX_WEARS || value.images.length > MAX_CLOTHES) {
    throw new DomainError('バックアップ件数が上限を超えています');
  }
  const clothing = value.clothing.map(validateClothing);
  const wears = value.wears.map(validateWearEntry);
  const ids = new Set(clothing.map(item => item.id));
  if (ids.size !== clothing.length) throw new DomainError('衣服IDが重複しています');
  const wearIds = new Set<string>();
  const wearPairs = new Set<string>();
  for (const wear of wears) {
    const key = wear.clothingId + '|' + wear.date;
    if (!ids.has(wear.clothingId) || wearIds.has(wear.id) || wearPairs.has(key)) throw new DomainError('着用履歴に矛盾があります');
    wearIds.add(wear.id); wearPairs.add(key);
  }
  const imageIds = new Set<string>();
  const images: ImageRecord[] = value.images.map(rawImage => {
    if (!rawImage || typeof rawImage !== 'object' || Array.isArray(rawImage)) throw new DomainError('画像データが不正です');
    const image = rawImage as Record<string, unknown>;
    if (!validId(image.id) || !ids.has(image.id) || imageIds.has(image.id) || !isAllowedBlob(image.type as string) || typeof image.data !== 'string' || image.data.length > MAX_IMAGE_BYTES * 2) {
      throw new DomainError('画像のID・形式・容量が不正です');
    }
    imageIds.add(image.id);
    return { id: image.id, blob: fromBase64(image.data, image.type as string) };
  });
  for (const item of clothing) {
    if ((item.imageId !== undefined) !== imageIds.has(item.id)) throw new DomainError('衣服と画像の参照が一致しません');
  }
  return { snapshot: { clothing, wears }, images };
}
export class ClozyService {
  constructor(private readonly repo: WardrobeRepository) {}

  list(): Promise<Snapshot> { return this.repo.snapshot(); }
  image(id: string): Promise<Blob | undefined> { return this.repo.getImage(id); }

  async add(input: ClothingInput, image?: Blob): Promise<void> {
    const item = createClothing(input, crypto.randomUUID(), new Date().toISOString(), Boolean(image));
    await this.repo.saveClothing(item, image);
  }
  async edit(current: Clothing, input: ClothingInput, photo: 'keep' | 'set' | 'remove', image?: Blob): Promise<void> {
    if ((photo === 'set') !== Boolean(image)) throw new DomainError('画像更新の指定が不正です');
    const item = updateClothing(current, input, new Date().toISOString(), photo);
    await this.repo.saveClothing(item, image, photo === 'remove');
  }
  async favorite(current: Clothing): Promise<void> {
    await this.repo.saveClothing(validateClothing({ ...current, favorite: !current.favorite, updatedAt: new Date().toISOString() }));
  }
  async archive(items: Clothing[], archived: boolean): Promise<void> {
    const ids = [...new Set(items.map(item => item.id))];
    if (ids.some(id => !validId(id))) throw new DomainError('衣服IDが不正です');
    await this.repo.setArchived(ids, archived, new Date().toISOString());
  }
  remove(id: string): Promise<void> { return this.repo.deleteClothing(id); }
  clearAll(): Promise<void> { return this.repo.replaceAll({ clothing: [], wears: [] }, []); }
  async recordOutfit(items: Clothing[], date: string, existing: WearEntry[]): Promise<void> {
    const ids = new Set(existing.filter(w => w.date === date).map(w => w.clothingId));
    const entries = items.filter(item => { if (ids.has(item.id)) return false; ids.add(item.id); return true; })
      .map(item => createWearEntry(item.id, date, crypto.randomUUID(), new Date().toISOString()));
    await this.repo.saveWears(entries);
  }
  async toggleWear(item: Clothing, date: string, existing: WearEntry[]): Promise<void> {
    const found = existing.find(x => x.clothingId === item.id && x.date === date);
    if (found) return this.repo.deleteWear(found.id);
    const wear = createWearEntry(item.id, date, crypto.randomUUID(), new Date().toISOString());
    await this.repo.saveWear(wear);
  }
  async exportBackup(): Promise<string> {
    const snapshot = await this.repo.snapshot();
    const images: Backup['images'] = [];
    for (const item of snapshot.clothing) {
      if (!item.imageId) continue;
      const blob = await this.repo.getImage(item.id);
      if (!blob || !isAllowedBlob(blob.type) || blob.size > MAX_IMAGE_BYTES) throw new DomainError('保存画像をバックアップできません');
      images.push({ id: item.id, type: blob.type, data: await asBase64(blob) });
    }
    const backup: Backup = { version: 1, exportedAt: new Date().toISOString(), ...snapshot, images };
    const json = JSON.stringify(backup);
    if (new Blob([json]).size > MAX_BACKUP_BYTES) throw new DomainError('バックアップが75MBを超えています。写真や不要な記録を整理してください');
    return json;
  }
  async importBackup(file: File): Promise<void> {
    if (file.size > MAX_BACKUP_BYTES) throw new DomainError('バックアップファイルは75MB以下にしてください');
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); }
    catch { throw new DomainError('JSONファイルを読み取れませんでした'); }
    const { snapshot, images } = parseBackup(parsed);
    await this.repo.replaceAll(snapshot, images);
  }
}
