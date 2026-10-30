import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CATEGORIES } from '@clozy/domain';
import type { Clothing, ClothingInput } from '@clozy/domain';
import { processPhoto } from '@clozy/storage';
import type { ClozyService } from '@clozy/application';
import Icon from './Icon';

const defaults: ClothingInput = {
  name: '', category: 'トップス', color: '', brand: '', size: '', notes: '', favorite: false
};
function useExistingPhoto(service: ClozyService, id: string | undefined) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!id) { setUrl(undefined); return; }
    let cancelled = false;
    let objectUrl: string | undefined;
    void service.image(id).then(blob => {
      if (blob && !cancelled) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    });
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
  onSaved: () => Promise<void>;
  onDelete: (item: Clothing) => Promise<void>;
  busy: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [fields, setFields] = useState<ClothingInput>(current ? {
    name: current.name, category: current.category, brand: current.brand, color: current.color,
    size: current.size, notes: current.notes, favorite: current.favorite
  } : defaults);
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
  function change<K extends keyof ClothingInput>(key: K, value: ClothingInput[K]) {
    setFields(prev => ({ ...prev, [key]: value }));
  }
  async function selectPhoto(file: File | undefined) {
    if (!file) return;
    setPending(true); setError('');
    try { const blob = await processPhoto(file); setPhoto(blob); setPhotoMode('set'); }
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
      await onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : '保存できませんでした'); }
    finally { setPending(false); }
  }
  const shown = photoMode === 'remove' ? undefined : preview ?? existing;
  return (
    <dialog ref={dialog} className="editor-dialog" onClose={onClose} aria-labelledby="editor-title">
      <div className="dialog-head">
        <div><p className="eyebrow">MY WARDROBE</p><h2 id="editor-title">{current ? 'アイテムを編集' : '新しい服を登録'}</h2></div>
        <button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label="閉じる"><Icon name="close" /></button>
      </div>
      <form className="editor-form" onSubmit={e => void submit(e)}>
        <div className="photo-field">
          <div className="photo-preview">
            {shown ? <img src={shown} alt="登録する服の画像プレビュー" /> : <><Icon name="image" size={34} /><span>YOUR PHOTO</span></>}
          </div>
          <div className="photo-instructions">
            <strong>お気に入りの1枚を</strong>
            <p>写真は端末内で圧縮し、撮影位置などのメタデータを除去します。</p>
            <label className="button button-outline file-label">
              <Icon name="upload" size={16} /> 写真を選ぶ
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => void selectPhoto(e.target.files?.[0])} disabled={pending || busy} />
            </label>
            {shown && <button type="button" className="text-button" onClick={() => { setPhoto(undefined); setPhotoMode('remove'); }}>画像を削除</button>}
          </div>
        </div>
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
        <div className="field"><label htmlFor="cloth-notes">メモ</label><textarea id="cloth-notes" rows={3} maxLength={500} value={fields.notes} onChange={e => change('notes', e.target.value)} placeholder="お気に入りの着こなしや購入時の思い出など" /></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          {current && <button type="button" disabled={busy || pending} className="button button-danger-outline" onClick={() => void onDelete(current)}><Icon name="trash" size={17} /> 削除</button>}
          <button type="button" className="button button-ghost" onClick={() => dialog.current?.close()}>キャンセル</button>
          <button type="submit" className="button button-primary" disabled={busy || pending}><Icon name="check" size={17} />{pending ? '処理中…' : '保存する'}</button>
        </div>
      </form>
    </dialog>
  );
}
