import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, SEASONS } from '@clozy/domain';
import type { Category, Clothing } from '@clozy/domain';
import type { ClozyService } from '@clozy/application';
import { processPhoto } from '@clozy/storage';
import Icon from './Icon';

type Row = { id: number; file?: File; name: string; category: Category; status: 'ready' | 'saved' | 'error'; error?: string };
function Thumbnail({ file }: { file?: File }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => { if (!file) return; const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return url ? <img src={url} alt="" /> : <Icon name="hanger" size={24} />;
}
export default function BulkAdd({ service, items, onClose, onSaved }: { service: ClozyService; items: Clothing[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nextId = useRef(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [category, setCategory] = useState<Category>('トップス');
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const d = dialog.current; d?.showModal(); return () => { if (d?.open) d.close(); }; }, []);
  const unsaved = rows.some(row => row.status !== 'saved');
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    if (unsaved) window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);
  function close() { if (!pending && (!unsaved || window.confirm('未登録のアイテムを破棄しますか？'))) dialog.current?.close(); }
  function append(newRows: Omit<Row, 'id' | 'status'>[]) {
    if (rows.length + newRows.length > 20) { setError('一度に20着までです。登録済みの服を閉じてから続きを登録してください。'); return; }
    setRows(previous => [...previous, ...newRows.map(row => ({ ...row, id: nextId.current++, status: 'ready' as const }))]); setError('');
  }
  async function save() {
    if (pending) return;
    if (rows.some(row => row.status !== 'saved' && (!row.name.trim() || row.name.trim().length > 80))) { setError('未登録の服すべてに1〜80文字の名前を入力してください。'); return; }
    setPending(true); setError('');
    try {
      for (const row of rows) {
        if (row.status === 'saved') continue;
        try {
          const image = row.file ? await processPhoto(row.file) : undefined;
          await service.add({ name: row.name, category: row.category, brand: '', color: '', size: '', notes: '', favorite: false, seasons: [...SEASONS], archived: false }, image);
          setRows(previous => previous.map(r => r.id === row.id ? { ...r, status: 'saved', error: undefined } : r));
        } catch (e) { setRows(previous => previous.map(r => r.id === row.id ? { ...r, status: 'error', error: e instanceof Error ? e.message : '登録できませんでした' } : r)); }
      }
      await onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : '一覧を更新できませんでした。登録済みの行は再登録されません。'); }
    finally { setPending(false); }
  }
  const remaining = rows.filter(r => r.status !== 'saved').length;
  return <dialog ref={dialog} className="editor-dialog bulk-dialog" onClose={() => { if (!dialog.current?.open) onClose(); }} onCancel={e => { e.preventDefault(); close(); }} aria-labelledby="bulk-title"><div className="dialog-head"><div><p className="eyebrow">A LITTLE LESS TYPING</p><h2 id="bulk-title">服をまとめて登録</h2></div><button className="icon-button" disabled={pending} onClick={close} aria-label="閉じる"><Icon name="close" /></button></div>
    <div className="editor-form"><p className="panel-description">写真を複数選ぶか、名前を1行に1着ずつ入力。名前とカテゴリーを確認して登録できます。詳しい情報は後から編集できます。</p><label className="sort-control">追加時のカテゴリー<select value={category} disabled={pending} onChange={e => setCategory(e.target.value as Category)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
      <div className="bulk-inputs"><label className="button button-outline file-label"><Icon name="image" size={18} />写真から追加<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={e => { const files = Array.from(e.target.files ?? []); append(files.map(file => ({ file, name: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').slice(0, 80), category }))); e.target.value = ''; }} /></label><span className="panel-description">JPEG・PNG・WebP / 各10MB以下 / 最大20着</span></div>
      <div className="field"><label htmlFor="bulk-names">写真なしで名前から追加（1行に1着）</label><textarea id="bulk-names" rows={3} maxLength={1700} value={text} disabled={pending} onChange={e => setText(e.target.value)} placeholder={'白いTシャツ\n黒のパンツ\n通勤用スニーカー'} /><button className="button button-outline" disabled={pending || !text.trim()} onClick={() => { const names = text.split(/\r?\n/).map(n => n.trim()).filter(Boolean); if (rows.length + names.length <= 20) { append(names.map(name => ({ name, category }))); setText(''); } else setError('一度に20着まで追加できます。'); }}>名前をリストに追加</button></div>
      <div className="bulk-rows">{rows.map(row => <div className={'bulk-row ' + row.status} key={row.id}><span className="bulk-thumbnail"><Thumbnail file={row.file} /></span><div><label className="sr-only" htmlFor={'bulk-name-' + row.id}>アイテム名</label><input id={'bulk-name-' + row.id} value={row.name} maxLength={80} disabled={pending || row.status === 'saved'} onChange={e => setRows(previous => previous.map(r => r.id === row.id ? { ...r, name: e.target.value } : r))} /><label className="sr-only" htmlFor={'bulk-category-' + row.id}>カテゴリー</label><select id={'bulk-category-' + row.id} value={row.category} disabled={pending || row.status === 'saved'} onChange={e => setRows(previous => previous.map(r => r.id === row.id ? { ...r, category: e.target.value as Category } : r))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>{row.status === 'saved' ? <small role="status">登録済み ✓</small> : row.error ? <small role="alert">{row.error}</small> : items.some(i => i.name === row.name.trim()) ? <small>同じ名前の服があります。重複でないかご確認ください。</small> : null}</div><button className="icon-button" disabled={pending} aria-label={row.name + 'をリストから外す（保存した服は削除しません）'} onClick={() => setRows(previous => previous.filter(r => r.id !== row.id))}><Icon name="close" size={18} /></button></div>)}</div>
      {error && <p className="form-error" role="alert">{error}</p>}<p className="panel-description" role="status">{rows.filter(r => r.status === 'saved').length}着登録済み / {remaining}着未登録。失敗した行だけ再試行できます。</p><div className="dialog-actions"><button className="button button-ghost" disabled={pending} onClick={close}>閉じる</button><button className="button button-primary" disabled={pending || !remaining} onClick={() => void save()}>{pending ? '1着ずつ登録しています…' : remaining + '着を登録'}</button></div>
    </div></dialog>;
}
