// API integration test on a disposable Cloudflare Pages *preview* origin.
// Never run against a production origin or a user's existing account.
import assert from 'node:assert/strict';
const base = process.env.CLOZY_URL;
assert(base && /^https:\/\/[a-z0-9-]+\.clozy\.pages\.dev\/?$/.test(base), 'Preview URL required');
assert(!['https://clozy.pages.dev', 'https://main.clozy.pages.dev'].includes(base.replace(/\/$/, '')), 'Never test production');
const origin = new URL(base).origin;
const email = 'qa-' + crypto.randomUUID() + '@example.invalid';
const password = crypto.randomUUID() + '-local-only';
const hex = bytes => [...bytes].map(v => v.toString(16).padStart(2, '0')).join('');
const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = Uint8Array.from(salt.match(/.{2}/g), v => parseInt(v, 16));
  return hex(new Uint8Array(await crypto.subtle.deriveBits({
    name: 'PBKDF2', salt: bytes, iterations: 210000, hash: 'SHA-256'
  }, key, 256)));
}
const verifier = await derive(password, salt);
let cookie = '';
async function req(path, method = 'GET', payload, headers = {}) {
  const response = await fetch(origin + '/api/' + path, {
    method, headers: { ...(method === 'GET' ? {} : { Origin: origin, 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 80) }; }
  return { response, json };
}
let ready = false;
for (let attempt = 0; attempt < 15; attempt++) {
  const r = await req('me');
  if (r.response.status === 401) { ready = true; break; }
  await new Promise(resolve => setTimeout(resolve, 1000));
}
assert(ready, 'Pages Functions / D1 must be available on preview');
let test = await req('register', 'POST', { email, salt, verifier });
assert.equal(test.response.status, 200, 'register: ' + JSON.stringify(test.json));
assert.equal(test.json.user.email, email);
test = await req('me');
assert.equal(test.response.status, 200, 'session');
assert.equal(test.json.backup, null);
const backup = { version: 1, exportedAt: new Date().toISOString(), clothing: [], wears: [], images: [] };
test = await req('backup', 'PUT', backup, { 'If-Match': '0' });
assert.equal(test.response.status, 200, 'upload');
test = await req('backup', 'PUT', backup, { 'If-Match': '0' });
assert.equal(test.response.status, 409, 'stale revision must fail');
test = await req('backup');
assert.equal(test.response.status, 200, 'download');
assert.deepEqual(test.json, backup);
test = await req('logout', 'POST', {});
assert.equal(test.response.status, 200, 'logout');
test = await req('me');
assert.equal(test.response.status, 401, 'session invalidated');
test = await req('login', 'POST', { email, verifier });
assert.equal(test.response.status, 200, 'login');
test = await req('account', 'DELETE', { verifier });
assert.equal(test.response.status, 200, 'delete user and cloud backup');
test = await req('me');
assert.equal(test.response.status, 401, 'account deleted');
console.log('PASS: Cloudflare preview account register, login, cookie, upload/download, conflict, logout, delete');
