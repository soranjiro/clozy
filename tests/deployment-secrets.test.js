import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const configPath = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url));
const ignorePath = fileURLToPath(new URL('../.gitignore', import.meta.url));

describe('tracked deployment configuration', () => {
  it('never embeds a Firebase web API key in Wrangler vars', () => {
    const raw = readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    expect(raw).not.toMatch(/AIza[A-Za-z0-9_-]{25,}/);
    expect(config.vars?.FIREBASE_WEB_CONFIG).toBeUndefined();
    expect(config.env?.preview?.vars?.FIREBASE_WEB_CONFIG).toBeUndefined();
    expect(config.vars?.FIREBASE_PROJECT_ID).toBeTruthy();
    expect(config.env?.preview?.vars?.FIREBASE_PROJECT_ID).toBeTruthy();
  });
  it('ignores local Pages development secrets', () => {
    expect(readFileSync(ignorePath, 'utf8')).toContain('.dev.vars*');
  });
});
