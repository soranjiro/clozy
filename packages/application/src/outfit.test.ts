import { describe, expect, it, vi } from 'vitest';
import { ClozyService, parseBackup } from './index';
import type { WardrobeRepository } from './index';
import { createClothing, createWearEntry } from '@clozy/domain';
import type { WearEntry } from '@clozy/domain';
const now = '2026-10-31T00:00:00.000Z';
const id = 'c18ef2e1-1e65-41a2-a342-0065e7baaa00';
const id2 = 'e5f7a38c-707a-4d25-ae82-b47e16f3aba3';
const item = createClothing({ name: 'シャツ', category: 'トップス', brand: '', color: '', size: '', notes: '', favorite: false, seasons: ['春', '秋'], purchasePrice: 3000, sourceUrl: 'https://zozo.jp/', archived: true }, id, now);
function repository() {
  return {
    snapshot: vi.fn(async () => ({ clothing: [], wears: [] })), getImage: vi.fn(async () => undefined),
    saveClothing: vi.fn(async () => {}), deleteClothing: vi.fn(async () => {}), saveWear: vi.fn(async () => {}),
    saveWears: vi.fn(async (_entries: WearEntry[]) => {}), deleteWear: vi.fn(async () => {}), replaceAll: vi.fn(async () => {})
  } satisfies WardrobeRepository;
}
describe('outfit recording and metadata backup', () => {
  it('writes the whole outfit in one repository operation without duplicate items', async () => {
    const repo = repository();
    const service = new ClozyService(repo);
    await service.recordOutfit([item, item], '2026-10-31', []);
    expect(repo.saveWears).toHaveBeenCalledTimes(1);
    expect(repo.saveWears.mock.calls[0]?.[0]).toHaveLength(1);
  });
  it('does not recreate existing records and rejects invalid dates before writing', async () => {
    const repo = repository(); const service = new ClozyService(repo);
    await service.recordOutfit([item], '2026-10-31', [createWearEntry(id, '2026-10-31', id2, now)]);
    expect(repo.saveWears).toHaveBeenCalledWith([]);
    await expect(service.recordOutfit([item], '2026-02-30', [])).rejects.toThrow();
    expect(repo.saveWears).toHaveBeenCalledTimes(1);
  });
  it('retains seasons, storage status, source URL and price across backup parsing', () => {
    const restored = parseBackup({ version: 1, clothing: [item], wears: [], images: [] });
    expect(restored.snapshot.clothing[0]).toEqual(item);
  });
});
