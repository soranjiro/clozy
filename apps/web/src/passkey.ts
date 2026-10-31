// Local application lock, not a server identity or encryption boundary.
const STORAGE_KEY = 'clozy-passkey-v1';
interface SavedKey { id: string; publicKey: string }
export function encode(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
export function hasPasskey(): boolean { return localStorage.getItem(STORAGE_KEY) !== null; }
export function supportsPasskey(): boolean {
  const host = location.hostname;
  return window.isSecureContext && typeof PublicKeyCredential !== 'undefined' && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) && !host.includes(':');
}
// WebAuthn ES256 signatures use ASN.1 DER; Web Crypto expects IEEE P1363.
export function rawSignature(der: Uint8Array): Uint8Array<ArrayBuffer> {
  if (der[0] !== 0x30 || der[1] !== der.length - 2 || der[2] !== 2) throw new Error('署名形式が不正です');
  const rLength = der[3]!;
  const sOffset = 4 + rLength;
  if (der[sOffset] !== 2 || sOffset + 2 + der[sOffset + 1]! !== der.length) throw new Error('署名形式が不正です');
  const out = new Uint8Array(64);
  for (const [part, offset] of [[der.slice(4, sOffset), 0], [der.slice(sOffset + 2), 32]] as const) {
    const value = part.length === 33 && part[0] === 0 ? part.slice(1) : part;
    if (!value.length || value.length > 32) throw new Error('署名形式が不正です');
    out.set(value, offset + 32 - value.length);
  }
  return out;
}
function checkClient(data: ArrayBuffer, type: string, challenge: Uint8Array) {
  const client = JSON.parse(new TextDecoder().decode(data));
  if (client.type !== type || client.challenge !== encode(challenge) || client.origin !== location.origin || client.crossOrigin === true) throw new Error('認証要求が一致しません');
}
export async function registerPasskey(): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.create({ publicKey: {
    challenge, rp: { name: 'Clozy', id: location.hostname },
    user: { id: crypto.getRandomValues(new Uint8Array(32)), name: 'my-wardrobe', displayName: 'わたしのクローゼット' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    attestation: 'none', timeout: 60000
  } }) as PublicKeyCredential | null;
  if (!credential) throw new Error('パスキーの作成がキャンセルされました');
  const response = credential.response as AuthenticatorAttestationResponse;
  checkClient(response.clientDataJSON, 'webauthn.create', challenge);
  const key = response.getPublicKey?.();
  if (!key || response.getPublicKeyAlgorithm() !== -7) throw new Error('このブラウザではパスキー登録に対応していません');
  // Persist only after a successful assertion, including user verification.
  const saved = { id: credential.id, publicKey: encode(new Uint8Array(key)) };
  await authenticate(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}
async function authenticate(saved: SavedKey): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = await navigator.credentials.get({ publicKey: {
    challenge, rpId: location.hostname, allowCredentials: [{ type: 'public-key', id: decode(saved.id) }],
    userVerification: 'required', timeout: 60000
  } }) as PublicKeyCredential | null;
  if (!credential || credential.id !== saved.id) throw new Error('パスキーを確認できませんでした');
  const response = credential.response as AuthenticatorAssertionResponse;
  checkClient(response.clientDataJSON, 'webauthn.get', challenge);
  const auth = new Uint8Array(response.authenticatorData);
  const rpHash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(location.hostname)));
  if (auth.length < 37 || (auth[32]! & 5) !== 5 || !rpHash.every((b, i) => b === auth[i])) throw new Error('本人確認に失敗しました');
  const clientHash = new Uint8Array(await crypto.subtle.digest('SHA-256', response.clientDataJSON));
  const signed = new Uint8Array(auth.length + clientHash.length);
  signed.set(auth); signed.set(clientHash, auth.length);
  const key = await crypto.subtle.importKey('spki', decode(saved.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  if (!await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, rawSignature(new Uint8Array(response.signature)), signed)) throw new Error('署名の検証に失敗しました');
}
export async function unlockPasskey(): Promise<void> {
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) throw new Error('登録済みのパスキーがありません');
  await authenticate(JSON.parse(value) as SavedKey);
}
export async function removePasskey(): Promise<void> { await unlockPasskey(); localStorage.removeItem(STORAGE_KEY); }
export function passkeyError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'SecurityError') return 'パスキーには有効なドメインが必要です。開発時はIPアドレスではなく http://localhost:5173 を使ってください。';
  if (error instanceof DOMException && error.name === 'NotAllowedError') return '操作がキャンセルされたか、時間切れになりました。もう一度お試しください。';
  return error instanceof Error ? error.message : 'パスキーを利用できませんでした';
}
