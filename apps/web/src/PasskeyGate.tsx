import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { hasPasskey, passkeyError, unlockPasskey } from './passkey';
import Icon from './Icon';

export default function PasskeyGate({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(() => { try { return hasPasskey(); } catch { return true; } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt: number | undefined;
    const lock = () => { try { if (hasPasskey()) setLocked(true); } catch { setLocked(true); } };
    const visibility = () => {
      clearTimeout(timer);
      if (document.hidden) { hiddenAt = Date.now(); timer = setTimeout(lock, 60_000); }
      else { if (hiddenAt !== undefined && Date.now() - hiddenAt >= 60_000) lock(); hiddenAt = undefined; }
    };
    const storage = () => { if (hasPasskey()) lock(); };
    window.addEventListener('clozy-lock', lock);
    window.addEventListener('storage', storage);
    document.addEventListener('visibilitychange', visibility);
    return () => { clearTimeout(timer); window.removeEventListener('clozy-lock', lock); window.removeEventListener('storage', storage); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  async function unlock() {
    setBusy(true); setError('');
    try { await unlockPasskey(); setLocked(false); }
    catch (e) { setError(passkeyError(e)); }
    finally { setBusy(false); }
  }
  if (!locked) return children;
  return <main className="lock-screen"><section className="lock-card"><span className="brand-mark"><Icon name="shield" size={28} /></span><p className="eyebrow">YOUR PRIVATE WARDROBE</p><h1>おかえりなさい。</h1><p>パスキーで、あなたのクローゼットを開きます。</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy} onClick={() => void unlock()}>{busy ? '本人確認中…' : 'パスキーで開く'}</button><p className="lock-help">登録時のパスキーが必要です。別の端末で作ったパスキーは、OSの同期やQRコード認証をご確認ください。Clozyからのアカウント復旧はできません。</p></section></main>;
}
