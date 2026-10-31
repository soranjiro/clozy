import { createRemoteJWKSet, jwtVerify } from 'jose';
export const response = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
export const reject = (message, status = 400) => response({ error: message }, status);
export const encode = value => new TextEncoder().encode(value);
export const digest = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', encode(value)))].map(b => b.toString(16).padStart(2, '0')).join('');
export const metadata = (db, uid) => db.prepare('SELECT revision,bytes,updated_at FROM firebase_backups WHERE uid=?').bind(uid).first();
// Cache public signing keys only, never user or request state.
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export function firebaseConfig(env) {
  try {
    const config = JSON.parse(env.FIREBASE_WEB_CONFIG || '{}');
    if (config.projectId !== env.FIREBASE_PROJECT_ID || !config.projectId || !config.apiKey || !config.authDomain || !config.appId) return null;
    return { apiKey: config.apiKey, authDomain: config.authDomain, projectId: config.projectId, appId: config.appId };
  } catch { return null; }
}
export async function verifyFirebaseToken(token, projectId, keySet = keys) {
  const { payload, protectedHeader } = await jwtVerify(token, keySet, {
    algorithms: ['RS256'], audience: projectId, issuer: 'https://securetoken.google.com/' + projectId,
    requiredClaims: ['exp', 'iat', 'sub', 'auth_time'], clockTolerance: 0
  });
  const now = Math.floor(Date.now() / 1000);
  if (!protectedHeader.kid || typeof payload.sub !== 'string' || !payload.sub.length || payload.sub.length > 128 ||
      typeof payload.iat !== 'number' || payload.iat > now || typeof payload.auth_time !== 'number' || payload.auth_time > now ||
      payload.email_verified !== true || typeof payload.email !== 'string' || payload.firebase?.sign_in_provider === 'anonymous') throw new Error('Invalid identity');
  return { id: payload.sub, email: payload.email.toLowerCase(), authTime: payload.auth_time };
}
export async function account(request, env) {
  const config = firebaseConfig(env), header = request.headers.get('Authorization') || '';
  if (!config || !/^Bearer [^\s]{1,8192}$/.test(header)) return null;
  const token = header.slice(7);
  try {
    const user = await verifyFirebaseToken(token, config.projectId);
    const result = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(config.apiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(10000)
    });
    if (!result.ok) return null;
    const live = (await result.json()).users?.[0];
    if (!live || live.localId !== user.id || live.disabled || live.emailVerified !== true ||
        live.email?.toLowerCase() !== user.email || Number(live.validSince || 0) > user.authTime) return null;
    if (await env.DB.prepare('SELECT uid FROM deleted_firebase_accounts WHERE uid=?').bind(user.id).first()) return null;
    return user;
  } catch { return null; }
}
export function writeAllowed(request) {
  return request.headers.get('Origin') === new URL(request.url).origin && request.headers.get('Content-Type')?.startsWith('application/json');
}
export async function readJson(request, max = 4096) {
  if (Number(request.headers.get('Content-Length') || 0) > max) throw new Error('large body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body required');
  const chunks = []; let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > max) { await reader.cancel(); throw new Error('large body'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
