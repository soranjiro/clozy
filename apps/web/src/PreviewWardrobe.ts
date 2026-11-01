import type { Clothing, Category, WearEntry } from '@clozy/domain';
import type { Snapshot, WardrobeRepository, ImageRecord } from '@clozy/application';

/** Synthetic, reproducible review data. Never copies a user's private R2 backup. */
const outfits: ReadonlyArray<readonly [Category, string, string, string, number]> = [
  ['アウター', 'ウールチェスターコート', 'キャメル', 'Atelier', 18900],
  ['アウター', 'ネイビージャケット', 'ネイビー', 'Studio', 12900],
  ['アウター', 'ライトトレンチ', 'ベージュ', 'Atelier', 14800],
  ['アウター', 'ブラックブルゾン', 'ブラック', 'Field', 9900],
  ['アウター', 'キルティングコート', 'カーキ', 'Field', 11500],
  ['アウター', 'デニムジャケット', 'インディゴ', 'Studio', 8900],
  ['アウター', 'グレーのカーディガン', 'グレー', 'Daily', 4990],
  ['アウター', 'ショートダウン', 'アイボリー', 'Field', 15900],
  ['アウター', 'ブラウンのレザージャケット', 'ブラウン', 'Atelier', 22900],
  ['トップス', '白いオックスフォードシャツ', 'ホワイト', 'Daily', 3990],
  ['トップス', '黒のクルーネックTシャツ', 'ブラック', 'Daily', 1990],
  ['トップス', 'リネンのストライプシャツ', 'ブルー', 'Studio', 5990],
  ['トップス', '生成りのスウェット', 'アイボリー', 'Field', 4990],
  ['トップス', 'ボーダーカットソー', 'ネイビー', 'Daily', 3490],
  ['トップス', 'モックネックニット', 'ブラウン', 'Atelier', 7900],
  ['トップス', 'グレーのパーカー', 'グレー', 'Field', 5990],
  ['トップス', 'サックスブルーシャツ', 'ブルー', 'Studio', 4490],
  ['トップス', '白のリブニット', 'ホワイト', 'Daily', 3900],
  ['ボトムス', 'ストレートデニム', 'インディゴ', 'Studio', 6900],
  ['ボトムス', '黒のワイドスラックス', 'ブラック', 'Atelier', 8900],
  ['ボトムス', 'ベージュのチノパン', 'ベージュ', 'Daily', 4990],
  ['ボトムス', 'ブラウンのコーデュロイ', 'ブラウン', 'Field', 5990],
  ['ボトムス', 'グレーのテーパードパンツ', 'グレー', 'Studio', 7900],
  ['ボトムス', 'カーキのカーゴパンツ', 'カーキ', 'Field', 6490],
  ['シューズ', '白のローカットスニーカー', 'ホワイト', 'Daily', 7900],
  ['シューズ', '黒のレザーローファー', 'ブラック', 'Atelier', 13900]
];
const itemId = (i: number) => '00000000-0000-4000-8000-' + String(i + 1).padStart(12, '0');
const wearId = (i: number) => '10000000-0000-4000-8000-' + String(i + 1).padStart(12, '0');
const localDate = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

/** Production domain pages are never silently placed into a demo. */
export function isReviewHost(hostname: string): boolean {
  return /^pr-[0-9]+\.clozy\.pages\.dev$/.test(hostname) || hostname === 'localhost' || hostname === '127.0.0.1';
}
export function isPreviewDeployment(hostname: string): boolean {
  return /^pr-[0-9]+\.clozy\.pages\.dev$/.test(hostname);
}
export function previewColor(id: string): string | undefined {
  if (!/^00000000-0000-4000-8000-0{10}(0[1-9]|1[0-9]|2[0-6])$/.test(id)) return undefined;
  const idx = Number(id.slice(-2)) - 1;
  const colors = ['#ab8059','#3c5169','#c7ab8b','#353336','#7e8165','#566c85','#b5b4b4','#e2d8c6','#78513b',
    '#f0e9dc','#34343a','#91aaba','#dfd6c5','#364759','#705344','#7f8086','#afc4ce','#efebe2',
    '#506981','#33343a','#c7ad8e','#79604a','#979797','#7a8065','#ece7d9','#373538'];
  return colors[idx];
}
export function makePreviewSnapshot(today = new Date()): Snapshot {
  const created = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12).toISOString();
  const clothing: Clothing[] = outfits.map(([category, name, color, brand, purchasePrice], index) => ({
    id: itemId(index), name, category, color, brand, purchasePrice,
    size: '', notes: 'プレビュー用の架空の服です', favorite: index % 6 === 0,
    seasons: ['春', '夏', '秋', '冬'], archived: false,
    createdAt: created, updatedAt: created
  }));
  const wears: WearEntry[] = [];
  for (let day = 1; day <= 33; day++) {
    const date = localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - day));
    for (let j = 0; j < 3; j++) {
      const index = (day * 7 + j * 5) % clothing.length;
      wears.push({
        id: wearId(wears.length), clothingId: itemId(index), date,
        createdAt: new Date(date + 'T12:00:00').toISOString()
      });
    }
  }
  return { clothing, wears };
}

/** Completely separate, volatile database. Reload resets the sample; no account backup or upload. */
export class PreviewWardrobeRepository implements WardrobeRepository {
  private data: Snapshot = makePreviewSnapshot();
  private images = new Map<string, Blob>();
  snapshot(): Promise<Snapshot> { return Promise.resolve({ clothing: [...this.data.clothing], wears: [...this.data.wears] }); }
  getImage(id: string): Promise<Blob | undefined> { return Promise.resolve(this.images.get(id)); }
  async saveClothing(item: Clothing, image?: Blob, removeOldImage = false): Promise<void> {
    this.data.clothing = this.data.clothing.filter(c => c.id !== item.id).concat(item);
    if (removeOldImage) this.images.delete(item.id);
    if (image) this.images.set(item.id, image);
  }
  async deleteClothing(id: string): Promise<void> {
    this.data.clothing = this.data.clothing.filter(c => c.id !== id);
    this.data.wears = this.data.wears.filter(w => w.clothingId !== id);
    this.images.delete(id);
  }
  async saveWear(entry: WearEntry): Promise<void> {
    this.data.wears = this.data.wears.filter(w => w.id !== entry.id).concat(entry);
  }
  async saveWears(entries: WearEntry[]): Promise<void> {
    for (const entry of entries) await this.saveWear(entry);
  }
  async deleteWear(id: string): Promise<void> { this.data.wears = this.data.wears.filter(w => w.id !== id); }
  async replaceAll(snapshot: Snapshot, images: ImageRecord[]): Promise<void> {
    this.data = { clothing: [...snapshot.clothing], wears: [...snapshot.wears] };
    this.images = new Map(images.map(x => [x.id, x.blob]));
  }
}
