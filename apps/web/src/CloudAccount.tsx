import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ClozyService } from '@clozy/application';
import { getSession, signIn, signOut, uploadBackup, restoreBackup, deleteCloudAccount } from './cloud';
import type { CloudSession } from './cloud';
export default function CloudAccount({ service, onReload }: {
  service: ClozyService; onReload: () => Promise<void>;
}) {
  const [session, setSession] = useState<CloudSession | null>(null);
  const [available, setAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void getSession().then(s => { if (active) setSession(s); })
      .catch(e => { if (active && e instanceof Error && e.message !== 'ログインが必要です') setAvailable(false); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await task(); } catch (e) { setError(e instanceof Error ? e.message : '操作に失敗しました'); }
    finally { setBusy(false); }
  }
  function authenticate(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      setSession(await signIn(email.trim(), password, register));
      setPassword(''); setNotice('ログインしました');
    });
  }
  function upload() {
    if (!window.confirm('この端末のデータをクラウドに保存します。既存のクラウドバックアップを置き換えますか？')) return;
    void run(async () => {
      try { await uploadBackup(service, session?.backup?.revision ?? 0); }
      finally { setSession(await getSession()); }
      setNotice('クラウドに保存しました');
    });
  }
  function restore() {
    if (!window.confirm('この端末の服・写真・着用履歴をクラウドのバックアップで上書きします。事前にローカルバックアップを保存してください。続けますか？')) return;
    void run(async () => { await restoreBackup(service); await onReload(); setNotice('この端末に復元しました'); });
  }
  function logout() {
    void run(async () => { await signOut(); setSession(null); setNotice('ログアウトしました。端末のデータは残ります。'); });
  }
  function remove() {
    const secret = window.prompt('アカウント削除のためパスワードを入力');
    if (!secret || !window.confirm('クラウド上のアカウントとバックアップを削除します。元に戻せません。続けますか？')) return;
    void run(async () => { await deleteCloudAccount(secret); setSession(null); setNotice('アカウントを削除しました'); });
  }
  return <section className="account-section" aria-labelledby="account-title">
    <div className="section-head"><div><p className="eyebrow">ACCOUNT</p><h3 id="account-title">アカウントとクラウド保存</h3></div></div>
    <p className="account-help">アカウントがなくてもローカルで利用できます。クラウド保存は手動バックアップ方式です。自動同期ではありません。</p>
    {!ready && <p role="status">確認中…</p>}
    {ready && !available && <p role="status">この環境ではクラウド保存が利用できません。ローカル保存は使えます。</p>}
    {ready && available && !session && <form className="account-form" onSubmit={authenticate}>
      <div className="account-tabs"><button type="button" aria-pressed={!register} onClick={() => setRegister(false)}>ログイン</button><button type="button" aria-pressed={register} onClick={() => setRegister(true)}>新規登録</button></div>
      <label>メールアドレス<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>パスワード（12文字以上）<input type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button className="button button-primary" type="submit" disabled={busy}>{register ? '新規登録する' : 'ログインする'}</button>
      <p className="account-help">現在、メール認証とパスワード再設定には対応していません。パスワードを安全に保管してください。</p>
    </form>}
    {ready && available && session && <div className="account-details">
      <div className="account-line"><span>アカウント</span><strong>{session.user.email}</strong></div>
      <div className="account-line"><span>クラウドバックアップ</span><strong>{session.backup ? new Date(session.backup.updated_at).toLocaleString('ja-JP') : '未保存'}</strong></div>
      <div className="account-actions"><button className="button button-primary" disabled={busy} onClick={upload}>クラウドに保存</button><button className="button button-outline" disabled={busy || !session.backup} onClick={restore}>この端末に復元</button><button className="button button-ghost" disabled={busy} onClick={logout}>ログアウト</button></div>
      <p className="account-help">クラウド上のデータはエンドツーエンド暗号化されていません。別の端末からの更新がある場合、保存は競合検知で停止します。</p>
      <button className="account-delete" disabled={busy} onClick={remove}>クラウドアカウントを削除</button>
    </div>}
    {notice && <p role="status" className="account-message">{notice}</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </section>;
}
