import type { ClozyService } from '@clozy/application';
export type CloudUser = { id: string; email: string };
export type BackupMeta = { revision: number; updated_at: string; bytes: number } | null;
export type CloudSession = { user: CloudUser; backup: BackupMeta };
async function call(path: string, init?: RequestInit) {
  const user = (await auth()).currentUser;
  const headers = new Headers(init?.headers);
  if (user) headers.set('Authorization', 'Bearer ' + await user.getIdToken());
  const response = await fetch('/api/' + path, { cache: 'no-store', credentials: 'omit', ...init, headers });
  return response;
}
async function data(response: Response): Promise<CloudSession> {
  const body = await response.json() as { error?: string; user?: CloudUser; backup?: BackupMeta };
  if (!response.ok) throw new Error(body.error || 'サーバーに接続できません');
  if (!body.user) throw new Error('ユーザー情報がありません');
  return { user: body.user, backup: body.backup ?? null };
}
let authPromise: Promise<import('firebase/auth').Auth> | undefined;
async function auth() {
  authPromise ??= (async () => {
    const r = await fetch('/api/firebase-config', { cache: 'no-store' });
    if (!r.ok) throw new Error('Firebase の接続を設定中です');
    const config = await r.json();
    const { initializeApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const instance = getAuth(initializeApp(config));
    instance.languageCode = 'ja';
    await instance.authStateReady();
    return instance;
  })();
  return authPromise;
}
export async function getSession() {
  const a = await auth();
  if (!a.currentUser) throw new Error('ログインが必要です');
  await a.currentUser.reload();
  await a.currentUser.getIdToken(true);
  if (!a.currentUser.emailVerified) throw new Error('メール内のリンクで本人確認を完了してください');
  return data(await call('me'));
}
export async function signIn(email: string, password: string, register: boolean) {
  const a = await auth();
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } = await import('firebase/auth');
  const result = register ? await createUserWithEmailAndPassword(a,email.trim(),password) : await signInWithEmailAndPassword(a,email.trim(),password);
  if (!result.user.emailVerified) {
    await sendEmailVerification(result.user);
    throw new Error('確認メールを送信しました。リンクを開いた後、もう一度ログインしてください');
  }
  return getSession();
}
export async function resetPassword(email: string) {
  const { sendPasswordResetEmail } = await import('firebase/auth');
  await sendPasswordResetEmail(await auth(),email.trim());
}
export async function signOut() {
  const { signOut: firebaseSignOut } = await import('firebase/auth');
  await firebaseSignOut(await auth());
}
export async function uploadBackup(service: ClozyService, revision: number) {
  const backup = await service.exportBackup();
  if (new Blob([backup]).size > 32 * 1024 * 1024) throw new Error('クラウド保存は32MB以下です。ローカル書き出しは75MBまで利用できます。');
  const response = await call('backup', { method: 'PUT', headers: {
    'Content-Type': 'application/json', 'If-Match': String(revision)
  }, body: backup });
  const body = await response.json() as { error?: string };
  if (!response.ok) throw new Error(body.error || 'クラウド保存に失敗しました');
}
export async function restoreBackup(service: ClozyService) {
  const response = await call('backup');
  if (!response.ok) {
    const body = await response.json() as { error?: string };
    throw new Error(body.error || '復元に失敗しました');
  }
  const blob = await response.blob();
  await service.importBackup(new File([blob], 'clozy-cloud.json', { type: 'application/json' }));
}
export async function deleteCloudAccount(email: string, password: string) {
  const a = await auth();
  if (!a.currentUser) throw new Error('ログインが必要です');
  const { reauthenticateWithCredential, EmailAuthProvider, signOut: firebaseSignOut } = await import('firebase/auth');
  await reauthenticateWithCredential(a.currentUser, EmailAuthProvider.credential(email,password));
  const response = await call('account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const body = await response.json() as { error?: string };
  if (!response.ok) throw new Error(body.error || 'アカウントを削除できません');
  await firebaseSignOut(a);
}
