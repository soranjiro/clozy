import { response, reject, account, encode } from '../_lib.js';
const LIMIT=32*1024*1024;
export async function onRequestGet({request,env}){
  if(!env.DB||!env.BACKUPS) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env.DB);
  if(!user) return reject('ログインが必要です',401);
  const item=await env.DB.prepare('SELECT object_key,revision FROM backups WHERE user_id=?').bind(user.id).first();
  if(!item) return reject('保存データはありません',404);
  const data=await env.BACKUPS.get(item.object_key);
  if(!data) return reject('データが見つかりません',503);
  return new Response(data.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Backup-Revision':String(item.revision)}});
}
export async function onRequestPut({request,env}){
  if(request.headers.get('Origin')!==new URL(request.url).origin) return reject('送信元が不正です',403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return reject('JSONが必要です',415);
  if(!env.DB||!env.BACKUPS) return reject('クラウド保存は設定中です',503);
  const user=await account(request,env.DB);
  if(!user) return reject('ログインが必要です',401);
  const current=await env.DB.prepare('SELECT object_key,revision FROM backups WHERE user_id=?').bind(user.id).first();
  const previous=current?.revision||0;
  if(request.headers.get('If-Match')!==String(previous)) return reject('別端末による更新があります。先に再読み込みしてください',409);
  if(Number(request.headers.get('Content-Length')||0)>LIMIT) return reject('クラウド保存は32MB以下です',413);
  const text=await request.text();
  const length=encode(text).byteLength;
  if(length>LIMIT) return reject('クラウド保存は32MB以下です',413);
  let payload;
  try{payload=JSON.parse(text);}catch{return reject('データがJSONではありません');}
  if(payload?.version!==1||!Array.isArray(payload.clothing)||!Array.isArray(payload.wears)||!Array.isArray(payload.images)
     ||payload.clothing.length>2000||payload.wears.length>20000||payload.images.length>2000) return reject('バックアップ形式が不正です');
  const key='users/'+user.id+'/'+crypto.randomUUID()+'.json';
  try{
    await env.BACKUPS.put(key,text,{httpMetadata:{contentType:'application/json'}});
    const now=new Date().toISOString();
    const sql=current
      ?env.DB.prepare('UPDATE backups SET object_key=?,revision=?,bytes=?,updated_at=? WHERE user_id=? AND revision=?')
        .bind(key,previous+1,length,now,user.id,previous)
      :env.DB.prepare('INSERT INTO backups(user_id,object_key,revision,bytes,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING')
        .bind(user.id,key,1,length,now);
    const result=await sql.run();
    if(result.meta.changes!==1){await env.BACKUPS.delete(key);return reject('同時更新を検知しました',409);}
    if(current?.object_key) await env.BACKUPS.delete(current.object_key);
    return response({backup:{revision:previous+1,updated_at:now,bytes:length}});
  }catch{await env.BACKUPS.delete(key);return reject('クラウド保存に失敗しました',500);}
}