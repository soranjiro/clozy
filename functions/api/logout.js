import { response, reject, digest, sessionToken, cookie } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  if(request.headers.get('Origin')!==new URL(request.url).origin) return reject('送信元が不正です',403);
  if(!env.DB) return reject('クラウド保存は設定中です',503);
  const token=sessionToken(request);
  if(token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
  return response({ok:true},200,{'Set-Cookie':cookie('',0)});
}