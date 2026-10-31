import { response, reject, emailValid, passwordValid, derive, randomHex, digest, cookie, readJson, metadata, equal } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reject('送信元が不正です',403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reject('JSONが必要です',415);
  if (!env.DB || !env.BACKUPS) return reject('クラウド保存は設定中です',503);
  try {
    const body=await readJson(request);
    const email=String(body?.email||'').trim().toLowerCase();
    if(!emailValid(email)||!passwordValid(body?.password)) return reject('メールかパスワードが正しくありません',401);
    const now=Date.now();
    const limits=await env.DB.prepare('SELECT failed,blocked_until FROM login_attempts WHERE email=?').bind(email).first();
    if(limits?.blocked_until>now) return reject('試行回数が多すぎます。15分後にお試しください',429);
    const found=await env.DB.prepare('SELECT id,email,password_hash,salt FROM users WHERE email=?').bind(email).first();
    const attempt=await derive(body.password,found?.salt||'00000000000000000000000000000000');
    if(!found||!equal(found.password_hash,attempt)){
      const failed=(limits?.failed||0)+1;
      await env.DB.prepare('INSERT INTO login_attempts(email,failed,blocked_until) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET failed=excluded.failed,blocked_until=excluded.blocked_until')
        .bind(email,failed>=8?0:failed,failed>=8?now+900000:0).run();
      return reject('メールかパスワードが正しくありません',401);
    }
    await env.DB.prepare('DELETE FROM login_attempts WHERE email=?').bind(email).run();
    const token=randomHex(32);
    await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)')
      .bind(await digest(token),found.id,now+1209600000,new Date().toISOString()).run();
    return response({user:{id:found.id,email},backup:await metadata(env.DB,found.id)},200,{'Set-Cookie':cookie(token,1209600)});
  } catch { return reject('ログインできませんでした',500); }
}