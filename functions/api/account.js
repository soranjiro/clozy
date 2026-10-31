import { response, reject, account, readJson, verifierValid, digest, equal, cookie } from '../_lib.js';
export async function onRequestDelete({request,env}){
  if(request.headers.get('Origin')!==new URL(request.url).origin) return reject('送信元が不正です',403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return reject('JSONが必要です',415);
  if(!env.DB||!env.BACKUPS) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env.DB);
  if(!user) return reject('ログインが必要です',401);
  try{
    const data=await readJson(request);
    if(!verifierValid(data?.verifier)) return reject('パスワードが必要です');
    const info=await env.DB.prepare('SELECT password_hash,salt FROM users WHERE id=?').bind(user.id).first();
    if(!info||!equal(info.password_hash,await digest(data.verifier))) return reject('パスワードが正しくありません',401);
    const backup=await env.DB.prepare('SELECT object_key FROM backups WHERE user_id=?').bind(user.id).first();
    if(backup) await env.BACKUPS.delete(backup.object_key);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),
      env.DB.prepare('DELETE FROM backups WHERE user_id=?').bind(user.id),
      env.DB.prepare('DELETE FROM users WHERE id=?').bind(user.id)
    ]);
    return response({ok:true},200,{'Set-Cookie':cookie('',0)});
  }catch{return reject('アカウント削除に失敗しました',500);}
}