import type { ImageRecord, Snapshot, WardrobeRepository } from '@clozy/application';
import type { Clothing, WearEntry } from '@clozy/domain';

const DB_NAME = 'clozy-local';
const STORES = ['clothing', 'wears', 'images'] as const;

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('データを読み取れませんでした'));
  });
}
function transact(db: IDBDatabase, stores: string[], action: (tx: IDBTransaction) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('保存に失敗しました'));
    tx.onabort = () => reject(tx.error ?? new Error('保存が中断されました'));
    try { action(tx); } catch (error) { tx.abort(); reject(error); }
  });
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) { reject(new Error('このブラウザではローカル保存を利用できません')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error ?? new Error('保存先を開けませんでした'));
    req.onblocked = () => reject(new Error('別のタブを閉じて再読み込みしてください'));
  });
}

export class IndexedDbRepository implements WardrobeRepository {
  private readonly db: Promise<IDBDatabase> = openDatabase();

  async snapshot(): Promise<Snapshot> {
    const db = await this.db;
    const tx = db.transaction(['clothing', 'wears'], 'readonly');
    const [clothing, wears] = await Promise.all([
      request(tx.objectStore('clothing').getAll() as IDBRequest<Clothing[]>),
      request(tx.objectStore('wears').getAll() as IDBRequest<WearEntry[]>)
    ]);
    return { clothing, wears };
  }
  async getImage(id: string): Promise<Blob | undefined> {
    const db = await this.db;
    const row = await request(db.transaction('images', 'readonly').objectStore('images').get(id) as IDBRequest<ImageRecord | undefined>);
    return row?.blob;
  }
  async saveClothing(item: Clothing, image?: Blob, removeOldImage = false): Promise<void> {
    const db = await this.db;
    await transact(db, ['clothing', 'images'], tx => {
      tx.objectStore('clothing').put(item);
      if (removeOldImage) tx.objectStore('images').delete(item.id);
      if (image) tx.objectStore('images').put({ id: item.id, blob: image });
    });
  }
  async deleteClothing(id: string): Promise<void> {
    const db = await this.db;
    await transact(db, ['clothing', 'images', 'wears'], tx => {
      tx.objectStore('clothing').delete(id);
      tx.objectStore('images').delete(id);
      const wearStore = tx.objectStore('wears');
      const req = wearStore.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        if ((cursor.value as WearEntry).clothingId === id) cursor.delete();
        cursor.continue();
      };
    });
  }
  async saveWear(entry: WearEntry): Promise<void> {
    const db = await this.db;
    await transact(db, ['wears'], tx => { tx.objectStore('wears').put(entry); });
  }
  async saveWears(entries: WearEntry[]): Promise<void> {
    const db = await this.db;
    await transact(db, ['wears'], tx => { for (const entry of entries) tx.objectStore('wears').put(entry); });
  }
  async deleteWear(id: string): Promise<void> {
    const db = await this.db;
    await transact(db, ['wears'], tx => { tx.objectStore('wears').delete(id); });
  }
  async replaceAll(data: Snapshot, images: ImageRecord[]): Promise<void> {
    const db = await this.db;
    await transact(db, [...STORES], tx => {
      for (const name of STORES) tx.objectStore(name).clear();
      for (const item of data.clothing) tx.objectStore('clothing').put(item);
      for (const wear of data.wears) tx.objectStore('wears').put(wear);
      for (const image of images) tx.objectStore('images').put(image);
    });
  }
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 1600;
export async function processPhoto(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_UPLOAD_BYTES || file.size === 0) {
    throw new Error('JPEG・PNG・WebP形式で10MB以下の画像を選択してください');
  }
  const url = URL.createObjectURL(file);
  try {
    const picture = new Image();
    picture.decoding = 'async';
    picture.src = url;
    try { await picture.decode(); } catch { throw new Error('画像を開けませんでした。破損していないJPEG・PNG・WebPの写真を選び直してください'); }
    if (!picture.naturalWidth || !picture.naturalHeight || picture.naturalWidth * picture.naturalHeight > 40_000_000) {
      throw new Error('画像の解像度が大きすぎます');
    }
    const scale = Math.min(1, MAX_EDGE / Math.max(picture.naturalWidth, picture.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(picture.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(picture.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('画像を処理できませんでした');
    ctx.drawImage(picture, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.82));
    if (!blob || blob.size > 5 * 1024 * 1024) throw new Error('画像を圧縮できませんでした');
    return blob;
  } finally { URL.revokeObjectURL(url); }
}
