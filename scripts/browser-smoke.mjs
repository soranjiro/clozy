import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
const base = process.env.CLOZY_URL ?? 'http://localhost:4175';
// External URLs are opt-in; contexts are ephemeral and never use a user's browser profile.
const server = process.env.CLOZY_URL ? undefined : spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--port', '4175', '--strictPort', '--host', '127.0.0.1'], { cwd: fileURLToPath(new URL('../apps/web/', import.meta.url)), stdio: 'ignore' });
let serverError;
server?.on('error', e => { serverError = e; });
let browser;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    await sleep(100);
    if (serverError) throw serverError;
    if (server && server.exitCode !== null) throw new Error('テストサーバーを起動できません（ポート4175を確認）');
    try { if ((await fetch(base)).ok) break; } catch {}
    if (attempt === 99) throw new Error('テストサーバーの起動待ちが時間切れです');
  }
  browser = await chromium.launch({ ...(process.env.CLOZY_CHROME ? { executablePath: process.env.CLOZY_CHROME } : {}), headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.goto(base);
  await page.getByRole('heading', { name: '最初の1着からはじめよう' }).waitFor();
  await page.getByRole('navigation').getByRole('button', { name: 'クローゼット' }).click();
  await page.getByRole('button', { name: 'まとめて登録', exact: true }).click();
  await page.getByLabel('写真なしで名前から追加').fill('白いシャツ\n黒のパンツ\n白いスニーカー');
  await page.getByRole('button', { name: '名前をリストに追加' }).click();
  const rows = page.locator('.bulk-row');
  await rows.nth(1).getByRole('combobox').selectOption('ボトムス');
  await rows.nth(2).getByRole('combobox').selectOption('シューズ');
  await page.getByRole('button', { name: '3着を登録', exact: true }).click();
  await page.getByText('3着登録済み / 0着未登録。', { exact: false }).waitFor();
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).last().click();
  assert.equal(await page.locator('.garment-card').count(), 3);
  await page.getByRole('button', { name: '白いシャツ', exact: true }).click();
  await page.getByLabel('購入金額').fill('3000');
  await page.getByLabel('商品URL').fill('https://zozo.jp/shop/example/');
  await page.getByLabel('メモ').fill('通勤に使う\n手洗い推奨');
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('navigation').getByRole('button', { name: '服選び', exact: true }).click();
  await page.getByRole('heading', { name: '何を着よう？' }).waitFor();
  assert.equal(await page.locator('.planning-panel .wear-option').count(), 3);
  await page.getByRole('button', { name: 'この組み合わせを着用記録', exact: true }).click();
  await page.getByRole('button', { name: 'この日は記録済み', exact: true }).waitFor();
  await page.getByRole('navigation').getByRole('button', { name: 'スタイル分析', exact: true }).click();
  await page.getByRole('heading', { name: '1回着るあたりの金額' }).waitFor();
  await page.getByText('¥3,000 / 回', { exact: true }).waitFor();
  await page.getByRole('navigation').getByRole('button', { name: 'クローゼット', exact: true }).click();
  await page.getByRole('button', { name: '白いシャツ', exact: true }).click();
  await page.getByRole('checkbox', { name: '衣替えで収納中' }).check();
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('combobox', { name: /衣替え/ }).selectOption('収納中');
  assert.equal(await page.locator('.garment-card').count(), 1);
  await page.getByRole('navigation').getByRole('button', { name: '服選び', exact: true }).click();
  await page.getByRole('heading', { name: '何を着よう？' }).waitFor();
  assert.equal(await page.locator('.planning-panel .wear-option').count(), 2);
  await page.getByRole('link', { name: 'ZOZOで調べる' }).waitFor();
  await page.screenshot({ path: '/tmp/clozy-desktop.png', fullPage: true });
  // Native WebAuthn through Chromium's virtual platform authenticator.
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await page.getByRole('navigation').getByRole('button', { name: '設定', exact: true }).click();
  await page.getByRole('button', { name: 'パスキーを登録', exact: true }).click();
  await page.getByRole('button', { name: '今すぐロック', exact: true }).waitFor();
  await page.getByRole('button', { name: '今すぐロック', exact: true }).click();
  await page.getByRole('heading', { name: 'おかえりなさい。' }).waitFor();
  await page.getByRole('button', { name: 'パスキーで開く', exact: true }).click();
  await page.locator('.app-shell').waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'おかえりなさい。' }).waitFor();
  await page.getByRole('button', { name: 'パスキーで開く', exact: true }).click();
  await page.locator('.app-shell').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('navigation', { name: 'モバイルナビゲーション' }).getByRole('button', { name: '服選び', exact: true }).click();
  await page.getByRole('heading', { name: '何を着よう？' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'mobile overflow');
  await page.screenshot({ path: '/tmp/clozy-mobile.png', fullPage: true });
  await page.getByRole('navigation', { name: 'モバイルナビゲーション' }).getByRole('button', { name: 'クローゼット', exact: true }).click();
  await page.getByRole('button', { name: 'まとめて登録', exact: true }).click();
  await page.locator('.bulk-inputs input[type=file]').setInputFiles([
    { name: '追加の服.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64') },
    { name: '破損した写真.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') }
  ]);
  await page.getByRole('button', { name: '2着を登録', exact: true }).click();
  await page.getByText('1着登録済み / 1着未登録。', { exact: false }).waitFor();
  await page.getByText('画像を開けませんでした。', { exact: false }).waitFor();
  await page.getByRole('button', { name: '1着を登録', exact: true }).click();
  await page.getByRole('button', { name: '1着を登録', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).last().click();
  assert.equal(await page.locator('.garment-card').count(), 4, 'retry must not duplicate the successful photo row');
  assert.deepEqual(errors, []);
  console.log('PASS: bulk names/photos, corrupt-photo partial retry without duplication, metadata edit, outfit recording, cost analysis, seasonal storage, shopping links, virtual passkey registration/unlock/reload, mobile layout; no page errors');
} finally { await browser?.close(); server?.kill('SIGTERM'); }
