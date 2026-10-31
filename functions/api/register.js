import { response, reject, emailValid, passwordValid, derive, randomHex, digest, cookie, readJson, metadata } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reject('送信元が不正です', 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reject('JSONが必要です', 415);
  if (!env.DB || !env.BACKUPS) return reject('クラウド保存は設定中です', 503);
  let step = 'start';
  try {
    // Store only an IP digest; bound registrations per source per hour.
    const ip = request.headers.get('CF-Connecting-IP') || 'local-preview';
    const ipKey = await digest(ip);
    const now = Date.now();
    const previous = await env.DB.prepare('SELECT attempts,window_start FROM registration_limits WHERE ip_hash=?').bind(ipKey).first();
    const windowStart = previous && now - previous.window_start < 3600000 ? previous.window_start : now;
    const count = windowStart === now ? 1 : (previous?.attempts || 0) + 1;
    if (count > 5) return reject('登録回数の上限です。時間をおいてお試しください', 429);
    await env.DB.prepare('INSERT INTO registration_limits(ip_hash,attempts,window_start) VALUES(?,?,?) ON CONFLICT(ip_hash) DO UPDATE SET attempts=excluded.attempts,window_start=excluded.window_start')
      .bind(ipKey,count,windowStart).run();
    step = 'read-input';
    const input = await readJson(request);
    const email = String(input?.email || '').trim().toLowerCase();
    if (!emailValid(email) || !passwordValid(input?.password)) return reject('メールと12文字以上のパスワードが必要です');
    if (await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first()) return reject('このメールは登録済みです', 409);
    const salt = randomHex(16), id = crypto.randomUUID();
    step = 'derive';
    const passwordHash = await derive(input.password, salt);
    step = 'insert-user';
    await env.DB.prepare('INSERT INTO users(id,email,password_hash,salt,created_at) VALUES(?,?,?,?,?)')
      .bind(id,email,passwordHash,salt,new Date().toISOString()).run();
    step = 'create-session';
    const token = randomHex(32);
    await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)')
      .bind(await digest(token),id,Date.now()+1209600000,new Date().toISOString()).run();
    return response({user:{id,email},backup:await metadata(env.DB,id)},200,{'Set-Cookie':cookie(token,1209600)});
  } catch (error) { return reject('登録できませんでした（' + step + ' / ' + (error instanceof Error ? error.name : 'unknown') + '）', 500); }
}