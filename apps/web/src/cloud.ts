import type { ClozyService } from '@clozy/application';
export type CloudUser = { id: string; email: string };
export type BackupMeta = { revision: number; updated_at: string; bytes: number } | null;
export type CloudSession = { user: CloudUser; backup: BackupMeta };
async function call(path: string, init?: RequestInit) {
  const response = await fetch('/api/' + path, { cache: 'no-store', credentials: 'same-origin', ...init });
  return response;
}
async function data(response: Response): Promise<CloudSession> {
  const body = await response.json() as { error?: string; user?: CloudUser; backup?: BackupMeta };
  if (!response.ok) throw new Error(body.error || 'サーバーに接続できません');
  if (!body.user) throw new Error('ユーザー情報がありません');
  return { user: body.user, backup: body.backup ?? null };
}
const hex = (bytes: Uint8Array) => [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
const newSalt = () => {
  const value = new Uint8Array(16);
  crypto.getRandomValues(value);
  return hex(value);
};
async function accountSalt(email: string): Promise<string> {
  const response = await call('salt?email=' + encodeURIComponent(email));
  const result = await response.json() as { salt?: string; error?: string };
  if (!response.ok || !result.salt) throw new Error(result.error || '認証情報を取得できません');
  return result.salt;
}
async function verifier(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltBytes = Uint8Array.from(salt.match(/.{2}/g) || [], value => parseInt(value, 16));
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2', salt: saltBytes, iterations: 210000, hash: 'SHA-256'
  }, key, 256);
  return hex(new Uint8Array(bits));
}
export const getSession = async () => data(await call('me'));
export async function signIn(email: string, password: string, register: boolean) {
  if (password.length < 12 || password.length > 128) throw new Error('12文字以上のパスワードが必要です');
  const normalized = email.trim().toLowerCase();
  const salt = register ? newSalt() : await accountSalt(normalized);
  const proof = await verifier(password, salt);
  return data(await call(register ? 'register' : 'login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalized, verifier: proof, ...(register ? { salt } : {}) })
  }));
}
export async function signOut() {
  const result = await call('logout', { method: 'POST' });
  if (!result.ok) throw new Error('ログアウトに失敗しました');
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
  const proof = await verifier(password, await accountSalt(email));
  const response = await call('account', { method: 'DELETE', headers: {
    'Content-Type': 'application/json'
  }, body: JSON.stringify({ verifier: proof }) });
  const body = await response.json() as { error?: string };
  if (!response.ok) throw new Error(body.error || 'アカウントを削除できません');
}
