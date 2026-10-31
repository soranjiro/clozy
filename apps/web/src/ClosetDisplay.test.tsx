import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CATEGORIES } from '@clozy/domain';
import { ClosetCollection, ClosetScene, GarmentSilhouette } from './ClosetDisplay';

describe('closet presentation', () => {
  it.each(CATEGORIES)('has a decorative, local fallback for %s', category => {
    const html = renderToStaticMarkup(<GarmentSilhouette item={{ category, color: 'アイボリー' }} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('fill="#eee9df"');
    expect(html).not.toContain('<image');
    expect(html).not.toContain('https://');
  });
  it('renders actual category groups without duplicating or fabricating garments', () => {
    const html = renderToStaticMarkup(<ClosetCollection label="クローゼット" count={2} groups={[
      { category: 'アウター', count: 1, children: <article>わたしのコート</article> },
      { category: 'シューズ', count: 1, children: <article>わたしの靴</article> }
    ]}><article>unused flat list</article></ClosetCollection>);
    expect(html).toContain('aria-label="アウターの棚"');
    expect(html).toContain('aria-label="シューズの棚"');
    expect(html.match(/<article>/g)).toHaveLength(2);
    expect(html).not.toContain('unused flat list');
  });
  it('preserves meaningful empty state content rather than inventing demo clothes', () => {
    const html = renderToStaticMarkup(<ClosetCollection label="空のクローゼット" count={0}><p>最初の1着を登録</p></ClosetCollection>);
    expect(html).toContain('最初の1着を登録');
    expect(html).toContain('closet-is-empty');
    expect(html).not.toContain('garment-grid');
  });
  it('keeps the home illustration decorative and independent of user data', () => {
    const html = renderToStaticMarkup(<ClosetScene />);
    expect(html).toContain('class="closet-scene" aria-hidden="true"');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('PIECES');
  });
});
