import { useState } from 'react';
import { SEASONS, inSeason, seasonForMonth, suggestOutfit, zozoSearchUrl } from '@clozy/domain';
import type { Clothing, Season, WearEntry } from '@clozy/domain';
import Icon from './Icon';

export default function Planning({ items, wears, busy, onRecord, onEdit, onAdd }: {
  items: Clothing[]; wears: WearEntry[]; busy: boolean;
  onRecord: (items: Clothing[], date: string) => void; onEdit: (item: Clothing) => void; onAdd: () => void;
}) {
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  const [season, setSeason] = useState<Season>(() => seasonForMonth(now.getMonth() + 1));
  const [date, setDate] = useState(today);
  const [rotation, setRotation] = useState(0);
  const [layered, setLayered] = useState(false);
  const outfit = suggestOutfit(items, wears, season, date || today, rotation, layered);
  const stored = items.filter(item => item.archived && inSeason(item, season));
  const allRecorded = outfit.items.length > 0 && outfit.items.every(item => wears.some(w => w.clothingId === item.id && w.date === date));
  return <>
    <div className="closet-banner">
      <div><p className="eyebrow">TODAY'S OUTFIT</p><h2>何を着よう？</h2><p>クローゼットから、今日の組み合わせを選ぶ。</p></div>
      <div className="closet-banner-art" aria-hidden="true"><span /><span /><span /></div>
    </div>
    <div className="planning-actions planning-top-action"><button className="button button-outline" onClick={onAdd}><Icon name="plus" size={18} />服を追加</button></div>
    <section className="insight-panel planning-panel"><h3>手持ちから組み合わせる</h3><p className="panel-description">季節と収納状態で絞り、着用回数の少ない服を優先するルールベースの候補です。天気・色合わせ・TPOの自動判定ではありません。</p>
      <div className="look-stage" aria-label="ハンガーに掛けたコーディネートの候補">
      {outfit.items.length ? outfit.items.map(item => <button type="button" className="look-hanger" key={item.id} onClick={() => onEdit(item)} aria-label={item.name + 'を編集'}>
        <span className="look-garment" aria-hidden="true" /><span>{item.name}</span>
      </button>) : <p className="panel-empty">服を追加すると、ここに今日のコーデが並びます。</p>}
      </div>
      <div className="planning-controls"><label className="sort-control">季節<select value={season} onChange={e => { setSeason(e.target.value as Season); setRotation(0); }}>{SEASONS.map(s => <option key={s}>{s}</option>)}</select></label><label className="sort-control">着る日<input type="date" min="1900-01-01" max="9999-12-31" required value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label><label className="check-row"><input type="checkbox" checked={layered} onChange={e => setLayered(e.target.checked)} />羽織りも選ぶ</label></div>
      {outfit.items.length ? <div className="outfit-list">{outfit.items.map(item => <button className="wear-option" key={item.id} onClick={() => onEdit(item)}><span className="wear-option-icon"><Icon name="hanger" size={22} /></span><span><small>{item.category}</small><strong>{item.name}</strong><small>{[item.brand, item.color].filter(Boolean).join(' · ')}</small></span><Icon name="right" size={18} /></button>)}</div> : <p className="panel-empty">この季節の着用中アイテムがありません。服を登録するか、収納中の服を戻してください。</p>}
      <div className="planning-actions"><button className="button button-outline" onClick={() => setRotation(n => n + 1)} disabled={!outfit.items.length}>別の組み合わせ</button><button className="button button-primary" disabled={busy || !outfit.items.length || allRecorded} onClick={() => onRecord(outfit.items, date)}><Icon name="check" size={18} />{allRecorded ? 'この日は記録済み' : 'この組み合わせを着用記録'}</button></div>
    </section>
    <div className="insight-grid content-section"><section className="insight-panel"><p className="eyebrow">CHECK BEFORE YOU BUY</p><h3>組み合わせに足りないもの</h3><p className="panel-description">選んだ季節・着用中の服だけを見た目安です。買う前に収納中の服や代用品を確認しましょう。</p>{outfit.missing.length ? <ul className="gap-list">{outfit.missing.map(category => <li key={category}><strong>{category}</strong><a href={zozoSearchUrl(category)} target="_blank" rel="noopener noreferrer">ZOZOで調べる ↗</a></li>)}</ul> : <p className="panel-empty">基本の組み合わせは揃っています。まずは手持ちを楽しみましょう。</p>}</section>
    <section className="insight-panel"><p className="eyebrow">SEASONAL SWITCH</p><h3>収納中から戻せる服</h3><p className="panel-description">{season}に使える収納中の服。編集画面で「衣替えで収納中」を外すと提案に戻ります。</p>{stored.length ? <div className="outfit-list">{stored.map(item => <button className="wear-option" key={item.id} onClick={() => onEdit(item)}><span><strong>{item.name}</strong><small>{item.category}</small></span><Icon name="right" size={18} /></button>)}</div> : <p className="panel-empty">この季節に該当する収納中の服はありません。</p>}</section></div>
    <section className="settings-highlight content-section"><div><h3>ZOZOTOWNと一緒に使う</h3><p>商品ページのURL・購入金額を服の編集画面に保存できます。購入履歴の自動同期や商品情報の自動取得は行いません。リンクを開くと外部サイトに移動し、検索語が送信されます。ログイン情報はClozyに入力しないでください。</p></div></section>
  </>;
}
