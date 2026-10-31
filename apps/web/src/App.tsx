import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Clothing, Category, WearEntry } from '@clozy/domain';
import { CATEGORIES, SEASONS, filterClothing, getWearCounts, inSeason, wardrobeAnalysis } from '@clozy/domain';
import { ClozyService } from '@clozy/application';
import { IndexedDbRepository } from '@clozy/storage';
import Icon from './Icon';
import type { IconName } from './Icon';
import GarmentForm from './GarmentForm';
import BulkAdd from './BulkAdd';
import Planning from './Planning';
import CloudAccount from './CloudAccount';
import { hasPasskey, supportsPasskey, registerPasskey, removePasskey, passkeyError } from './passkey';

type View = 'home' | 'wardrobe' | 'planning' | 'calendar' | 'insights' | 'settings';
type Notice = { message: string; kind: 'success' | 'error' };
const nav: { key: View; title: string; icon: IconName }[] = [
  { key: 'home', title: 'ホーム', icon: 'home' },
  { key: 'wardrobe', title: 'クローゼット', icon: 'hanger' },
  { key: 'planning', title: '服選び', icon: 'sparkles' },
  { key: 'calendar', title: 'カレンダー', icon: 'calendar' },
  { key: 'insights', title: 'スタイル分析', icon: 'chart' },
  { key: 'settings', title: '設定', icon: 'settings' }
];
const todayLocal = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
};
const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const niceDate = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });

function GarmentImage({ service, item }: { service: ClozyService; item: Clothing }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!item.imageId) { setUrl(undefined); return; }
    let cancelled = false;
    let objectUrl: string | undefined;
    void service.image(item.id).then(blob => {
      if (!cancelled && blob) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    }).catch(() => setUrl(undefined));
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.imageId, service]);
  return url
    ? <img className="garment-photo" src={url} alt={item.name} loading="lazy" />
    : <div className={'garment-placeholder category-' + CATEGORIES.indexOf(item.category)} aria-hidden="true"><Icon name="hanger" size={56} /></div>;
}
function GarmentCard({ item, service, onEdit, onFavorite, busy }: {
  item: Clothing; service: ClozyService; onEdit: (item: Clothing) => void; onFavorite: (item: Clothing) => void; busy: boolean
}) {
  return <article className="garment-card">
    <div className="garment-media">
      <button className="garment-open" type="button" onClick={() => onEdit(item)} aria-label={item.name + 'を編集'}>
        <GarmentImage item={item} service={service} />
      </button>
      <button className={'favorite-button ' + (item.favorite ? 'is-favorite' : '')} type="button" onClick={() => onFavorite(item)} disabled={busy} aria-pressed={item.favorite} aria-label={item.name + (item.favorite ? 'をお気に入りから外す' : 'をお気に入りに追加')}>
        <Icon name="heart" size={19} fill={item.favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
    <div className="garment-details">
      <span className="category-label">{item.category}{item.archived ? ' · 収納中' : ''}</span>
      <button className="garment-name" type="button" onClick={() => onEdit(item)}>{item.name}</button>
      <p>{[item.brand, item.color].filter(Boolean).join(' · ') || (item.seasons ?? SEASONS).join('・')}</p>
      {item.sourceUrl && <a className="product-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">商品ページ ↗</a>}
    </div>
  </article>;
}
function EmptyState({ title, description, onAdd, action = '服を登録する' }: { title: string; description: string; onAdd?: () => void; action?: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="hanger" size={38} /></span><h3>{title}</h3><p>{description}</p>{onAdd && <button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} /> {action}</button>}</div>;
}
function Home({ items, wears, service, onAdd, onGo, onEdit, onFavorite, busy }: {
  items: Clothing[]; wears: WearEntry[]; service: ClozyService; onAdd: () => void; onGo: (view: View) => void;
  onEdit: (item: Clothing) => void; onFavorite: (item: Clothing) => void; busy: boolean
}) {
  const counts = getWearCounts(wears);
  const featured = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const recent = [...wears].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return <>
    <div className="hero">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">WARDROBE / EVERYDAY</p>
        <h2>服を整える。<br /><em>日々が整う。</em></h2>
        <p>持っている服を一覧で見て、選んで、記録する。<br />毎日のクローゼットをもっと使いやすく。</p>
        <button className="button button-light" onClick={onAdd}><Icon name="plus" size={19} /> アイテムを追加 <Icon name="arrow" size={17} /></button>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="closet-illustration">
          <span className="closet-top" /><span className="closet-rail" />
          <div className="closet-hangers">
            <span className="closet-outfit outfit-one"><span className="outfit-hook" /><span className="outfit-piece" /></span>
            <span className="closet-outfit outfit-two"><span className="outfit-hook" /><span className="outfit-piece" /></span>
            <span className="closet-outfit outfit-three"><span className="outfit-hook" /><span className="outfit-piece" /></span>
          </div>
          <span className="closet-shelf" /><span className="closet-drawer" />
        </div>
        <span className="art-label">a place for every piece.</span>
      </div>
    </div>
    <div className="metric-grid">
      <div className="metric"><div className="metric-head"><span>登録アイテム</span><span className="metric-icon lavender"><Icon name="hanger" size={19} /></span></div><strong>{items.length}<small> 着</small></strong><p>自分だけのコレクション</p></div>
      <div className="metric"><div className="metric-head"><span>お気に入り</span><span className="metric-icon peach"><Icon name="heart" size={19} /></span></div><strong>{items.filter(i => i.favorite).length}<small> 着</small></strong><p>とっておきのアイテム</p></div>
      <div className="metric"><div className="metric-head"><span>着用記録</span><span className="metric-icon mint"><Icon name="calendar" size={19} /></span></div><strong>{wears.length}<small> 回</small></strong><p>これまでのスタイル履歴</p></div>
    </div>
    <div className="quick-actions"><button onClick={() => onGo('planning')}><Icon name="sparkles" size={24} /><span><strong>今日、何を着よう？</strong><small>手持ちから候補を選ぶ</small></span><Icon name="right" size={18} /></button><button onClick={() => onGo('wardrobe')}><Icon name="hanger" size={24} /><span><strong>クローゼットを整える</strong><small>まとめて登録・季節で絞り込み</small></span><Icon name="right" size={18} /></button></div>
    <section className="content-section">
      <div className="section-head"><div><p className="eyebrow">RECENTLY ADDED</p><h3>最近追加したアイテム</h3></div><button className="section-link" onClick={() => onGo('wardrobe')}>すべて見る <Icon name="arrow" size={17} /></button></div>
      {featured.length ? <div className="garment-grid">{featured.map(i => <GarmentCard key={i.id} item={i} service={service} onEdit={onEdit} onFavorite={onFavorite} busy={busy} />)}</div> : <EmptyState title="最初の1着からはじめよう" description="クローゼットに服を登録すると、ここにコレクションが並びます。" onAdd={onAdd} />}
    </section>
    <section className="content-section bottom-section">
      <div className="section-head"><div><p className="eyebrow">STYLE JOURNAL</p><h3>最近の着用記録</h3></div><button className="section-link" onClick={() => onGo('calendar')}>カレンダーへ <Icon name="arrow" size={17} /></button></div>
      <div className="activity-panel">
        {recent.length ? recent.map(w => { const item = items.find(i => i.id === w.clothingId); return <div className="activity-row" key={w.id}><div className="activity-dot"><Icon name="check" size={15} /></div><div><strong>{item?.name ?? '削除済みの服'}</strong><p>{niceDate(w.date)}に着用</p></div><span>{counts.get(w.clothingId) ?? 0}回</span></div>; }) : <div className="activity-empty">カレンダーから今日のコーディネートを記録できます。</div>}
      </div>
    </section>
  </>;
}
function Wardrobe({ items, service, onAdd, onBulk, onEdit, onFavorite, busy }: {
  items: Clothing[]; service: ClozyService; onAdd: () => void; onBulk: () => void; onEdit: (item: Clothing) => void; onFavorite: (item: Clothing) => void; busy: boolean
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'すべて'>('すべて');
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [sort, setSort] = useState('newest');
  const [season, setSeason] = useState('すべて');
  const [storage, setStorage] = useState('すべて');
  const shown = filterClothing(items, query, category, onlyFavorite).filter(item =>
    (season === 'すべて' || inSeason(item, season as typeof SEASONS[number])) &&
    (storage === 'すべて' || (storage === '収納中' ? item.archived : !item.archived))).sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name, 'ja', { numeric: true }) :
    sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) :
    sort === 'updated' ? b.updatedAt.localeCompare(a.updatedAt) : b.createdAt.localeCompare(a.createdAt));
  const filtered = Boolean(query || category !== 'すべて' || onlyFavorite || season !== 'すべて' || storage !== 'すべて');
  const reset = () => { setQuery(''); setCategory('すべて'); setOnlyFavorite(false); setSeason('すべて'); setStorage('すべて'); };
  return <>
    <div className="page-intro"><div><p className="eyebrow">MY WARDROBE</p><h2>クローゼット</h2><p>お気に入りも、季節のお洋服も。ここがすべての定位置。</p></div><div className="planning-actions"><button className="button button-outline" onClick={onBulk}>まとめて登録</button><button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} /> 1着ずつ登録</button></div></div>
    <div className="toolbar"><label className="search-box"><Icon name="search" size={19} /><span className="sr-only">服を検索</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="名前・ブランド・カラーで検索" /></label><button className={'filter-fav ' + (onlyFavorite ? 'selected' : '')} aria-pressed={onlyFavorite} onClick={() => setOnlyFavorite(!onlyFavorite)}><Icon name="heart" size={18} /> お気に入り</button></div>
    <div className="category-pills" aria-label="カテゴリーで絞り込み">{(['すべて', ...CATEGORIES] as const).map(c => <button key={c} className={'pill ' + (category === c ? 'active' : '')} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div>
    <div className="planning-controls"><label className="sort-control">季節<select value={season} onChange={e => setSeason(e.target.value)}>{['すべて', ...SEASONS].map(s => <option key={s}>{s}</option>)}</select></label><label className="sort-control">衣替え<select value={storage} onChange={e => setStorage(e.target.value)}>{['すべて', '着用中', '収納中'].map(s => <option key={s}>{s}</option>)}</select></label></div>
    <div className="collection-summary"><span className="results-count" role="status">{shown.length} / {items.length} アイテム</span><label className="sort-control">並べ替え <select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">登録が新しい順</option><option value="oldest">登録が古い順</option><option value="updated">更新が新しい順</option><option value="name">名前順</option></select></label>{filtered && <button className="section-link" onClick={reset}>絞り込みを解除</button>}</div>
    {shown.length ? <div className="garment-grid wardrobe-grid">{shown.map(i => <GarmentCard key={i.id} item={i} service={service} onEdit={onEdit} onFavorite={onFavorite} busy={busy} />)}</div> :
      <EmptyState title={items.length ? '条件に合う服が見つかりません' : 'クローゼットはまだ空っぽです'} description={items.length ? '検索ワードやフィルターを変更してください。' : '服を追加して、あなたのコレクションを作りましょう。'} onAdd={items.length ? reset : onAdd} action={items.length ? '絞り込みを解除' : '服を登録する'} />}
  </>;
}
function CalendarView({ items, wears, busy, onToggle, onAdd }: {
  items: Clothing[]; wears: WearEntry[]; busy: boolean; onToggle: (item: Clothing, date: string) => void; onAdd: () => void
}) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(todayLocal);
  const [query, setQuery] = useState('');
  const available = filterClothing(items, query, 'すべて', false);
  const dateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const wear of wears) counts.set(wear.date, (counts.get(wear.date) ?? 0) + 1);
    return counts;
  }, [wears]);
  const firstWeekday = (month.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1 - firstWeekday));
  const selectedWears = wears.filter(w => w.date === selected);
  const worn = new Set(selectedWears.map(w => w.clothingId));
  return <>
    <div className="page-intro"><div><p className="eyebrow">STYLE JOURNAL</p><h2>着用カレンダー</h2><p>今日のコーデを記録して、あなたのスタイルを振り返ろう。</p></div></div>
    <div className="calendar-layout">
      <section className="calendar-panel" aria-label="着用日カレンダー">
        <div className="calendar-head"><h3>{month.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</h3><div><button className="button button-ghost" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(todayLocal()); }}>今日</button><button className="icon-button" aria-label="前の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="left" /></button><button className="icon-button" aria-label="次の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="right" /></button></div></div>
        <div className="calendar-grid">
          {['月','火','水','木','金','土','日'].map(day => <span className="weekday" key={day}>{day}</span>)}
          {cells.map(day => {
            const key = dateKey(day);
            const count = dateCounts.get(key) ?? 0;
            return <button key={key} className={'day-cell ' + (day.getMonth() !== month.getMonth() ? 'outside ' : '') + (key === todayLocal() ? 'today ' : '') + (key === selected ? 'selected ' : '')} aria-pressed={key === selected} aria-label={niceDate(key) + (count ? '、着用' + count + '件' : '')} onClick={() => { setSelected(key); if (day.getMonth() !== month.getMonth()) setMonth(new Date(day.getFullYear(), day.getMonth(), 1)); }}>
              <span>{day.getDate()}</span>{count > 0 && <i aria-hidden="true" className="wear-dot" />}
            </button>;
          })}
        </div>
      </section>
      <section className="wear-panel">
        <p className="eyebrow">OUTFIT OF THE DAY</p><h3>{niceDate(selected)}</h3><p className="wear-hint">この日に着た服をタップして記録できます。</p>
        {items.length > 0 && <label className="search-box wear-search"><Icon name="search" size={18} /><span className="sr-only">記録する服を検索</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="記録する服を検索" /></label>}
        {items.length > 0 && !available.length && <p className="panel-empty" role="status">条件に合う服はありません。</p>}
        {items.length ? <div className="wear-options">{available.map(item => <button key={item.id} className={'wear-option ' + (worn.has(item.id) ? 'worn' : '')} aria-pressed={worn.has(item.id)} onClick={() => onToggle(item, selected)} disabled={busy}><span className="wear-option-icon"><Icon name="hanger" size={19} /></span><span><strong>{item.name}</strong><small>{item.category}</small></span><span className="wear-check">{worn.has(item.id) && <Icon name="check" size={14} />}</span></button>)}</div> : <EmptyState title="服を追加しましょう" description="記録したい服をクローゼットへ登録してください。" onAdd={onAdd} />}
        {items.length > 0 && <p className="wear-summary">{selectedWears.length ? selectedWears.length + '着を記録しました' : 'まだ着用記録はありません'}</p>}
      </section>
    </div>
  </>;
}
function Insights({ items, wears, onEdit }: { items: Clothing[]; wears: WearEntry[]; onEdit: (item: Clothing) => void }) {
  const analysis = wardrobeAnalysis(items, wears);
  const counts = getWearCounts(wears);
  const ranking = items.filter(i => counts.has(i.id)).sort((a,b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)).slice(0, 5);
  const categories = CATEGORIES.map(category => ({ category, count: items.filter(item => item.category === category).length })).filter(row => row.count > 0);
  const max = Math.max(1, ...categories.map(row => row.count));
  return <>
    <div className="page-intro"><div><p className="eyebrow">YOUR STYLE IN NUMBERS</p><h2>スタイル分析</h2><p>持っている服と、着ている服。数字から見つけるわたしらしさ。</p></div></div>
    <div className="metric-grid">
      <div className="metric"><div className="metric-head"><span>総アイテム数</span><span className="metric-icon lavender"><Icon name="hanger" /></span></div><strong>{items.length}<small> 着</small></strong></div>
      <div className="metric"><div className="metric-head"><span>着用記録</span><span className="metric-icon mint"><Icon name="calendar" /></span></div><strong>{wears.length}<small> 回</small></strong></div>
      <div className="metric"><div className="metric-head"><span>着用した服</span><span className="metric-icon peach"><Icon name="sparkles" /></span></div><strong>{counts.size}<small> 着</small></strong></div>
    </div>
    <div className="metric-grid"><div className="metric"><div className="metric-head">まだ着ていない服</div><strong>{analysis.unworn.length}<small> 着</small></strong><p>収納中の服を除く・記録ベース</p></div><div className="metric"><div className="metric-head">衣替えで収納中</div><strong>{analysis.archivedCount}<small> 着</small></strong><p>削除せず着用履歴も残します</p></div><div className="metric"><div className="metric-head">登録した購入金額</div><strong className="money-value">¥{analysis.totalPurchasePrice.toLocaleString('ja-JP')}</strong><p>{analysis.pricedCount}着の金額入力分のみ</p></div></div>
    <div className="insight-grid content-section"><section className="insight-panel"><p className="eyebrow">REDISCOVER YOUR CLOSET</p><h3>次に着てみたい服</h3>{analysis.unworn.length ? <div className="outfit-list">{analysis.unworn.slice(0, 8).map(item => <button className="wear-option" key={item.id} onClick={() => onEdit(item)}><span><strong>{item.name}</strong><small>{item.category} · 着用記録なし</small></span><Icon name="right" size={18} /></button>)}</div> : <p className="panel-empty">着用中の服はすべて記録済み、またはまだ服が登録されていません。</p>}</section><section className="insight-panel"><p className="eyebrow">COST PER WEAR</p><h3>1回着るあたりの金額</h3><p className="panel-description">購入金額 ÷ 着用記録数。金額未入力・未着用の服は含めません。高い順に表示します。</p>{analysis.costPerWear.length ? <div className="outfit-list">{analysis.costPerWear.slice(0, 5).map(({ item, cost }) => <button className="wear-option" key={item.id} onClick={() => onEdit(item)}><span><strong>{item.name}</strong><small>{counts.get(item.id)}回着用</small></span><strong>¥{Math.round(cost).toLocaleString('ja-JP')} / 回</strong></button>)}</div> : <p className="panel-empty">購入金額と着用記録を入れると表示されます。</p>}</section></div>
    <div className="insight-grid content-section">
      <section className="insight-panel"><p className="eyebrow">COLLECTION BREAKDOWN</p><h3>カテゴリー別アイテム</h3>
        {categories.length ? <div className="category-bars">{categories.map(row => <div className="bar-row" key={row.category}><div><span>{row.category}</span><strong>{row.count}着</strong></div><progress value={row.count} max={max}>{row.count}</progress></div>)}</div> : <p className="panel-empty">アイテムを登録すると分析できます。</p>}
      </section>
      <section className="insight-panel"><p className="eyebrow">MOST WORN</p><h3>よく着るアイテム</h3>
        {ranking.length ? <ol className="ranking">{ranking.map((item, index) => <li key={item.id}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><small>{item.category}</small></div><span className="rank-count">{counts.get(item.id)} 回</span></li>)}</ol> : <p className="panel-empty">カレンダーで着用記録を付けるとランキングが表示されます。</p>}
      </section>
    </div>
  </>;
}
function Settings({ service, onReload, onNotice, busy, setBusy }: {
  service: ClozyService; onReload: () => Promise<void>; onNotice: (notice: Notice) => void; busy: boolean; setBusy: (busy: boolean) => void
}) {
  const [protectedByPasskey, setProtectedByPasskey] = useState(hasPasskey);
  async function changePasskey() {
    if (busy) return;
    if (!protectedByPasskey && !window.confirm('パスキーを紛失するとClozyから復旧できません。先にバックアップを保存してください。登録しますか？')) return;
    setBusy(true);
    try {
      if (protectedByPasskey) await removePasskey(); else await registerPasskey();
      setProtectedByPasskey(hasPasskey());
      onNotice({ kind: 'success', message: protectedByPasskey ? 'アプリロックを解除しました。' : 'パスキーを登録しました。次回から本人確認が必要です。' });
    } catch (error) { onNotice({ kind: 'error', message: passkeyError(error) }); }
    finally { setBusy(false); }
  }
  async function download() {
    setBusy(true);
    try {
      const data = await service.exportBackup();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'clozy-backup-' + todayLocal() + '.json'; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onNotice({ kind: 'success', message: 'バックアップを作成しました。安全な場所に保存してください。' });
    } catch (error) { onNotice({ kind: 'error', message: error instanceof Error ? error.message : 'エクスポートに失敗しました' }); }
    finally { setBusy(false); }
  }
  async function restore(file?: File) {
    if (!file || !window.confirm('現在の衣服・写真・着用記録をすべて上書きします。続行しますか？')) return;
    setBusy(true);
    try { await service.importBackup(file); await onReload(); onNotice({ kind: 'success', message: 'バックアップを復元しました。' }); }
    catch (error) { onNotice({ kind: 'error', message: error instanceof Error ? error.message : '復元に失敗しました' }); }
    finally { setBusy(false); }
  }
  async function clear() {
    if (!window.confirm('すべてのローカルデータを完全に削除します。元には戻せません。続行しますか？')) return;
    setBusy(true);
    try {
      await service.clearAll();
      await onReload();
      onNotice({ kind: 'success', message: 'すべてのデータを削除しました。' });
    } catch (error) { onNotice({ kind: 'error', message: error instanceof Error ? error.message : '削除に失敗しました' }); }
    finally { setBusy(false); }
  }
  return <>
    <div className="page-intro"><div><p className="eyebrow">YOUR SETTINGS</p><h2>設定とプライバシー</h2><p>保存先とアカウントを自分で選べます。</p></div></div>
    <CloudAccount service={service} onReload={onReload} />
    <section className="settings-highlight"><div className="settings-highlight-icon"><Icon name="shield" size={27} /></div><div><h3>データはこの端末のブラウザに保存されます</h3><p>Clozyはアカウントなしでも使えます。通常は端末内に保存し、ログイン後にクラウド保存を選択したときだけバックアップを送信します。ブラウザデータを消去する前にバックアップしてください。</p></div></section>
    <div className="settings-card"><div><h3>パスキーでアプリをロック {protectedByPasskey ? '・有効' : ''}</h3><p>端末の顔・指紋・PINで本人確認します。再読み込み時と、1分以上バックグラウンドにした時にロックします。サーバー認証やデータ暗号化ではなく、ブラウザの保存内容を直接操作できる人からは保護できません。パスキーはバックアップに含まれません。</p>{!supportsPasskey() && <p>HTTPSとWebAuthnに対応したブラウザが必要です。開発時はIPアドレスではなくlocalhostで開いてください。</p>}</div><button className="button button-outline" disabled={busy || !supportsPasskey()} onClick={() => void changePasskey()}>{protectedByPasskey ? '本人確認して解除' : 'パスキーを登録'}</button>{protectedByPasskey && <button className="button button-primary" disabled={busy} onClick={() => window.dispatchEvent(new Event('clozy-lock'))}>今すぐロック</button>}</div>
    <div className="settings-card"><div><h3>データをバックアップ</h3><p>写真・服の情報・着用履歴をまとめてJSONファイルに保存します。ファイルは暗号化されません。</p></div><button className="button button-outline" onClick={() => void download()} disabled={busy}><Icon name="download" size={18} /> エクスポート</button></div>
    <div className="settings-card"><div><h3>データを復元</h3><p>以前のバックアップから復元します。現在のデータはすべて置き換わります。</p></div><label className={'button button-outline file-label ' + (busy ? 'disabled' : '')}><Icon name="upload" size={18} /> インポート<input type="file" accept="application/json,.json" disabled={busy} onChange={e => { void restore(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
    <div className="settings-card danger-zone"><div><h3>すべてのデータを削除</h3><p>このブラウザに保存されたClozyのデータを消去します。元には戻せません。</p></div><button className="button button-danger-outline" onClick={() => void clear()} disabled={busy}><Icon name="trash" size={18} /> 全データを削除</button></div>
    <div className="privacy-footnote"><Icon name="shield" size={18} /><p>保存データとバックアップは暗号化されていません。共有端末やブラウザ拡張機能からアクセスされる可能性があります。端末のロックとバックアップの安全な保管を推奨します。</p></div>
  </>;
}
export default function App() {
  const service = useMemo(() => new ClozyService(new IndexedDbRepository()), []);
  const [view, setView] = useState<View>('home');
  const [items, setItems] = useState<Clothing[]>([]);
  const [wears, setWears] = useState<WearEntry[]>([]);
  const [selected, setSelected] = useState<Clothing | 'new' | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const reload = useCallback(async () => {
    const data = await service.list();
    setItems(data.clothing); setWears(data.wears);
  }, [service]);
  useEffect(() => {
    let live = true;
    void reload().catch(error => {
      if (live) { setLoadFailed(true); setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'ローカルデータを読み込めません' }); }
    }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [reload]);
  async function execute(action: () => Promise<void>, message: string) {
    if (busy) return false;
    setBusy(true); setNotice(null);
    try { await action(); await reload(); setNotice({ kind: 'success', message }); return true; }
    catch (error) { setNotice({ kind: 'error', message: error instanceof Error ? error.message : '操作に失敗しました' }); return false; }
    finally { setBusy(false); }
  }
  async function remove(item: Clothing) {
    if (!window.confirm('「' + item.name + '」と関連する着用記録を削除しますか？')) return;
    if (await execute(() => service.remove(item.id), 'アイテムを削除しました。')) setSelected(null);
  }
  function changeView(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  const title = nav.find(item => item.key === view)?.title ?? 'ホーム';
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">本文へスキップ</a>
    <aside className="sidebar" aria-label="メインナビゲーション">
      <button className="brand" onClick={() => changeView('home')} aria-label="Clozy ホームへ"><span className="brand-mark"><Icon name="hanger" size={24} /></span><span>clozy<span className="brand-dot">.</span></span></button>
      <div className="sidebar-group"><p className="sidebar-label">MY WARDROBE</p><nav>{nav.map(item => <button key={item.key} className={'nav-link ' + (view === item.key ? 'active' : '')} aria-current={view === item.key ? 'page' : undefined} onClick={() => changeView(item.key)}><Icon name={item.icon} size={20} /><span>{item.title}</span>{view === item.key && <span className="nav-active-dot" />}</button>)}</nav></div>
      <div className="sidebar-bottom"><div className="privacy-card"><span><Icon name="shield" size={19} /></span><strong>Private by design</strong><p>通常は端末内で保存。<br />クラウド保存は任意。</p></div><span className="sidebar-version">CLOZY · YOUR SPACE</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><Icon name="hanger" size={19} /></span><strong>clozy<span className="brand-dot">.</span></strong></div><div className="breadcrumb"><span>MY WARDROBE</span><Icon name="right" size={15} /><strong>{title}</strong></div><div className="topbar-right"><span className="local-badge"><Icon name="shield" size={15} /> 端末内保存</span><button className="mobile-settings" type="button" aria-label="設定を開く" aria-current={view === 'settings' ? 'page' : undefined} onClick={() => changeView('settings')}><Icon name="settings" size={21} /></button><span className="topbar-avatar" aria-label="あなたのクローゼット">C</span></div></header>
      <main className="main-content" id="main-content" tabIndex={-1}>
        {notice && <div className={'notice ' + notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="通知を閉じる"><Icon name="close" size={16} /></button></div>}
        {loading ? <div className="loading-state" role="status">クローゼットを読み込んでいます…</div> : loadFailed ? <EmptyState title="保存データを読み込めませんでした" description="データは削除していません。別のタブを閉じ、ブラウザの保存設定を確認してから再読み込みしてください。" onAdd={() => window.location.reload()} action="再読み込み" /> : <>
          {view === 'home' && <Home items={items} wears={wears} service={service} onAdd={() => setSelected('new')} onGo={changeView} onEdit={setSelected} onFavorite={i => void execute(() => service.favorite(i), 'お気に入りを更新しました。')} busy={busy} />}
          {view === 'wardrobe' && <Wardrobe items={items} service={service} onAdd={() => setSelected('new')} onBulk={() => setBulkOpen(true)} onEdit={setSelected} onFavorite={i => void execute(() => service.favorite(i), 'お気に入りを更新しました。')} busy={busy} />}
          {view === 'planning' && <Planning items={items} wears={wears} busy={busy} onAdd={() => setSelected('new')} onEdit={setSelected} onRecord={(outfit, date) => void execute(() => service.recordOutfit(outfit, date, wears), '組み合わせを着用記録に追加しました。')} />}
          {view === 'calendar' && <CalendarView items={items} wears={wears} busy={busy} onToggle={(item, date) => void execute(() => service.toggleWear(item, date, wears), '着用記録を更新しました。')} onAdd={() => setSelected('new')} />}
          {view === 'insights' && <Insights items={items} wears={wears} onEdit={setSelected} />}
          {view === 'settings' && <Settings service={service} onReload={reload} onNotice={setNotice} busy={busy} setBusy={setBusy} />}
        </>}
      </main>
      <footer className="page-footer">Clozy — A place for every piece. <span>Everyday, in your own style.</span></footer>
    </div>
    <nav className="mobile-nav" aria-label="モバイルナビゲーション">{nav.filter(item => item.key !== 'settings').map(item => <button key={item.key} className={view === item.key ? 'active' : ''} aria-current={view === item.key ? 'page' : undefined} onClick={() => changeView(item.key)}><Icon name={item.icon} size={21} /><span>{item.title}</span></button>)}</nav>
    <button className="mobile-add" type="button" onClick={() => setSelected('new')} aria-label="アイテムを追加"><Icon name="plus" size={18} /> 服を追加</button>
    {bulkOpen && <BulkAdd service={service} items={items} onClose={() => setBulkOpen(false)} onSaved={reload} />}
    {selected && <GarmentForm key={selected === 'new' ? 'new' : selected.id} service={service} current={selected === 'new' ? undefined : selected} onClose={() => setSelected(null)} onSaved={async () => { await reload(); setSelected(null); setNotice({ kind: 'success', message: 'アイテムを保存しました。' }); }} onDelete={remove} busy={busy} />}
  </div>;
}
