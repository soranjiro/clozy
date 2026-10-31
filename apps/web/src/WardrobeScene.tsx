import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Icon from './Icon';

const clothes = [
  { name: 'リネンシャツ', tone: 'ivory' },
  { name: 'カーディガン', tone: 'sand' },
  { name: 'ジャケット', tone: 'charcoal' },
  { name: 'シャツ', tone: 'cream' },
  { name: 'コート', tone: 'olive' }
] as const;

/** A real UI scene: two wardrobe doors open from the centre in response to scroll or a button. */
export default function WardrobeScene({ onBrowse }: { onBrowse: () => void }) {
  const scene = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [override, setOverride] = useState<'auto' | 'open' | 'closed'>('auto');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = scene.current;
      if (!element) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setProgress(0);
        return;
      }
      const rectangle = element.getBoundingClientRect();
      // Open while the visitor naturally scrolls past the first viewport.
      const next = Math.min(1, Math.max(0, -rectangle.top / Math.max(140, rectangle.height * .48)));
      setProgress(previous => Math.abs(previous - next) > .018 ? next : previous);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  const reveal = override === 'open' ? 1 : override === 'closed' ? 0 : progress;
  const opened = reveal >= .6;
  function toggle() { setOverride(opened ? 'closed' : 'open'); }
  return <section className="wardrobe-stage" ref={scene}
    aria-label="クローゼットの扉を開くインタラクティブなホーム画面"
    style={{ '--door-open': reveal } as CSSProperties}
    data-open={opened ? 'true' : 'false'}>
    <div className="wardrobe-stage-interior" aria-hidden="true">
      <div className="cabinet-top"><div className="cabinet-box" /><div className="cabinet-towels"><i /><i /><i /></div></div>
      <div className="cabinet-rail" />
      <div className="cabinet-clothes">
        {clothes.map((cloth, index) => <div className={'cabinet-cloth ' + cloth.tone} key={cloth.name} style={{ '--cloth-order': index } as CSSProperties}>
          <span className="cabinet-hook" /><span className="cabinet-hanger" /><span className="cabinet-fabric" />
        </div>)}
      </div>
      <div className="cabinet-bottom"><div className="cabinet-bag"><span /></div><div className="cabinet-drawers"><i /><i /></div></div>
    </div>
    <div className="wardrobe-door wardrobe-door-left" aria-hidden="true"><span className="wardrobe-handle" /></div>
    <div className="wardrobe-door wardrobe-door-right" aria-hidden="true"><span className="wardrobe-handle" /></div>
    <div className="wardrobe-copy">
      
      <h1>Clozy</h1>
      <p className="wardrobe-headline">お気に入りの服で、<br />今日をはじめよう。</p>
      
    </div>
    {opened && <button type="button" className="wardrobe-browse" aria-label="クローゼットの中の服を見る" onClick={onBrowse}>
      服を見る <Icon name="arrow" size={17} />
    </button>}
    <div className="wardrobe-stage-controls">
      <button type="button" className="wardrobe-door-toggle" aria-pressed={opened}
        aria-label={opened ? 'クローゼットの扉を閉じる' : 'クローゼットの扉を開く'} onClick={toggle}>
        <Icon name="hanger" size={17} />{opened ? '閉じる' : '開く'}
      </button>
      <button type="button" className="wardrobe-scroll-cue" aria-label="下にスクロールして服を見る" onClick={() => {
        setOverride('open');
        document.getElementById('home-contents')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      }}><Icon name="arrow" size={16} />下へ</button>
    </div>
  </section>;
}
