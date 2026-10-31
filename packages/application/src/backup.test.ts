import { describe, expect, it } from 'vitest';
import { parseBackup } from './index';
import { createClothing, createWearEntry } from '@clozy/domain';

const id = 'c18ef2e1-1e65-41a2-a342-0065e7baaa00';
const wid = 'e5f7a38c-707a-4d25-ae82-b47e16f3aba3';
const now = '2026-10-31T00:00:00.000Z';
const item = createClothing({ name: 'コート', category: 'アウター', brand: '', color: '', size: '', notes: '', favorite: false }, id, now);
describe('backup boundary', () => {
  it('rejects orphan images, missing images and duplicate wear dates', () => {
    expect(() => parseBackup({ version: 1, clothing: [], wears: [], images: [{ id, type: 'image/webp', data: 'AAAA' }] })).toThrow();
    expect(() => parseBackup({ version: 1, clothing: [{ ...item, imageId: id }], wears: [], images: [] })).toThrow();
    const wear = createWearEntry(id, '2026-10-31', wid, now);
    expect(() => parseBackup({ version: 1, clothing: [item], wears: [wear, { ...wear, id }], images: [] })).toThrow();
  });
  it('accepts valid portable data', () => {
    expect(parseBackup({ version: 1, clothing: [item], wears: [createWearEntry(id, '2026-10-31', wid, now)], images: [] }).snapshot.clothing).toHaveLength(1);
  });
  it('rejects invalid references before any DB writes', () => {
    expect(() => parseBackup({ version: 1, clothing: [], wears: [createWearEntry(id, '2026-10-31', wid, now)], images: [] })).toThrow();
  });
  it('rejects duplicate IDs and unsafe image types', () => {
    expect(() => parseBackup({ version: 1, clothing: [item, item], wears: [], images: [] })).toThrow();
    expect(() => parseBackup({ version: 1, clothing: [{ ...item, imageId: id }], wears: [], images: [{ id, type: 'image/svg+xml', data: '' }] })).toThrow();
  });
});
