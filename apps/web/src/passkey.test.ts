import { afterEach, describe, expect, it, vi } from 'vitest';
import { decode, encode, rawSignature, unlockPasskey } from './passkey';

afterEach(() => vi.unstubAllGlobals());
async function mockAuthenticator(options: { flags?: number; origin?: string; challenge?: string; corrupt?: boolean; rp?: string } = {}) {
  const key = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = encode(new Uint8Array(await crypto.subtle.exportKey('spki', key.publicKey)));
  vi.stubGlobal('location', { origin: 'https://clozy.example', hostname: 'clozy.example' });
  vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ id: 'AQID', publicKey }) });
  vi.stubGlobal('navigator', { credentials: { get: async ({ publicKey: request }: { publicKey: PublicKeyCredentialRequestOptions }) => {
    const clientDataJSON = new TextEncoder().encode(JSON.stringify({ type: 'webauthn.get', challenge: options.challenge ?? encode(new Uint8Array(request.challenge as ArrayBuffer)), origin: options.origin ?? 'https://clozy.example' })).buffer;
    const auth = new Uint8Array(37);
    auth.set(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(options.rp ?? 'clozy.example'))));
    auth[32] = options.flags ?? 5;
    const signed = new Uint8Array(69);
    signed.set(auth); signed.set(new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataJSON)), 37);
    const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key.privateKey, signed));
    if (options.corrupt) signature[0] = signature[0]! ^ 1;
    const integer = (part: Uint8Array) => {
      let start = 0;
      while (start < part.length - 1 && part[start] === 0) start++;
      const bytes = [...part.slice(start)];
      if (bytes[0]! >= 128) bytes.unshift(0);
      return [2, bytes.length, ...bytes];
    };
    const body = [...integer(signature.slice(0, 32)), ...integer(signature.slice(32))];
    return { id: 'AQID', response: { clientDataJSON, authenticatorData: auth.buffer, signature: new Uint8Array([48, body.length, ...body]).buffer } };
  } } });
}

describe('local passkey assertions', () => {
  it('verifies a real ES256 signature', async () => { await mockAuthenticator(); await expect(unlockPasskey()).resolves.toBeUndefined(); });
  it.each([
    { flags: 1 }, { flags: 4 }, { origin: 'https://attacker.example' },
    { challenge: 'replayed-challenge' }, { rp: 'attacker.example' }, { corrupt: true }
  ])('rejects invalid assertion %j', async options => {
    await mockAuthenticator(options);
    await expect(unlockPasskey()).rejects.toThrow();
  });
});

describe('local passkey encoding and signature verification', () => {
  it('round-trips binary IDs with URL-safe encoding', () => {
    const bytes = new Uint8Array([0, 255, 254, 128, 1]);
    expect(encode(bytes)).not.toMatch(/[+/=]/);
    expect(decode(encode(bytes))).toEqual(bytes);
  });
  it('converts padded DER integers to 64-byte Web Crypto signatures', () => {
    const r = new Uint8Array(33); r[1] = 128;
    const s = new Uint8Array(32); s[31] = 1;
    const signature = rawSignature(new Uint8Array([48, 69, 2, 33, ...r, 2, 32, ...s]));
    expect(signature).toHaveLength(64);
    expect(signature[0]).toBe(128);
    expect(signature[63]).toBe(1);
  });
  it('accepts short integers but rejects malformed/truncated signatures', () => {
    const signature = rawSignature(new Uint8Array([48, 6, 2, 1, 1, 2, 1, 2]));
    expect(signature[31]).toBe(1);
    expect(signature[63]).toBe(2);
    for (const bytes of [[], [48, 0], [48, 6, 2, 1, 1, 2, 2, 2], [48, 6, 2, 1, 1, 3, 1, 2]]) {
      expect(() => rawSignature(new Uint8Array(bytes))).toThrow();
    }
  });
});
