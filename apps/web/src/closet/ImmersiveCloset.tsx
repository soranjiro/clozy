import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Clothing, WearEntry, Category, Season } from '@clozy/domain';
import { CATEGORIES, SEASONS, filterClothing, inSeason, validDate } from '@clozy/domain';
import type { ClozyService } from '@clozy/application';
import Icon from '../Icon';
import ChatGptDraft from '../ChatGptDraft';
import { GarmentThumb } from '../GarmentVisual';
import ClosetDialog from './ClosetDialog';
import { zones, zoneFor, addToOutfit } from './projection';

function Rail({ items, label, kind, service, onPick, onAdd, target }: { items: Clothing[]; label: string; kind: string; service: ClozyService; onPick: (id: string) => void; onAdd?: () => void; target: string | null }) {
  const rail = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(0);
  const [destination, setDestination] = useState<{ index: number; smooth: boolean } | null>(null);
  const step = 152;
  const centerIndex = Math.min(center, Math.max(0, items.length - 1));
  function move(index: number, smooth = true) {
    const next = Math.max(0, Math.min(items.length - 1, index));
    setCenter(next);
    setDestination({ index: next, smooth: smooth && Math.abs(next - centerIndex) < 4 });
  }
  useLayoutEffect(() => {
    const element = rail.current;
    if (!element || !destination) return;
    element.style.scrollSnapType = 'none';
    element.scrollTo({ left: destination.index * step, behavior: destination.smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' });
    const frame = requestAnimationFrame(() => { element.style.scrollSnapType = ''; });
    return () => { cancelAnimationFrame(frame); element.style.scrollSnapType = ''; };
  }, [destination]);
  useEffect(() => { const index = items.findIndex(i => i.id === target); if (index >= 0) move(index, false); }, [target]);
  useEffect(() => { if (center >= items.length) move(Math.max(0, items.length - 1), false); }, [items.length]);
  return <section className={'closet-bay ' + kind} aria-label={label}>
    <div className="closet-bay-title"><h2>{label}</h2><span>{items.length ? `${centerIndex + 1} / ${items.length}` : '0'}</span></div>
    <div className="closet-light" />
    {items.length ? <>
      <div ref={rail} className="closet-rail-scroll" tabIndex={0} role="group" aria-label={label + 'を横に送る'} onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(centerIndex + (e.key === 'ArrowRight' ? 1 : -1)); } }} onScroll={e => setCenter(Math.round(e.currentTarget.scrollLeft / step))}>
        <div className="closet-rail-track" style={{ width: items.length * step }}>
          {items.slice(Math.max(0, centerIndex - 4), centerIndex + 5).map((item, offset) => {
            const index = Math.max(0, centerIndex - 4) + offset;
            return <button key={item.id} className={'closet-piece ' + (index === centerIndex ? 'is-centered' : '')} style={{ left: index * step }} aria-label={item.name + 'を取り出す'} onFocus={() => { if (index !== centerIndex) move(index); }} onClick={() => onPick(item.id)}>
              {kind === 'rail' && <span className="closet-hanger" aria-hidden="true" />}
              <GarmentThumb item={item} service={service} /><span className="closet-piece-name">{item.name}</span>{item.favorite && <span className="closet-favorite"><Icon name="heart" size={13} /></span>}
            </button>;
          })}
        </div>
      </div>
      <div className="closet-rail-controls"><button className="closet-round" aria-label={label + 'の前の服'} disabled={centerIndex === 0} onClick={() => move(centerIndex - 1)}><Icon name="left" /></button><input aria-label={label + 'の位置'} type="range" min="0" max={items.length - 1} value={centerIndex} onChange={e => move(Number(e.target.value), false)} /><button className="closet-round" aria-label={label + 'の次の服'} disabled={centerIndex === items.length - 1} onClick={() => move(centerIndex + 1)}><Icon name="right" /></button></div>
    </> : !onAdd ? <div className="closet-empty-hanger"><Icon name="box" size={30} /><span>収納中の服はありません</span></div> : <button className="closet-empty-hanger" onClick={() => onAdd?.()}><Icon name={kind === 'rail' ? 'hanger' : 'plus'} size={36} /><span>{label}を追加</span></button>}
  </section>;
}
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export default function ImmersiveCloset({ items, wears, service, busy, onAdd, onBulk, onEdit, onFavorite, onRecord, onWearToday }: {
  items: Clothing[]; wears: WearEntry[]; service: ClozyService; busy: boolean; onAdd: (category?: Category) => void; onBulk: () => void; onEdit: (item: Clothing) => void; onFavorite: (item: Clothing) => void; onRecord: (items: Clothing[], date: string) => Promise<boolean>; onWearToday: (item: Clothing) => void;
}) {
  const [chatItems, setChatItems] = useState<Clothing[] | null>(null);
  const [panel, setPanel] = useState<'index' | 'outfit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'すべて'>('すべて');
  const [season, setSeason] = useState('すべて');
  const [storage, setStorage] = useState('すべて');
  const [favorite, setFavorite] = useState(false);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const [outfit, setOutfit] = useState<string[]>([]);
  const [date, setDate] = useState(localDate);
  const [recording, setRecording] = useState(false);
  const ordered = useMemo(() => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)), [items]);
  const results = useMemo(() => filterClothing(items, query, category, favorite).filter(i => (season === 'すべて' || inSeason(i, season as Season)) && (storage === 'すべて' || (storage === '収納中' ? i.archived : !i.archived))).sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name, 'ja') : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)), [items, query, category, favorite, season, storage, sort]);
  useEffect(() => setPage(0), [query, category, favorite, season, storage, sort]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(results.length / 36) - 1));
  const selected = items.find(i => i.id === selectedId);
  const outfitItems = outfit.map(id => items.find(i => i.id === id)).filter((i): i is Clothing => Boolean(i));
  const recorded = outfitItems.length > 0 && outfitItems.every(i => wears.some(w => w.clothingId === i.id && w.date === date));
  function locate(item: Clothing) {
    setPanel(null); setTarget(item.id);
    requestAnimationFrame(() => { document.getElementById('zone-' + zoneFor(item))?.scrollIntoView({ behavior: 'instant', block: 'center' }); });
    setSelectedId(item.id);
  }
  return <div className="immersive-closet">
    <h1 className="sr-only">あなたのクローゼット</h1>
    <div className="closet-cornice" aria-hidden="true" />
    <div className="closet-scene-tools"><button className="closet-tool" onClick={() => setPanel('index')} aria-label="写真索引・検索を開く"><Icon name="search" /><span>探す</span></button><button className="closet-tool" onClick={() => onAdd?.()} aria-label="服を追加"><Icon name="plus" /><span>追加</span></button><button className="closet-tool" onClick={() => setPanel('outfit')} aria-label="選んだコーデを開く"><Icon name="hanger" /><span>コーデ{outfitItems.length > 0 && ` ${outfitItems.length}`}</span></button></div>
    {!items.length && <div className="closet-welcome"><h2>最初の1着からはじめよう</h2><p>服を掛けて、あなたのクローゼットに。</p><button className="button button-primary" onClick={() => onAdd?.()}>服を登録する</button><button className="button button-outline" onClick={onBulk}>まとめて登録</button></div>}
    <div className="closet-cabinet">{zones.map(zone => <div id={'zone-' + zone.id} key={zone.id} className={'closet-zone zone-' + zone.id}>
      <Rail label={zone.label} kind={zone.kind} items={ordered.filter(i => zoneFor(i) === zone.id)} service={service} onPick={setSelectedId} onAdd={zone.id === 'stored' ? undefined : () => onAdd(zone.categories[0])} target={target} />
    </div>)}</div>
    <div className="closet-plinth"><span>{items.length} pieces</span><button onClick={onBulk}>まとめて登録 <Icon name="plus" size={16} /></button></div>
    {panel === 'index' && <ClosetDialog title="写真索引" onClose={() => setPanel(null)}>
      <label className="search-box"><Icon name="search" /><input aria-label="服を検索" type="search" placeholder="名前・ブランド・カラーで検索" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <div className="closet-filters"><label>種類<select value={category} onChange={e => setCategory(e.target.value as Category | 'すべて')}>{['すべて', ...CATEGORIES].map(c => <option key={c}>{c}</option>)}</select></label><label>季節<select value={season} onChange={e => setSeason(e.target.value)}>{['すべて', ...SEASONS].map(s => <option key={s}>{s}</option>)}</select></label><label>衣替え<select value={storage} onChange={e => setStorage(e.target.value)}>{['すべて', '着用中', '収納中'].map(s => <option key={s}>{s}</option>)}</select></label><label>並べ替え<select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">新しい順</option><option value="oldest">古い順</option><option value="name">名前順</option></select></label></div>
      <div className="closet-index-summary"><button className="button button-outline" aria-pressed={favorite} onClick={() => setFavorite(!favorite)}><Icon name="heart" size={16} />お気に入り</button><span role="status">{results.length} / {items.length}着</span><button className="section-link" onClick={() => { setQuery(''); setCategory('すべて'); setSeason('すべて'); setStorage('すべて'); setFavorite(false); }}>絞り込みを解除</button></div>
      <div className="closet-index-grid">{results.slice(currentPage * 36, (currentPage + 1) * 36).map(item => <button key={item.id} onClick={() => locate(item)}><GarmentThumb item={item} service={service} /><strong>{item.name}</strong><small>{item.category}{item.archived ? ' · 収納中' : ''}</small></button>)}</div>
      {!results.length && <p className="panel-empty">条件に合う服がありません。検索条件を変更してください。</p>}
      {results.length > 36 && <div className="closet-pagination"><button className="button button-outline" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>前の36着</button><span>{currentPage + 1} / {Math.ceil(results.length / 36)}</span><button className="button button-outline" disabled={(currentPage + 1) * 36 >= results.length} onClick={() => setPage(currentPage + 1)}>次の36着</button></div>}
      <button className="button button-outline" onClick={() => { setPanel(null); onBulk(); }}>まとめて登録</button>
    </ClosetDialog>}
    {selected && <ClosetDialog title={selected.name} onClose={() => setSelectedId(null)}>
      <div className="closet-inspect"><span className="closet-hanger" aria-hidden="true" /><GarmentThumb item={selected} service={service} /></div>
      <p className="closet-item-meta">{[selected.category, selected.brand, selected.color, selected.size].filter(Boolean).join(' · ')}{selected.archived && ' · 収納中'}</p>
      <div className="closet-item-actions"><button className="button button-outline" disabled={busy} aria-pressed={selected.favorite} onClick={() => onFavorite(selected)}><Icon name="heart" />お気に入り</button><button className="button button-primary" onClick={() => { setOutfit(ids => addToOutfit(ids, selected, items)); setSelectedId(null); setPanel('outfit'); }}><Icon name="plus" />コーデに追加</button><button className="button button-outline" onClick={() => { const item = selected; setSelectedId(null); onEdit(item); }}><Icon name="edit" />詳細・編集</button></div>
      <div className="closet-item-actions"><button className="button button-outline" disabled={busy} onClick={() => onWearToday(selected)}>{wears.some(w => w.clothingId === selected.id && w.date === localDate()) ? '今日の着用を取り消す' : '今日着た'}</button><button className="button button-outline" onClick={() => { setChatItems([selected]); setSelectedId(null); }}>ChatGPTで相談</button></div>
      <p className="closet-hint">同じ種類は入れ替え。ワンピースは上下の代わりになります。</p>
    </ClosetDialog>}
    {panel === 'outfit' && <ClosetDialog title="選んだコーデ" onClose={() => setPanel(null)}>
      <div className="closet-outfit">{outfitItems.map(item => <div key={item.id}><GarmentThumb item={item} service={service} /><span>{item.name}</span><button className="closet-round" aria-label={item.name + 'をコーデから外す'} onClick={() => setOutfit(ids => ids.filter(id => id !== item.id))}><Icon name="close" size={16} /></button></div>)}</div>
      {!outfitItems.length && <p className="panel-empty">レールから服を取り出して、コーデに追加してください。</p>}
      <label className="closet-date">着る日<input type="date" value={date} min="1900-01-01" max="9999-12-31" onChange={e => setDate(e.target.value)} /></label>
      <button className="button button-primary" disabled={busy || recording || !outfitItems.length || recorded || !validDate(date)} onClick={async () => { setRecording(true); try { await onRecord(outfitItems, date); } finally { setRecording(false); } }}><Icon name="check" />{recorded ? 'この日は記録済み' : recording ? '記録中…' : 'この組み合わせを着用記録'}</button>
    </ClosetDialog>}
    {chatItems && <ChatGptDraft items={chatItems} service={service} onClose={() => setChatItems(null)} />}
  </div>;
}
