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
export const getSession = async () => data(await call('me'));
export async function signIn(email: string, password: string, register: boolean) {
  return data(await call(register ? 'register' : 'login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
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
export async function deleteCloudAccount(password: string) {
  const response = await call('account', { method: 'DELETE', headers: {
    'Content-Type': 'application/json'
  }, body: JSON.stringify({ password }) });
  const body = await response.json() as { error?: string };
  if (!response.ok) throw new Error(body.error || 'アカウントを削除できません');
}
