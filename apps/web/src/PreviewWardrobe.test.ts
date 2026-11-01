import { describe, it, expect } from 'vitest';
import { makePreviewSnapshot, PreviewWardrobeRepository, isReviewHost, isPreviewDeployment, previewColor } from './PreviewWardrobe';
import { validChatGptProjectUrl, draftUrl, draftPrompt } from './ChatGptDraft';
import { validateClothing, validateWearEntry } from '@clozy/domain';

describe('preview fixtures are isolated and representative', () => {
  it('creates exactly the verified aggregate distribution, without any real personal data', () => {
    const sample = makePreviewSnapshot(new Date(2026, 10, 1, 12));
    expect(sample.clothing).toHaveLength(26);
    expect(sample.wears).toHaveLength(99);
    for (const [category, count] of [['アウター', 9], ['トップス', 9], ['ボトムス', 6], ['シューズ', 2]] as const) {
      expect(sample.clothing.filter(c => c.category === category)).toHaveLength(count);
    }
    expect(new Set(sample.wears.map(w => w.clothingId + ':' + w.date)).size).toBe(99);
    sample.clothing.forEach(validateClothing);
    sample.wears.forEach(validateWearEntry);
    expect(previewColor(sample.clothing[0]!.id)).toMatch(/^#[a-f0-9]{6}$/);
    expect(previewColor('unrelated')).toBeUndefined();
  });
  it('never silently shows a synthetic wardrobe in production', () => {
    expect(isReviewHost('pr-123.clozy.pages.dev')).toBe(true);
    expect(isPreviewDeployment('pr-123.clozy.pages.dev')).toBe(true);
    expect(isReviewHost('clozy.pages.dev')).toBe(false);
    expect(isPreviewDeployment('clozy.pages.dev')).toBe(false);
    expect(isReviewHost('localhost')).toBe(true);
    expect(isPreviewDeployment('localhost')).toBe(false);
  });
  it('keeps demo edits and wear records in volatile memory only', async () => {
    const store = new PreviewWardrobeRepository();
    const initial = await store.snapshot();
    await store.deleteClothing(initial.clothing[0]!.id);
    expect((await store.snapshot()).clothing).toHaveLength(25);
    expect((await new PreviewWardrobeRepository().snapshot()).clothing).toHaveLength(26);
  });
});
describe('ChatGPT prompt transfer', () => {
  it('only opens known ChatGPT project links', () => {
    expect(validChatGptProjectUrl('https://chatgpt.com/g/g-p-abc-clozy')).toBe('https://chatgpt.com/g/g-p-abc-clozy');
    expect(validChatGptProjectUrl('https://chatgpt.com.evil.example/g/g-p-abc')).toBeNull();
    expect(validChatGptProjectUrl('javascript:alert(1)')).toBeNull();
    expect(validChatGptProjectUrl('https://chatgpt.com/?q=something')).toBeNull();
    expect(validChatGptProjectUrl('https://chatgpt.com/g/g-p-abc?token=x')).toBeNull();
  });
  it('builds bounded user-reviewable drafts without network calls', () => {
    const clothes = makePreviewSnapshot().clothing;
    const p = draftPrompt(clothes.slice(0, 2));
    expect(p).toContain(clothes[0]!.name);
    expect(p).toContain(clothes[1]!.name);
    expect(new URL(draftUrl(p)).origin).toBe('https://chatgpt.com');
    expect(new URL(draftUrl(p)).searchParams.get('q')).toBe(p);
  });
});
