import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CATEGORIES, SEASONS, inferCategory } from '@clozy/domain';
import type { Clothing, ClothingInput } from '@clozy/domain';
import { processPhoto } from '@clozy/storage';
import type { ClozyService } from '@clozy/application';
import Icon from './Icon';

const defaults: ClothingInput = {
  name: '', category: 'トップス', color: '', brand: '', size: '', notes: '', favorite: false, seasons: [...SEASONS], archived: false
};
function useExistingPhoto(service: ClozyService, id: string | undefined) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!id) { setUrl(undefined); return; }
    let cancelled = false;
    let objectUrl: string | undefined;
    void service.image(id).then(blob => {
      if (blob && !cancelled) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    }).catch(() => { if (!cancelled) setUrl(undefined); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [service, id]);
  return url;
}
export default function GarmentForm({
  service, current, onClose, onSaved, onDelete, busy
}: {
  service: ClozyService;
  current?: Clothing;
  onClose: () => void;
  onSaved: (keepOpen?: boolean) => Promise<void>;
  onDelete: (item: Clothing) => Promise<void>;
  busy: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [fields, setFields] = useState<ClothingInput>(current ? {
    name: current.name, category: current.category, brand: current.brand, color: current.color,
    size: current.size, notes: current.notes, favorite: current.favorite,
    seasons: current.seasons ?? [...SEASONS], archived: current.archived ?? false,
    sourceUrl: current.sourceUrl, purchasePrice: current.purchasePrice
  } : defaults);
  const [addAnother, setAddAnother] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [photo, setPhoto] = useState<Blob>();
  const [photoMode, setPhotoMode] = useState<'keep' | 'set' | 'remove'>('keep');
  const [preview, setPreview] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const existing = useExistingPhoto(service, current?.imageId);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { if (element?.open) element.close(); };
  }, []);
  useEffect(() => {
    if (!photo) { setPreview(undefined); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  function close() {
    if (busy || pending) return;
    if (!dirty || window.confirm('保存していない変更を破棄しますか？')) dialog.current?.close();
  }
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    if (dirty) window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function change<K extends keyof ClothingInput>(key: K, value: ClothingInput[K]) {
    setDirty(true);
    setFields(prev => ({ ...prev, [key]: value }));
  }
  async function selectPhoto(file: File | undefined) {
    if (!file) return;
    setPending(true); setError('');
    try { const blob = await processPhoto(file); setPhoto(blob); setPhotoMode('set'); setDirty(true); }
    catch (e) { setError(e instanceof Error ? e.message : '画像を処理できません'); }
    finally { setPending(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || pending) return;
    setPending(true); setError('');
    try {
      if (current) await service.edit(current, fields, photoMode, photo);
      else await service.add(fields, photo);
      setDirty(false);
      if (!current && addAnother) {
        setFields({ ...defaults, category: fields.category, seasons: fields.seasons ? [...fields.seasons] : [...SEASONS] });
        setPhoto(undefined); setPhotoMode('keep');
        setSavedMessage(fields.name + 'を登録しました。次の服を登録できます。');
        await onSaved(true);
        document.getElementById('cloth-name')?.focus();
      } else await onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : '保存できませんでした'); }
    finally { setPending(false); }
  }
  const shown = photoMode === 'remove' ? undefined : preview ?? existing;
  return (
    <dialog ref={dialog} className="editor-dialog" onClose={() => { if (!dialog.current?.open) onClose(); }} onCancel={e => { e.preventDefault(); close(); }} aria-labelledby="editor-title">
      <div className="dialog-head">
        <div><p className="eyebrow">MY WARDROBE</p><h2 id="editor-title">{current ? 'アイテムを編集' : '新しい服を登録'}</h2></div>
        <button type="button" className="icon-button" disabled={pending || busy} onClick={close} aria-label="閉じる"><Icon name="close" /></button>
      </div>
      <form className="editor-form" onSubmit={e => void submit(e)}>
        <div className="photo-field">
          <div className="photo-preview">
            {shown ? <img src={shown} alt="登録する服の画像プレビュー" /> : <><Icon name="image" size={34} /><span>YOUR PHOTO</span></>}
          </div>
          <div className="photo-instructions">
            <strong>お気に入りの1枚を</strong>
            <p>写真は端末内で圧縮し、撮影位置などのメタデータを除去します。透明背景のPNG・WebPなら、木目に服がそのまま馴染みます。背景の自動切り抜きは行いません。</p>
            <label className="button button-outline file-label">
              <Icon name="upload" size={16} /> 写真を選ぶ
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void selectPhoto(e.target.files?.[0]); e.target.value = ''; }} disabled={pending || busy} />
            </label>
            {shown && <button type="button" className="text-button" disabled={busy || pending} onClick={() => { setPhoto(undefined); setPhotoMode('remove'); setDirty(true); }}>画像を削除</button>}
          </div>
        </div>
        {!current && <div className="registration-shortcuts"><p className="panel-description">名前だけでも登録できます。よく使う服から始めましょう。</p><div className="category-pills">{(['Tシャツ', 'シャツ', 'ニット', 'パンツ', 'スカート', 'ワンピース', 'コート', 'スニーカー'] as const).map(name => <button type="button" className="pill" key={name} disabled={busy || pending} onClick={() => { change('name', name); change('category', inferCategory(name)); }}>＋ {name}</button>)}</div></div>}
        {savedMessage && <p role="status">{savedMessage}</p>}
        <div className="field">
          <label htmlFor="cloth-name">アイテム名 <span aria-hidden="true" className="required">*</span></label>
          <input id="cloth-name" required maxLength={80} value={fields.name} onChange={e => change('name', e.target.value)} placeholder="例：白のリネンシャツ" autoFocus />
        </div>
        <div className="field">
          <label htmlFor="cloth-category">カテゴリー</label>
          <select id="cloth-category" value={fields.category} onChange={e => change('category', e.target.value as ClothingInput['category'])}>
            {CATEGORIES.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="field-grid">
          <div className="field"><label htmlFor="cloth-brand">ブランド</label><input id="cloth-brand" maxLength={80} value={fields.brand} onChange={e => change('brand', e.target.value)} placeholder="例：UNIQLO" /></div>
          <div className="field"><label htmlFor="cloth-color">カラー</label><input id="cloth-color" maxLength={40} value={fields.color} onChange={e => change('color', e.target.value)} placeholder="例：アイボリー" /></div>
          <div className="field"><label htmlFor="cloth-size">サイズ</label><input id="cloth-size" maxLength={30} value={fields.size} onChange={e => change('size', e.target.value)} placeholder="例：M" /></div>
          <div className="field toggle-field">
            <label htmlFor="cloth-favorite">お気に入り</label>
            <label className="check-row"><input id="cloth-favorite" type="checkbox" checked={fields.favorite} onChange={e => change('favorite', e.target.checked)} /> マイフェイバリットに追加</label>
          </div>
        </div>
        <fieldset className="season-field"><legend>着る季節（複数選択）</legend><div className="category-pills">{SEASONS.map(season => <button key={season} type="button" className={'pill ' + (fields.seasons?.includes(season) ? 'active' : '')} aria-pressed={fields.seasons?.includes(season) ?? false} onClick={() => change('seasons', fields.seasons?.includes(season) ? fields.seasons.filter(s => s !== season) : [...(fields.seasons ?? []), season])}>{season}</button>)}</div></fieldset>
        <label className="check-row archive-toggle"><input type="checkbox" checked={fields.archived ?? false} onChange={e => change('archived', e.target.checked)} /> 衣替えで収納中（コーデ提案から除外）</label>
        <div className="field-grid"><div className="field"><label htmlFor="cloth-price">購入金額（円・任意）</label><input id="cloth-price" type="number" min="0" max="100000000" step="1" inputMode="numeric" value={fields.purchasePrice ?? ''} onChange={e => change('purchasePrice', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="例：3990" /></div><div className="field"><label htmlFor="cloth-url">商品URL（任意）</label><input id="cloth-url" type="url" maxLength={2048} value={fields.sourceUrl ?? ''} onChange={e => change('sourceUrl', e.target.value)} placeholder="https://zozo.jp/…" /></div></div>
        <div className="field"><label htmlFor="cloth-notes">メモ</label><textarea id="cloth-notes" rows={3} maxLength={500} value={fields.notes} onChange={e => change('notes', e.target.value)} placeholder="お気に入りの着こなしや購入時の思い出など" /></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {!current && <label className="check-row"><input type="checkbox" checked={addAnother} disabled={busy || pending} onChange={e => setAddAnother(e.target.checked)} />保存後に続けて登録する</label>}
        <div className="dialog-actions">
          {current && <button type="button" disabled={busy || pending} className="button button-danger-outline" onClick={() => void onDelete(current)}><Icon name="trash" size={17} /> 削除</button>}
          <button type="button" className="button button-ghost" disabled={pending || busy} onClick={close}>キャンセル</button>
          <button type="submit" className="button button-primary" disabled={busy || pending}><Icon name="check" size={17} />{pending ? '処理中…' : '保存する'}</button>
        </div>
      </form>
    </dialog>
  );
}
