import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Clothing, WearEntry } from '@clozy/domain';
import { CATEGORIES, filterClothing, getWearCounts, wardrobeAnalysis } from '@clozy/domain';
import { ClozyService } from '@clozy/application';
import { IndexedDbRepository } from '@clozy/storage';
import { PreviewWardrobeRepository, isReviewHost, isPreviewDeployment } from './PreviewWardrobe';
import Icon from './Icon';
import type { IconName } from './Icon';
import GarmentForm from './GarmentForm';
import BulkAdd from './BulkAdd';
import Planning from './Planning';
import CloudAccount from './CloudAccount';
import ClosetRail from './ClosetRail';
import { GarmentThumb } from './GarmentVisual';
import { hasPasskey, supportsPasskey, registerPasskey, removePasskey, passkeyError } from './passkey';

type View = 'home' | 'wardrobe' | 'planning' | 'calendar' | 'insights' | 'settings';
type Notice = { message: string; kind: 'success' | 'error' };
const waypoints: { key: View; title: string; icon: IconName }[] = [
  { key: 'home', title: 'クローゼット', icon: 'hanger' },
  { key: 'wardrobe', title: '服を整理', icon: 'grid' },
  { key: 'planning', title: 'コーデ', icon: 'sparkles' },
  { key: 'calendar', title: '着用記録', icon: 'calendar' },
  { key: 'insights', title: '服を見直す', icon: 'chart' },
  { key: 'settings', title: '設定', icon: 'settings' }
];
const todayLocal = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
};
const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const niceDate = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });

function EmptyState({ title, description, onAdd, action = '服を登録する' }: { title: string; description: string; onAdd?: () => void; action?: string }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="hanger" size={38} /></span><h3>{title}</h3><p>{description}</p>{onAdd && <button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} /> {action}</button>}</div>;
}
function Home({ items, service, onAdd, onBulk, onGo, onEdit, onFavorite, onWearToday, wornToday, busy }: {
  items: Clothing[]; wears: WearEntry[]; service: ClozyService; onAdd: () => void; onBulk: () => void; onGo: (view: View) => void;
  onEdit: (item: Clothing) => void; onFavorite: (item: Clothing) => void; onWearToday: (item: Clothing) => void;
  wornToday: ReadonlySet<string>; busy: boolean;
}) {
  return <ClosetRail mode="home" items={items} service={service} busy={busy} wornToday={wornToday}
    onAdd={onAdd} onBulk={onBulk} onEdit={onEdit} onFavorite={onFavorite} onWearToday={onWearToday} onGo={onGo} />;
}
function Wardrobe({ items, service, onAdd, onBulk, onEdit, onFavorite, onWearToday, wornToday, onGo, busy }: {
  items: Clothing[]; service: ClozyService; onAdd: () => void; onBulk: () => void;
  onEdit: (item: Clothing) => void; onFavorite: (item: Clothing) => void; onWearToday: (item: Clothing) => void;
  wornToday: ReadonlySet<string>; onGo: (view: View) => void; busy: boolean;
}) {
  return <ClosetRail mode="wardrobe" items={items} service={service} busy={busy} wornToday={wornToday}
    onAdd={onAdd} onBulk={onBulk} onEdit={onEdit} onFavorite={onFavorite} onWearToday={onWearToday} onGo={onGo} />;
}
function CalendarView({ items, wears, busy, onToggle, onAdd, service }: {
  items: Clothing[]; wears: WearEntry[]; busy: boolean; onToggle: (item: Clothing, date: string) => void; onAdd: () => void; service: ClozyService
}) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(todayLocal);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'month' | 'week' | 'list'>('month');
  const available = filterClothing(items, query, 'すべて', false);
  const dateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const wear of wears) counts.set(wear.date, (counts.get(wear.date) ?? 0) + 1);
    return counts;
  }, [wears]);
  const firstWeekday = (month.getDay() + 6) % 7;
  const allCells = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1 - firstWeekday));
  const selectedDay = new Date(selected + 'T12:00:00');
  const weekStart = new Date(selectedDay); weekStart.setDate(selectedDay.getDate() - (selectedDay.getDay() + 6) % 7);
  const cells = mode === 'week' ? Array.from({length:7}, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)) : allCells;
  const itemIndex = new Map(items.map(item => [item.id, item]));
  const firstWorn = new Map<string, Clothing>();
  for (const wear of wears) { const item = itemIndex.get(wear.clothingId); if (item && !firstWorn.has(wear.date)) firstWorn.set(wear.date, item); }
  const selectedWears = wears.filter(w => w.date === selected);
  const worn = new Set(selectedWears.map(w => w.clothingId));
  return <>
    <div className="closet-banner">
      <div><h2>カレンダー</h2></div>
      <div className="closet-banner-art" aria-hidden="true"><span /><span /><span /></div>
    </div>
    <div className="calendar-day-review" role="status"><span>{niceDate(selected)}</span><span>{selectedWears.length}着</span></div>
    <div className="calendar-layout">
      <section className="calendar-panel" aria-label="着用日カレンダー">
        <div className="calendar-mode" role="group" aria-label="カレンダー表示">{([["month","月"],["week","週"],["list","リスト"]] as const).map(([key,label])=><button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}</div>
        <div className="calendar-head"><h3>{month.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}</h3><div><button className="button button-ghost" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(todayLocal()); }}>今日</button><button className="icon-button" aria-label="前の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="left" /></button><button className="icon-button" aria-label="次の月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="right" /></button></div></div>
        {mode !== 'list' ? <div className="calendar-grid">
          {['月','火','水','木','金','土','日'].map(day => <span className="weekday" key={day}>{day}</span>)}
          {cells.map(day => {
            const key = dateKey(day);
            const count = dateCounts.get(key) ?? 0;
            return <button key={key} className={'day-cell ' + (day.getMonth() !== month.getMonth() ? 'outside ' : '') + (key === todayLocal() ? 'today ' : '') + (key === selected ? 'selected ' : '')} aria-pressed={key === selected} aria-label={niceDate(key) + (count ? '、着用' + count + '件' : '')} onClick={() => { setSelected(key); if (day.getMonth() !== month.getMonth()) setMonth(new Date(day.getFullYear(), day.getMonth(), 1)); }}>
              <span>{day.getDate()}</span>{firstWorn.has(key) ? <GarmentThumb item={firstWorn.get(key)!} service={service} className="calendar-mini"/> : count > 0 ? <i aria-hidden="true" className="wear-dot" /> : null}
            </button>;
          })}
        </div> : <div className="calendar-list">{[...new Set(wears.map(w=>w.date))].sort().reverse().filter(day=>day.startsWith(dateKey(month).slice(0,7))).map(day =>
          <button key={day} type="button" onClick={() => setSelected(day)} className="calendar-list-row">
            <span>{niceDate(day)}</span><span className="calendar-list-images">{wears.filter(w=>w.date===day).slice(0,4).map(w=>{ const item=itemIndex.get(w.clothingId); return item ? <GarmentThumb key={w.id} item={item} service={service}/> : null; })}</span><Icon name="right" size={18}/>
          </button>)}</div>}
      </section>
      <section className="wear-panel">
        <p className="eyebrow">OUTFIT OF THE DAY</p><h3>{niceDate(selected)}</h3><p className="wear-hint">着た服を選択</p>
        {items.length > 0 && <label className="search-box wear-search"><Icon name="search" size={18} /><span className="sr-only">記録する服を検索</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="記録する服を検索" /></label>}
        {items.length > 0 && !available.length && <p className="panel-empty" role="status">条件に合う服はありません。</p>}
        {items.length ? <div className="wear-options">{available.map(item => <button key={item.id} className={'wear-option ' + (worn.has(item.id) ? 'worn' : '')} aria-pressed={worn.has(item.id)} onClick={() => onToggle(item, selected)} disabled={busy}><GarmentThumb item={item} service={service} className="wear-mini"/><span><strong>{item.name}</strong><small>{item.category}</small></span><span className="wear-check">{worn.has(item.id) && <Icon name="check" size={14} />}</span></button>)}</div> : <EmptyState title="服を追加しましょう" description="記録したい服をクローゼットへ登録してください。" onAdd={onAdd} />}
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
    <div className="closet-banner">
      <div><h2>スタイル分析</h2></div>
      <div className="closet-banner-art" aria-hidden="true"><span /><span /><span /></div>
    </div>
    <section className="category-overview" aria-labelledby="category-overview-heading"><h3 id="category-overview-heading">カテゴリーのバランス</h3><div className="category-overview-body">
      <div className="category-donut" style={{background: 'conic-gradient(' + CATEGORIES.map((c,i)=>{ const n=items.filter(x=>x.category===c).length; const total=Math.max(items.length,1); const before=items.filter(x=>CATEGORIES.indexOf(x.category)<i).length; return ['#6b4227','#a07750','#c4ab8c','#876e56','#d7c4ac','#9c8b77','#d7cdba','#eee4d7'][i] + ' ' + (before/total*100) + '% ' + ((before+n)/total*100) + '%'; }).join(',') + ')'}}><span>{items.length}<small>着</small></span></div>
      <div className="category-overview-legend">{CATEGORIES.map((c,i)=><div key={c}><i style={{background:['#6b4227','#a07750','#c4ab8c','#876e56','#d7c4ac','#9c8b77','#d7cdba','#eee4d7'][i]}}/><span>{c}</span><b>{items.filter(x=>x.category===c).length}</b></div>)}</div>
      </div></section>
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
    <div className="closet-banner">
      <div><h2>設定</h2></div>
      <div className="closet-banner-art" aria-hidden="true"><span /><span /><span /></div>
    </div>
    <nav className="settings-hub" aria-label="設定メニュー">
      {([['settings-account','user','アカウント'],['settings-backup','cloud','バックアップ'],['settings-lock','lock','プライバシー'],['settings-data','box','ローカル保存']] as const).map(([id,icon,title]) =>
        <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({behavior: 'smooth',block:'start'})}>
          <Icon name={icon} size={23}/><span>{title}</span><Icon name="right" size={18}/>
        </button>)}
    </nav>
    <div id="settings-account"><CloudAccount service={service} onReload={onReload} /></div>
    <section id="settings-data" className="settings-highlight"><div className="settings-highlight-icon"><Icon name="box" size={27} /></div><div><h3>この端末に保存</h3><p>クラウドへのバックアップは任意です。</p></div></section>
    <div id="settings-lock" className="settings-card"><div><h3>パスキーでアプリをロック {protectedByPasskey ? '・有効' : ''}</h3><p>端末の顔・指紋・PINで本人確認します。再読み込み時と、1分以上バックグラウンドにした時にロックします。サーバー認証やデータ暗号化ではなく、ブラウザの保存内容を直接操作できる人からは保護できません。パスキーはバックアップに含まれません。</p>{!supportsPasskey() && <p>HTTPSとWebAuthnに対応したブラウザが必要です。開発時はIPアドレスではなくlocalhostで開いてください。</p>}</div><button className="button button-outline" disabled={busy || !supportsPasskey()} onClick={() => void changePasskey()}>{protectedByPasskey ? '本人確認して解除' : 'パスキーを登録'}</button>{protectedByPasskey && <button className="button button-primary" disabled={busy} onClick={() => window.dispatchEvent(new Event('clozy-lock'))}>今すぐロック</button>}</div>
    <div id="settings-backup" className="settings-card"><div><h3>データをバックアップ</h3><p>写真・服の情報・着用履歴をまとめてJSONファイルに保存します。ファイルは暗号化されません。</p></div><button className="button button-outline" onClick={() => void download()} disabled={busy}><Icon name="download" size={18} /> エクスポート</button></div>
    <div className="settings-card"><div><h3>データを復元</h3><p>以前のバックアップから復元します。現在のデータはすべて置き換わります。</p></div><label className={'button button-outline file-label ' + (busy ? 'disabled' : '')}><Icon name="upload" size={18} /> インポート<input type="file" accept="application/json,.json" disabled={busy} onChange={e => { void restore(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
    <div className="settings-card danger-zone"><div><h3>すべてのデータを削除</h3><p>このブラウザに保存されたClozyのデータを消去します。元には戻せません。</p></div><button className="button button-danger-outline" onClick={() => void clear()} disabled={busy}><Icon name="trash" size={18} /> 全データを削除</button></div>
    <div className="privacy-footnote"><Icon name="shield" size={18} /><p>保存データとバックアップは暗号化されていません。共有端末やブラウザ拡張機能からアクセスされる可能性があります。端末のロックとバックアップの安全な保管を推奨します。</p></div>
  </>;
}
export default function App() {
  const realService = useMemo(() => new ClozyService(new IndexedDbRepository()), []);
  const previewService = useMemo(() => new ClozyService(new PreviewWardrobeRepository()), []);
  const reviewHost = isReviewHost(window.location.hostname);
  const [demoMode, setDemoMode] = useState(() => reviewHost && new URLSearchParams(window.location.search).get('demo') === '1');
  const service = demoMode ? previewService : realService;
  const [view, setView] = useState<View>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharedProduct, setSharedProduct] = useState<{name: string; sourceUrl: string} | null>(null);
  const [items, setItems] = useState<Clothing[]>([]);
  const [wears, setWears] = useState<WearEntry[]>([]);
  const [selected, setSelected] = useState<Clothing | 'new' | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const wornToday = useMemo(() => new Set(wears.filter(w => w.date === todayLocal()).map(w => w.clothingId)), [wears]);
  useEffect(() => {
    // Android PWA share target: never save or fetch a merchant URL without review.
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') !== 'share') return;
    const candidate = params.get('url') || params.get('text')?.match(/https:\/\/[^\s]+/)?.[0] || '';
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' && candidate.length <= 2048) {
        setSharedProduct({ name: (params.get('title') || '').trim().slice(0, 80), sourceUrl: url.toString() });
        setSelected('new');
      }
    } catch { /* Share data was not a product URL. Do not persist it. */ }
    // Product links can contain purchase tokens or tracking parameters.
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
  }, []);
  const reload = useCallback(async () => {
    const data = await service.list();
    // Public PR previews default to a synthetic in-memory wardrobe only when no
    // real local items exist. Never clone a private cloud backup into preview.
    if (!demoMode && isPreviewDeployment(window.location.hostname)
      && data.clothing.length === 0 && data.wears.length === 0
      && localStorage.getItem('clozy-preview-personal') !== '1'
      && !new URLSearchParams(window.location.search).has('from')) {
      setDemoMode(true);
      const sample = await previewService.list();
      setItems(sample.clothing); setWears(sample.wears);
      return;
    }
    setItems(data.clothing); setWears(data.wears);
  }, [service, demoMode, previewService]);
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
  function setPreviewMode(next: boolean) {
    if (!reviewHost) return;
    setMenuOpen(false); setSelected(null); setBulkOpen(false);
    localStorage.setItem('clozy-preview-personal', next ? '0' : '1');
    setDemoMode(next);
    setLoading(true);
    // Changing the service reference reloads the correct, isolated repository.
  }
  function changeView(next: View) {
    setMenuOpen(false);
    setView(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return <div className="app-shell" data-view={view}>
    {reviewHost && <div className={'preview-ribbon' + (demoMode ? ' is-demo' : '')} aria-label="プレビューのデータ切り替え">
      <span><strong>{demoMode ? 'SAMPLE CLOSET' : 'PREVIEW'}</strong> {demoMode ? '見本26着・履歴99件を再現 / 保存はこの画面内だけ' : '自分の端末のデータを表示中'}</span>
      <button type="button" onClick={() => setPreviewMode(!demoMode)}>{demoMode ? '自分のデータに切替' : '見本データを見る'}</button>
    </div>}
    <a className="skip-link" href="#main-content">本文へスキップ</a>
    <div className="main-shell">
      <main className="main-content" id="main-content" tabIndex={-1}>
        {notice && <div className={'notice ' + notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="通知を閉じる"><Icon name="close" size={16} /></button></div>}
        {loading ? <div className="loading-state" role="status">クローゼットを読み込んでいます…</div> : loadFailed ? <EmptyState title="保存データを読み込めませんでした" description="データは削除していません。別のタブを閉じ、ブラウザの保存設定を確認してから再読み込みしてください。" onAdd={() => window.location.reload()} action="再読み込み" /> : <>
          {view === 'home' && <Home items={items} wears={wears} service={service} onAdd={() => setSelected('new')} onBulk={() => setBulkOpen(true)} onGo={changeView} onEdit={setSelected} onFavorite={i => void execute(() => service.favorite(i), 'お気に入りを更新しました。')} onWearToday={i => void execute(() => service.toggleWear(i, todayLocal(), wears), '今日の着用記録を更新しました。')} wornToday={wornToday} busy={busy} />}
          {view === 'wardrobe' && <Wardrobe items={items} service={service} onAdd={() => setSelected('new')} onBulk={() => setBulkOpen(true)} onEdit={setSelected} onGo={changeView} onFavorite={i => void execute(() => service.favorite(i), 'お気に入りを更新しました。')} onWearToday={i => void execute(() => service.toggleWear(i, todayLocal(), wears), '今日の着用記録を更新しました。')} wornToday={wornToday} busy={busy} />}
          {view === 'planning' && <Planning items={items} wears={wears} service={service} busy={busy} onAdd={() => setSelected('new')} onEdit={setSelected} onRecord={(outfit, date) => void execute(() => service.recordOutfit(outfit, date, wears), '組み合わせを着用記録に追加しました。')} />}
          {view === 'calendar' && <CalendarView items={items} wears={wears} service={service} busy={busy} onToggle={(item, date) => void execute(() => service.toggleWear(item, date, wears), '着用記録を更新しました。')} onAdd={() => setSelected('new')} />}
          {view === 'insights' && <Insights items={items} wears={wears} onEdit={setSelected} />}
          {view === 'settings' && (demoMode ? <section className="preview-demo-settings">
            <h2>これは見本のクローゼットです</h2>
            <p>見本データは一時的なものです。本番の個人データやクラウドのバックアップには触れません。アカウント管理・バックアップの操作は無効です。</p>
            <button type="button" onClick={() => { setPreviewMode(false); changeView('settings'); }}>自分のデータで設定を開く</button>
          </section> : <Settings service={service} onReload={reload} onNotice={setNotice} busy={busy} setBusy={setBusy} />)}
        </>}
      </main>
    </div>
    <nav className="closet-wayfinder" aria-label="クローゼットの移動" onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false); }}>
      {menuOpen && <button type="button" className="wayfinder-scrim" aria-label="移動メニューを閉じる" onClick={() => setMenuOpen(false)} />}
      <button type="button" className="wayfinder-handle" aria-label="場所を移動" aria-expanded={menuOpen} aria-controls="clozy-wayfinder-panel" onClick={() => setMenuOpen(open => !open)}><Icon name={menuOpen ? 'close' : 'menu'} size={21} /></button>
      {menuOpen && <div className="wayfinder-panel" id="clozy-wayfinder-panel">
        <p className="wayfinder-title">CLOZY · MY WARDROBE</p>
        {waypoints.map(item => <button type="button" key={item.key} aria-current={view === item.key ? 'page' : undefined} onClick={() => changeView(item.key)}><Icon name={item.icon} size={19} /><span>{item.title}</span><Icon name="right" size={16} /></button>)}
        <button type="button" className="wayfinder-add" onClick={() => { setMenuOpen(false); setSelected('new'); }}><Icon name="plus" size={20} /><span>新しい服を登録</span></button>
      </div>}
    </nav>
    {bulkOpen && <BulkAdd service={service} items={items} onClose={() => setBulkOpen(false)} onSaved={reload} />}
    {selected && <GarmentForm key={selected === 'new' ? 'new' : selected.id} service={service} current={selected === 'new' ? undefined : selected} draft={sharedProduct ?? undefined} onClose={() => { setSelected(null); setSharedProduct(null); }} onSaved={async () => { await reload(); setSelected(null); setSharedProduct(null); setNotice({ kind: 'success', message: 'アイテムを保存しました。' }); }} onDelete={remove} busy={busy} />}
  </div>;
}
