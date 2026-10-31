import { response, reject, emailValid, passwordValid, derive, randomHex, digest, cookie, readJson, metadata } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reject('送信元が不正です', 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reject('JSONが必要です', 415);
  if (!env.DB || !env.BACKUPS) return reject('クラウド保存は設定中です', 503);
  try {
    const input = await readJson(request);
    const email = String(input?.email || '').trim().toLowerCase();
    if (!emailValid(email) || !passwordValid(input?.password)) return reject('メールと12文字以上のパスワードが必要です');
    if (await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first()) return reject('このメールは登録済みです', 409);
    const salt = randomHex(16), id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO users(id,email,password_hash,salt,created_at) VALUES(?,?,?,?,?)')
      .bind(id,email,await derive(input.password,salt),salt,new Date().toISOString()).run();
    const token = randomHex(32);
    await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)')
      .bind(await digest(token),id,Date.now()+1209600000,new Date().toISOString()).run();
    return response({user:{id,email},backup:await metadata(env.DB,id)},200,{'Set-Cookie':cookie(token,1209600)});
  } catch { return reject('登録できませんでした', 500); }
}