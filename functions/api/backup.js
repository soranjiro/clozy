import { validateBackup } from '../_backup.js';
import { response, reject, account, encode, readJson } from '../_lib.js';
const LIMIT=32*1024*1024;
export async function onRequestGet({request,env}){
  if(!env.DB||!env.BACKUPS) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env);
  if(!user) return reject('ログインが必要です',401);
  const item=await env.DB.prepare('SELECT object_key,revision FROM firebase_backups WHERE uid=?').bind(user.id).first();
  if(!item) return reject('保存データはありません',404);
  const data=await env.BACKUPS.get(item.object_key);
  if(!data) return reject('データが見つかりません',503);
  return new Response(data.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Backup-Revision':String(item.revision)}});
}
export async function onRequestPut({request,env}){
  if(request.headers.get('Origin')!==new URL(request.url).origin) return reject('送信元が不正です',403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return reject('JSONが必要です',415);
  if(!env.DB||!env.BACKUPS) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env);
  if(!user) return reject('ログインが必要です',401);
  const current=await env.DB.prepare('SELECT object_key,revision FROM firebase_backups WHERE uid=?').bind(user.id).first();
  const previous=current?.revision||0;
  if(request.headers.get('If-Match')!==String(previous)) return reject('別端末による更新があります。先に再読み込みしてください',409);
  if(Number(request.headers.get('Content-Length')||0)>LIMIT) return reject('クラウド保存は32MB以下です',413);
  let payload;
  try{payload=await readJson(request,LIMIT);}catch{return reject('バックアップ形式・容量が不正です',413);}
  const text=JSON.stringify(payload),length=encode(text).byteLength;
  try{validateBackup(payload);}catch{return reject('バックアップの参照・形式が不正です');}
  const key='users/'+encodeURIComponent(user.id)+'/'+crypto.randomUUID()+'.json';
  try{
    await env.BACKUPS.put(key,text,{httpMetadata:{contentType:'application/json'}});
    const now=new Date().toISOString();
    const sql=current
      ?env.DB.prepare('UPDATE firebase_backups SET object_key=?,revision=?,bytes=?,updated_at=? WHERE uid=? AND revision=?')
        .bind(key,previous+1,length,now,user.id,previous)
      :env.DB.prepare('INSERT INTO firebase_backups(uid,object_key,revision,bytes,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(uid) DO NOTHING')
        .bind(user.id,key,1,length,now);
    const result=await sql.run();
    if(result.meta.changes!==1){await env.BACKUPS.delete(key);return reject('同時更新を検知しました',409);}
    // Retain previous revisions for recovery; a successful commit must never be undone by cleanup.
    return response({backup:{revision:previous+1,updated_at:now,bytes:length}});
  }catch{return reject('クラウド保存に失敗しました。再読み込みして保存状態を確認してください',500);}
}