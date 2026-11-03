import { useState } from 'react';
import { SEASONS, getWearCounts, inSeason, seasonForMonth, suggestOutfit, zozoSearchUrl } from '@clozy/domain';
import type { Clothing, Season, WearEntry } from '@clozy/domain';
import Icon from './Icon';
import { GarmentThumb } from './GarmentVisual';
import ChatGptDraft from './ChatGptDraft';
import type { ClozyService } from '@clozy/application';

export default function Planning({ items, wears, busy, onRecord, onEdit, onAdd, service }: {
  items: Clothing[]; wears: WearEntry[]; busy: boolean; service: ClozyService;
  onRecord: (items: Clothing[], date: string) => void; onEdit: (item: Clothing) => void; onAdd: () => void;
}) {
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  const [season, setSeason] = useState<Season>(() => seasonForMonth(now.getMonth() + 1));
  const [date, setDate] = useState(today);
  const [rotation, setRotation] = useState(0);
  const [layered, setLayered] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const suggestion = suggestOutfit(items, wears, season, date || today, rotation, layered);
  const outfit = { ...suggestion, items: suggestion.items.map(item =>
    items.find(candidate => candidate.id === replacements[item.category] && candidate.category === item.category && !candidate.archived && inSeason(candidate, season)) ?? item) };
  const past = wears.filter(wear => wear.date <= date);
  const counts = getWearCounts(past);
  const lastWorn = (id: string) => past.filter(wear => wear.clothingId === id).map(wear => wear.date).sort().at(-1);
  function replace(item: Clothing) {
    const candidates = items.filter(candidate => candidate.category === item.category && !candidate.archived && inSeason(candidate, season)).sort((a, b) => a.id.localeCompare(b.id));
    const next = candidates[(candidates.findIndex(candidate => candidate.id === item.id) + 1) % candidates.length];
    if (next) setReplacements(previous => ({ ...previous, [item.category]: next.id }));
  }
  const stored = items.filter(item => item.archived && inSeason(item, season));
  const allRecorded = outfit.items.length > 0 && outfit.items.every(item => wears.some(w => w.clothingId === item.id && w.date === date));
  return <>
    <div className="closet-banner">
      <div><h2>今日のコーデ</h2></div>
      <div className="closet-banner-art" aria-hidden="true"><span /><span /><span /></div>
    </div>
    <div className="planning-actions planning-top-action"><button className="button button-outline" onClick={onAdd}><Icon name="plus" size={18} />服を追加</button></div>
    <section className="insight-panel planning-panel"><h3>今日の組み合わせ</h3>
      <div className="look-stage" aria-label="ハンガーに掛けたコーディネートの候補">
      {outfit.items.length ? outfit.items.map(item => <button type="button" className="look-hanger" key={item.id} onClick={() => onEdit(item)} aria-label={item.name + 'を編集'}>
        <GarmentThumb item={item} service={service} className="look-photo"/><span>{item.name}</span>
      </button>) : <p className="panel-empty">服を追加すると、ここに今日のコーデが並びます。</p>}
      </div>
      <div className="planning-controls"><label className="sort-control">季節<select value={season} onChange={e => { setSeason(e.target.value as Season); setRotation(0); setReplacements({}); }}>{SEASONS.map(s => <option key={s}>{s}</option>)}</select></label><label className="sort-control">着る日<input type="date" min="1900-01-01" max="9999-12-31" required value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label><label className="check-row"><input type="checkbox" checked={layered} onChange={e => setLayered(e.target.checked); setReplacements({})} />羽織りも選ぶ</label></div>
      {outfit.items.length ? <div className="outfit-list">{outfit.items.map(item => <div className="outfit-candidate" key={item.id}><button className="wear-option" onClick={() => onEdit(item)}><GarmentThumb item={item} service={service} className="wear-mini"/><span><small>{item.category}</small><strong>{item.name}</strong><small>{[item.brand, item.color].filter(Boolean).join(' · ')}</small><small>{counts.get(item.id) ?? 0}回着用 · 最後の記録 {lastWorn(item.id) ?? 'なし'}</small></span><Icon name="right" size={18} /></button><button className="button button-ghost" disabled={busy || items.filter(candidate => candidate.category === item.category && !candidate.archived && inSeason(candidate, season)).length < 2} onClick={() => replace(item)} aria-label={item.name + 'だけ入れ替える'}>この服だけ変更</button></div>)}</div> : <p className="panel-empty">この季節の着用中アイテムがありません。服を登録するか、収納中の服を戻してください。</p>}
      <div className="planning-actions"><button className="button button-outline" onClick={() => setChatOpen(true)} disabled={!outfit.items.length}><Icon name="sparkles" size={17}/> ChatGPTで相談</button><button className="button button-outline" onClick={() => setRotation(n => n + 1); setReplacements({})} disabled={!outfit.items.length}>別の組み合わせ</button><button className="button button-primary" disabled={busy || !outfit.items.length || allRecorded} onClick={() => onRecord(outfit.items, date)}><Icon name="check" size={18} />{allRecorded ? 'この日は記録済み' : 'この組み合わせを着用記録'}</button></div>
    </section>
    <div className="insight-grid content-section"><section className="insight-panel"><p className="eyebrow">CHECK BEFORE YOU BUY</p><h3>組み合わせに足りないもの</h3>{outfit.missing.length ? <ul className="gap-list">{outfit.missing.map(category => <li key={category}><strong>{category}{stored.some(item => item.category === category) ? ' · 収納中にあります' : ''}</strong><a href={zozoSearchUrl(category)} target="_blank" rel="noopener noreferrer">ZOZOで調べる ↗</a></li>)}</ul> : <p className="panel-empty">基本の組み合わせは揃っています。まずは手持ちを楽しみましょう。</p>}</section>
    <section className="insight-panel"><p className="eyebrow">SEASONAL SWITCH</p><h3>収納中から戻せる服</h3>{stored.length ? <div className="outfit-list">{stored.map(item => <button className="wear-option" key={item.id} onClick={() => onEdit(item)}><span><strong>{item.name}</strong><small>{item.category}</small></span><Icon name="right" size={18} /></button>)}</div> : <p className="panel-empty">この季節に該当する収納中の服はありません。</p>}</section></div>

    {chatOpen && outfit.items.length > 0 && <ChatGptDraft items={outfit.items} service={service} onClose={() => setChatOpen(false)}/>}
  </>;
}
