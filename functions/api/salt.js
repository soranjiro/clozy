import { response, reject, emailValid, randomHex } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  if (!env.DB) return reject('クラウド保存は設定中です', 503);
  const email = (new URL(request.url).searchParams.get('email') || '').trim().toLowerCase();
  if (!emailValid(email)) return reject('メールアドレスが不正です');
  const row = await env.DB.prepare('SELECT salt FROM users WHERE email=?').bind(email).first();
  // Respond with a random dummy salt for unknown accounts; do not expose account existence.
  return response({ salt: row?.salt || randomHex(16) });
}
