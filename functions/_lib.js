import { pbkdf2 } from 'node:crypto';
// Shared Cloudflare Pages helpers; never return database errors to a browser.
export const response = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
export const reject = (message, status = 400) => response({ error: message }, status);
export const emailValid = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const passwordValid = value => typeof value === 'string' && value.length >= 12 && value.length <= 128;
const encoder = new TextEncoder();
const cookieName = '__Host-clozy_session';
export const encode = value => encoder.encode(value);
export const hex = data => [...new Uint8Array(data)].map(b => b.toString(16).padStart(2, '0')).join('');
export const randomHex = size => { const b = new Uint8Array(size); crypto.getRandomValues(b); return hex(b); };
export const digest = async value => hex(await crypto.subtle.digest('SHA-256', encode(value)));
export async function derive(password, salt) {
  const saltBytes = Uint8Array.from(salt.match(/.{2}/g), value => parseInt(value, 16));
  return new Promise((resolve, reject) => {
    pbkdf2(password, saltBytes, 210000, 32, 'sha256', (error, result) => {
      if (error) reject(error);
      else resolve(hex(result));
    });
  });
}
export function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export function sessionToken(request) {
  const found = (request.headers.get('Cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='));
  const token = found?.slice(cookieName.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export const cookie = (token, age) => cookieName + '=' + token + '; Secure; HttpOnly; Path=/; SameSite=Lax; Max-Age=' + age;
export async function readJson(request, max = 4096) {
  if (Number(request.headers.get('Content-Length') || 0) > max) throw new Error('large body');
  const text = await request.text();
  if (encode(text).length > max) throw new Error('large body');
  return JSON.parse(text);
}
export async function account(request, db) {
  const token = sessionToken(request);
  if (!token) return null;
  return db.prepare('SELECT users.id,users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?')
    .bind(await digest(token), Date.now()).first();
}
export const metadata = (db, id) => db.prepare('SELECT revision,bytes,updated_at FROM backups WHERE user_id=?').bind(id).first();
