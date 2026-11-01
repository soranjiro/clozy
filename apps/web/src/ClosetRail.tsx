import { useEffect, useMemo, useRef, useState } from 'react';
import type { Clothing, Category } from '@clozy/domain';
import { CATEGORIES, SEASONS, filterClothing, inSeason } from '@clozy/domain';
import type { ClozyService } from '@clozy/application';
import Icon from './Icon';
import { GarmentArt, GarmentThumb } from './GarmentVisual';

type Destination = 'wardrobe' | 'planning' | 'calendar' | 'insights';
type Props = {
  items: Clothing[];
  service: ClozyService;
  mode: 'home' | 'wardrobe';
  busy: boolean;
  onAdd: () => void;
  onBulk: () => void;
  onEdit: (item: Clothing) => void;
  onFavorite: (item: Clothing) => void;
  onWearToday: (item: Clothing) => void;
  wornToday: ReadonlySet<string>;
  onGo: (destination: Destination) => void;
};

const demo: Category[] = ['アウター', 'トップス', 'ワンピース', 'トップス', 'アウター'];
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A real horizontally scrolling rail, rather than a picture of one. */
export default function ClosetRail({ items, service, mode, busy, onAdd, onBulk, onEdit, onFavorite, onWearToday, wornToday, onGo }: Props) {
  const [category, setCategory] = useState<Category | 'すべて'>('すべて');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState(false);
  const [season, setSeason] = useState('すべて');
  const [storage, setStorage] = useState('着用中');
  const [sort, setSort] = useState('newest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDialogElement>(null);
  const comparison = useRef<HTMLDialogElement>(null);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef<number | null>(null);

  const visible = useMemo(() => filterClothing(items, query, category, favorites)
    .filter(item => (season === 'すべて' || inSeason(item, season as typeof SEASONS[number]))
      && (storage === 'すべて' || (storage === '収納中' ? item.archived : !item.archived)))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'ja', { numeric: true })
      : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt)
      : sort === 'updated' ? b.updatedAt.localeCompare(a.updatedAt)
      : b.createdAt.localeCompare(a.createdAt)), [items, query, category, favorites, season, storage, sort]);

  const current = items.find(item => item.id === focusedId);
  const shelfMode = category === 'シューズ' || category === 'バッグ' || category === 'アクセサリー' || category === 'その他';
  const center = visible[Math.min(active, visible.length - 1)];
  const stored = items.filter(item => item.archived);
  const compared = compareIds.map(id => items.find(item => item.id === id))
    .filter((item): item is Clothing => Boolean(item));

  useEffect(() => {
    setActive(0);
    if (track.current) track.current.scrollLeft = 0;
  }, [category, query, favorites, season, storage, sort]);

  useEffect(() => {
    const dialog = detail.current;
    if (!dialog) return;
    if (current && !dialog.open) dialog.showModal();
    if (!current && dialog.open) dialog.close();
  }, [current]);

  useEffect(() => {
    const dialog = comparison.current;
    if (!dialog) return;
    if (compareOpen && compared.length === 2 && !dialog.open) dialog.showModal();
    if ((!compareOpen || compared.length !== 2) && dialog.open) dialog.close();
  }, [compareOpen, compared.length]);

  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);

  function moveTo(index: number) {
    const el = track.current;
    if (!el || index < 0 || index >= visible.length) return;
    const slides = el.querySelectorAll<HTMLElement>('[data-garment-slide]');
    const slide = slides[index];
    if (!slide) return;
    el.scrollTo({
      left: slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2,
      behavior: reduceMotion() ? 'instant' : 'smooth'
    });
    setActive(index);
  }
  function onRailScroll() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const el = track.current;
      if (!el) return;
      const midpoint = el.scrollLeft + el.clientWidth / 2;
      const slides = el.querySelectorAll<HTMLElement>('[data-garment-slide]');
      let nearest = 0;
      let distance = Infinity;
      slides.forEach((slide, i) => {
        const delta = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - midpoint);
        if (delta < distance) { nearest = i; distance = delta; }
      });
      setActive(previous => previous === nearest ? previous : nearest);
    });
  }
  function select(index: number) {
    const selected = visible[index];
    if (!selected) return;
    if (index !== active) moveTo(index);
    else setFocusedId(selected.id);
  }
  function queueCompare(item: Clothing) {
    setCompareIds(previous => previous.includes(item.id) ? previous : [...previous.slice(-1), item.id]);
    setFocusedId(null);
  }
  function onRoomTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches.item(0);
    if (touch) touchOrigin.current = { x: touch.clientX, y: touch.clientY };
  }
  function onRoomTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches.item(0);
    const origin = touchOrigin.current;
    touchOrigin.current = null;
    if (!touch || !origin) return;
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (dy > 80 && Math.abs(dx) < 60) setDrawerOpen(true);
  }
  function editCurrent() {
    if (!current) return;
    const item = current;
    setFocusedId(null);
    onEdit(item);
  }

  return <section className="closet-room" aria-label="ハンガーを横にスライドして服を探すクローゼット">
    <div className="closet-cabinet">
      <div className="closet-cabinet-ceiling" aria-hidden="true"><span className="closet-engraving">clozy.</span><span className="closet-ceiling-lamp" /></div>
      <div className="closet-upper-shelf" aria-hidden="true">
        <div className="closet-plant"><i /><i /><i /><i /><i /></div>
        <div className="closet-basket" />
        <div className="closet-folds"><i /><i /><i /></div>
        <div className="closet-hatbox" />
      </div>
      <div className="closet-tools">
        <h1>{mode === 'home' ? '今日のクローゼット' : 'クローゼット'}</h1>
        <span className="closet-item-count">{items.length} 着</span>
        <div className="closet-tool-actions">
          <button type="button" className={favorites ? 'is-selected' : ''} aria-label="お気に入りだけ表示" aria-pressed={favorites} onClick={() => setFavorites(value => !value)}><Icon name="heart" size={19} /></button>
          <button type="button" aria-label="服を検索" aria-expanded={searchOpen} onClick={() => setSearchOpen(value => !value)}><Icon name="search" size={19} /></button>
          <button type="button" aria-label="服を追加" onClick={onAdd}><Icon name="plus" size={22} /></button>
        </div>
      </div>
      {searchOpen && <label className="closet-search"><Icon name="search" size={17} /><span className="sr-only">服を検索</span><input type="search" autoFocus value={query} placeholder="名前・色・ブランド" onChange={event => setQuery(event.target.value)} /><button type="button" aria-label="検索を閉じる" onClick={() => { setSearchOpen(false); setQuery(''); }}><Icon name="close" size={17} /></button></label>}
      <nav className="closet-compartments" aria-label="収納場所から服を探す">
        <button type="button" className="closet-compartment all" aria-pressed={category === 'すべて'} onClick={() => setCategory('すべて')}>
          <span className="closet-compartment-picture"><Icon name="hanger" size={29}/></span>
          <span className="closet-compartment-name">すべて</span>
          <small>{items.length}着</small>
        </button>
        {CATEGORIES.map(c => {
          const sample = items.find(item => item.category === c && !item.archived) ?? items.find(item => item.category === c);
          const count = items.filter(item => item.category === c && !item.archived).length;
          return <button type="button" key={c} className="closet-compartment" aria-label={c + '、' + count + '着'} aria-pressed={category === c} onClick={() => { setCategory(c); setStorage('着用中'); }}>
            <span className="closet-compartment-picture">{sample ? <GarmentThumb item={sample} service={service}/> : <GarmentArt category={c} small/>}</span>
            <span className="closet-compartment-name">{c}</span>
            <small>{count}着</small>
          </button>;
        })}
      </nav>
      <div className={'closet-hanging-area' + (shelfMode ? ' is-shelf' : '')} onTouchStart={onRoomTouchStart} onTouchEnd={onRoomTouchEnd}>
        <div className="closet-hanging-rail" aria-hidden="true" />
        <span className="closet-rail-end left" aria-hidden="true" /><span className="closet-rail-end right" aria-hidden="true" />
        {visible.length ? <>
          <div ref={track} className="closet-rail-track" role="group" aria-label="服を横方向にスクロール" onScroll={onRailScroll} tabIndex={0}>
            <span className="closet-track-spacer" aria-hidden="true" />
            {visible.map((item, index) => <button type="button" key={item.id} data-garment-slide className={'closet-garment-slide' + (index === active ? ' is-active' : '')}
              aria-label={item.name} aria-current={index === active ? 'true' : undefined} onClick={() => select(index)}>
              <span className="closet-hanger-hook" aria-hidden="true" />
              <span className="closet-hanger-shoulders" aria-hidden="true" />
              <span className="closet-hanging-garment"><GarmentThumb item={item} service={service}/></span>
            </button>)}
            <span className="closet-track-spacer" aria-hidden="true" />
          </div>
          <button type="button" className="closet-rail-arrow prev" aria-label="前の服へ" disabled={active === 0} onClick={() => moveTo(active - 1)}><Icon name="left" size={25}/></button>
          <button type="button" className="closet-rail-arrow next" aria-label="次の服へ" disabled={active === visible.length - 1} onClick={() => moveTo(active + 1)}><Icon name="right" size={25}/></button>
          <div className="closet-plaque" aria-live="polite">
            <span className="closet-plaque-number">{String(active + 1).padStart(2, '0')} <i/> {String(visible.length).padStart(2, '0')}</span>
            <strong>{center?.name}</strong>
            <span>{[center?.brand, center?.color].filter(Boolean).join(' · ') || center?.category}</span>
            <button type="button" onClick={() => center && setFocusedId(center.id)} aria-label={center ? center.name + 'の詳細を見る' : '詳細を見る'}><Icon name="arrow" size={19}/></button>
          </div>
          <div className="closet-pagination" role="group" aria-label="服を選ぶ">{visible.length <= 12 && visible.map((item, index) => <button type="button" key={item.id} aria-label={item.name + 'へ移動'} aria-current={active === index ? 'true' : undefined} onClick={() => moveTo(index)} />)}</div>
        </> : <div className="closet-empty-rail">
          <div className="closet-demo-hangers" aria-hidden="true">{demo.map((c, i) => <span key={i}><i className="closet-demo-hook"/><GarmentArt category={c}/></span>)}</div>
          <div className="closet-empty-message"><p>{items.length ? 'ここにはまだ服がありません' : 'あなたの服を、ここに。'}</p>
            <button type="button" onClick={items.length ? () => { setCategory('すべて'); setFavorites(false); setStorage('すべて'); setSeason('すべて'); setQuery(''); } : onAdd}>
              <Icon name={items.length ? 'hanger' : 'plus'} size={18}/> {items.length ? 'すべての服を見る' : '最初の服を掛ける'}</button>
          </div>
        </div>}
      </div>
      <div className="closet-cabinet-base">
        <button type="button" className={'closet-drawer-handle' + (drawerOpen ? ' is-open' : '')} aria-label={drawerOpen ? '引き出しを閉じる' : '引き出しを開く'} aria-expanded={drawerOpen} onClick={() => setDrawerOpen(value => !value)}>
          <span className="closet-brass-pull"/><span className="closet-drawer-label">FOLDED & STORED</span><Icon name={drawerOpen ? 'left' : 'right'} size={16}/>
        </button>
        <div className={'closet-drawer-content' + (drawerOpen ? ' is-open' : '')} aria-hidden={!drawerOpen}>
          <p>{stored.length ? '収納中の服' : 'たたんだ服の収納スペース'}</p>
          <div className="closet-drawer-items">{stored.length ? stored.slice(0, 8).map(item => <button key={item.id} type="button" tabIndex={drawerOpen ? 0 : -1} onClick={() => setFocusedId(item.id)} aria-label={item.name + 'の詳細を見る'}><GarmentThumb item={item} service={service}/><span>{item.name}</span></button>)
            : <><span className="closet-folded-sample" /><span className="closet-folded-sample" /><span className="closet-folded-sample" /></>}</div>
        </div>
      </div>
    </div>
    <div className="closet-passage" aria-label="クローゼット内の移動">
      <button type="button" onClick={() => onGo('planning')}><Icon name="hanger" size={21}/><span>コーデを組む</span><Icon name="right" size={17}/></button>
      <button type="button" onClick={() => onGo('calendar')}><Icon name="calendar" size={20}/><span>着用記録</span><Icon name="right" size={17}/></button>
      <button type="button" onClick={() => onGo('insights')}><Icon name="chart" size={20}/><span>服を見直す</span><Icon name="right" size={17}/></button>
    </div>
    <div className="closet-cabinet-actions">
      <button type="button" onClick={onBulk}><Icon name="plus" size={17}/> まとめて登録</button>
      {mode === 'home' && <button type="button" onClick={() => onGo('wardrobe')}><Icon name="hanger" size={17}/> 服を整理する</button>}
      {mode === 'wardrobe' && <>
        <label>季節<select aria-label="季節" value={season} onChange={event => setSeason(event.target.value)}>{['すべて', ...SEASONS].map(s => <option key={s}>{s}</option>)}</select></label>
        <label>衣替え<select aria-label="衣替え" value={storage} onChange={event => setStorage(event.target.value)}>{['すべて', '着用中', '収納中'].map(s => <option key={s}>{s}</option>)}</select></label>
        <label>並び順<select aria-label="並び順" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">新しい順</option><option value="oldest">古い順</option><option value="updated">更新順</option><option value="name">名前順</option></select></label>
      </>}
    </div>
    {compared.length > 0 && <div className="closet-compare-tray" role="region" aria-label="服の比較">
      <span>比較 {compared.length} / 2</span>
      <div>{compared.map(item => <span key={item.id} className="closet-compare-thumb"><GarmentThumb item={item} service={service}/><small>{item.name}</small></span>)}</div>
      <button type="button" className="closet-compare-start" disabled={compared.length !== 2} onClick={() => setCompareOpen(true)}>2着を比較</button>
      <button type="button" aria-label="比較を解除" onClick={() => { setCompareIds([]); setCompareOpen(false); }}><Icon name="close" size={18}/></button>
    </div>}
    <dialog className="closet-compare-dialog" ref={comparison} aria-label="2着を並べて比較" onClose={() => setCompareOpen(false)}>
      <div className="closet-compare-heading"><h2>2着を比較</h2><button type="button" aria-label="比較画面を閉じる" onClick={() => setCompareOpen(false)}><Icon name="close" size={20}/></button></div>
      <div className="closet-compare-columns">{compared.map(item => <section key={item.id}>
        <div className="closet-compare-picture"><GarmentThumb item={item} service={service}/></div>
        <h3>{item.name}</h3><p>{item.category}</p><p>{item.brand || '—'}</p><p>{item.color || '—'}</p>
        <button type="button" onClick={() => { setCompareOpen(false); onEdit(item); }}>編集する <Icon name="arrow" size={16}/></button>
      </section>)}</div>
    </dialog>
    <dialog className="closet-inspect" ref={detail} aria-labelledby="closet-inspect-name" onClose={() => setFocusedId(null)}>
      {current && <div className="closet-inspect-inner">
        <button className="closet-inspect-close" aria-label="詳細を閉じる" type="button" onClick={() => setFocusedId(null)}><Icon name="close" size={20}/></button>
        <div className="closet-inspect-rail" aria-hidden="true" />
        <div className="closet-inspect-garment"><GarmentThumb item={current} service={service}/></div>
        <div className="closet-inspect-details"><span>{current.category}{current.archived ? ' · 収納中' : ''}</span><h2 id="closet-inspect-name">{current.name}</h2>
          <p>{[current.brand, current.color, current.size].filter(Boolean).join(' · ')}</p>
          <div className="closet-inspect-actions">
            <button type="button" aria-label="お気に入りを切り替える" aria-pressed={current.favorite} onClick={() => onFavorite(current)} disabled={busy}><Icon name="heart" size={20} fill={current.favorite ? 'currentColor' : 'none'}/></button>
            <button type="button" aria-pressed={wornToday.has(current.id)} onClick={() => onWearToday(current)} disabled={busy}><Icon name={wornToday.has(current.id) ? 'check' : 'calendar'} size={18}/> {wornToday.has(current.id) ? '今日の記録を外す' : '今日着た'}</button>
            <button type="button" onClick={() => queueCompare(current)}><Icon name="grid" size={18}/> 比較に追加</button>
            <button type="button" onClick={editCurrent}><Icon name="edit" size={18}/> 詳細・編集</button>
          </div>
        </div>
      </div>}
    </dialog>
  </section>;
}
