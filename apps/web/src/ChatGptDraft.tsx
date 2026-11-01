import { useEffect, useRef, useState } from 'react';
import type { Clothing } from '@clozy/domain';
import type { ClozyService } from '@clozy/application';
import Icon from './Icon';

const PROJECT_KEY = 'clozy-chatgpt-project-url';
const CHATGPT_HOME = 'https://chatgpt.com/';

/** ChatGPT project URLs are user-supplied; never use an arbitrary website as a destination. */
export function validChatGptProjectUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.origin !== 'https://chatgpt.com' || !/^\/g\/g-p-[a-zA-Z0-9_-]+(?:\/.*)?$/.test(parsed.pathname)) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return parsed.href;
  } catch { return null; }
}
export function draftPrompt(items: Clothing[]): string {
  const list = items.map(item => [item.name, item.category, item.color, item.brand].filter(Boolean).join(' / '));
  return (items.length > 1
    ? '以下の手持ちの服を使って、季節感のあるコーデを考えてください。色・素材の相性と、替えられるアイテムを提案してください。'
    : 'この服に合う手持ちの服の組み合わせを考えてください。色の合わせ方、季節感、着回し案も教えてください。')
    + '\n\n' + list.map(x => '・' + x).join('\n')
    + '\n\n※ Clozyからの相談です。提案は確認後に自分で記録します。';
}
export function draftUrl(prompt: string): string {
  // The q parameter can prefill ChatGPT in some clients, but may also auto-submit.
  return CHATGPT_HOME + '?q=' + encodeURIComponent(prompt.slice(0, 1600));
}

export default function ChatGptDraft({ items, service, onClose }: {
  items: Clothing[]; service: ClozyService; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [prompt, setPrompt] = useState(() => draftPrompt(items));
  const [projectInput, setProjectInput] = useState(() => {
    try { return localStorage.getItem(PROJECT_KEY) || ''; } catch { return ''; }
  });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const projectUrl = validChatGptProjectUrl(projectInput);
  const text = prompt.trim();
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    return () => { if (el.open) el.close(); };
  }, []);
  function saveProject(value: string) {
    setProjectInput(value);
    try {
      const verified = validChatGptProjectUrl(value);
      if (verified) localStorage.setItem(PROJECT_KEY, verified);
      else localStorage.removeItem(PROJECT_KEY);
    } catch { /* Storage may be disabled. */ }
  }
  async function share() {
    if (!text || busy || !navigator.share) return;
    setBusy(true); setStatus('');
    try {
      const files: File[] = [];
      for (const item of items.slice(0, 4)) {
        if (!item.imageId) continue;
        const blob = await service.image(item.id);
        if (!blob || !['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) continue;
        files.push(new File([blob], 'clozy-' + (files.length + 1) + '.' + blob.type.split('/')[1], { type: blob.type }));
      }
      const outgoing: ShareData = { title: 'Clozy · コーデ相談', text };
      if (files.length && navigator.canShare?.({ files })) outgoing.files = files;
      await navigator.share(outgoing);
      setStatus('共有先で内容を確認してください。ChatGPTへの自動保存は行いません。');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus('共有できませんでした。文章をコピーしてChatGPTで開く方法をお試しください。');
    } finally { setBusy(false); }
  }
  async function copyAndOpen() {
    if (!text) return;
    // Open immediately on direct button activation; async clipboard writes may be blocked by browsers.
    const target = projectUrl || CHATGPT_HOME;
    const popup = window.open(target, '_blank', 'noopener,noreferrer');
    try {
      await navigator.clipboard.writeText(text);
      setStatus('文章をコピーしました。ChatGPTの入力欄に貼り付け、内容を確認して送信してください。');
    } catch {
      setStatus('ChatGPTを開きました。コピーできない場合は上の文章を選択して貼り付けてください。');
    }
    if (!popup) {
      // noopener windows can legitimately return null even when opened.
    }
  }
  function openPrefilled() {
    if (!text) return;
    window.open(draftUrl(text), '_blank', 'noopener,noreferrer');
    setStatus('入力欄への反映・自動送信はChatGPT側の動作に依存します。');
  }
  return <dialog ref={dialog} className="chatgpt-draft-dialog" aria-labelledby="clozy-chatgpt-title" onCancel={onClose} onClose={onClose}>
    <div className="chatgpt-draft-head"><div><p>ClOZY × ChatGPT</p><h2 id="clozy-chatgpt-title">コーデを相談する</h2></div>
      <button type="button" aria-label="相談を閉じる" onClick={onClose}><Icon name="close"/></button></div>
    <div className="chatgpt-draft-content">
      <p>画像や手持ちの服をもとにした相談文です。ChatGPTへ送る内容を編集できます。</p>
      <label htmlFor="clozy-chatgpt-text">相談する内容</label>
      <textarea id="clozy-chatgpt-text" rows={7} maxLength={4000} value={prompt} onChange={event => setPrompt(event.target.value)}/>
      <label htmlFor="clozy-chatgpt-project">ChatGPTプロジェクトのURL（任意）</label>
      <input id="clozy-chatgpt-project" type="url" value={projectInput} placeholder="https://chatgpt.com/g/g-p-..." onChange={event => saveProject(event.target.value)} />
      {projectInput && !projectUrl && <small role="alert">ChatGPTのプロジェクトのリンクを設定してください。通常のChatGPTを開きます。</small>}
      <div className="chatgpt-draft-actions">
        {typeof navigator.share === 'function' && <button type="button" disabled={!text || busy} onClick={() => void share()}><Icon name="upload" size={18}/> {busy ? '準備中…' : '画像・文章を共有'}</button>}
        <button type="button" disabled={!text} onClick={() => void copyAndOpen()}><Icon name="arrow" size={18}/> {projectUrl ? '文章をコピーしてプロジェクトを開く' : '文章をコピーしてChatGPTを開く'}</button>
      </div>
      <details className="chatgpt-draft-experimental">
        <summary>ChatGPTの入力欄に直接渡す（試験的）</summary>
        <p>文章だけをURLで渡します。環境によっては入力されず、また自動送信されることがあります。画像やプロジェクトの指定には対応していません。</p>
        <button type="button" disabled={!text} onClick={openPrefilled}>URLから開く</button>
      </details>
      {status && <p role="status" className="chatgpt-draft-status">{status}</p>}
      <p className="chatgpt-draft-note">ChatGPTでの送信・画像の編集・Clozyへの保存は自動化していません。個人の画像は選択した共有先へ渡る可能性があります。</p>
    </div>
  </dialog>;
}
