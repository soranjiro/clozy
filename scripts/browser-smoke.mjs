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
  async function go(name) {
    await page.getByRole('button', { name: '機能一覧を開く', exact: true }).click();
    await page.getByRole('navigation', { name: '機能一覧' }).getByRole('button', { name, exact: true }).click();
  }
  async function closePanel() { await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).last().click(); }
  async function index() { await page.getByRole('button', { name: '写真索引・検索を開く' }).click(); }
  async function edit(name) {
    await page.getByRole('button', { name: name + 'を取り出す', exact: true }).click();
    await page.getByRole('button', { name: '詳細・編集', exact: true }).click();
  }
  await page.getByRole('heading', { name: '最初の1着からはじめよう' }).waitFor();
  assert.equal(await page.locator('.topbar:visible, .mobile-nav:visible, .sidebar:visible').count(), 0);
  await page.getByRole('button', { name: 'まとめて登録', exact: true }).first().click();
  await page.getByLabel('写真なしで名前から追加').fill('白いシャツ\n黒のパンツ\n白いスニーカー');
  await page.getByRole('button', { name: '名前をリストに追加' }).click();
  const rows = page.locator('.bulk-row');
  await rows.nth(1).getByRole('combobox').selectOption('ボトムス');
  await rows.nth(2).getByRole('combobox').selectOption('シューズ');
  await page.getByRole('button', { name: '3着を登録', exact: true }).click();
  await page.getByText('3着登録済み / 0着未登録。', { exact: false }).waitFor();
  await closePanel();
  assert.equal(await page.locator('.closet-piece').count(), 3);
  assert.equal(await page.locator('#zone-tops .closet-piece').count(), 1);
  assert.equal(await page.locator('#zone-bottoms .closet-piece').count(), 1);
  assert.equal(await page.locator('#zone-shoes .closet-piece').count(), 1);
  await edit('白いシャツ');
  await page.getByLabel('購入金額').fill('3000');
  await page.getByLabel('商品URL').fill('https://zozo.jp/shop/example/');
  await page.getByLabel('メモ').fill('通勤に使う\n手洗い推奨');
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  for (const name of ['白いシャツ', '黒のパンツ', '白いスニーカー']) {
    await page.getByRole('button', { name: name + 'を取り出す', exact: true }).click();
    await page.getByRole('button', { name: 'コーデに追加', exact: true }).click();
    await closePanel();
  }
  await page.getByRole('button', { name: '選んだコーデを開く' }).click();
  assert.equal(await page.locator('.closet-outfit>div').count(), 3);
  await page.getByRole('button', { name: 'この組み合わせを着用記録', exact: true }).click();
  await page.getByRole('button', { name: 'この日は記録済み', exact: true }).waitFor();
  await closePanel();
  await go('分析');
  await page.getByText('¥3,000 / 回', { exact: true }).waitFor();
  await go('クローゼット');
  await edit('白いシャツ');
  await page.getByRole('checkbox', { name: '衣替えで収納中' }).check();
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#zone-stored .closet-piece').count(), 1);
  assert.equal(await page.locator('#zone-tops .closet-piece').count(), 0);
  await index();
  await page.getByRole('combobox', { name: '衣替え', exact: true }).selectOption('収納中');
  assert.equal(await page.locator('.closet-index-grid>button').count(), 1);
  await page.getByRole('button', { name: '絞り込みを解除' }).click();
  await page.getByRole('searchbox', { name: '服を検索' }).fill('存在しない服');
  await page.getByText('条件に合う服がありません。検索条件を変更してください。').waitFor();
  await page.getByRole('button', { name: '絞り込みを解除' }).click();
  await closePanel();
  await go('コーデ');
  assert.equal(await page.locator('.planning-panel .wear-option').count(), 2);
  await page.getByRole('link', { name: 'ZOZOで調べる' }).waitFor();
  // Existing account lock remains usable through the furniture menu.
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await go('設定');
  await page.getByRole('button', { name: 'パスキーを登録', exact: true }).click();
  await page.getByRole('button', { name: '今すぐロック', exact: true }).click();
  await page.getByRole('button', { name: 'パスキーで開く', exact: true }).click();
  await page.locator('.app-shell').waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'パスキーで開く', exact: true }).click();
  await page.locator('.app-shell').waitFor();
  await go('カレンダー');
  await page.getByRole('button', { name: '週', exact: true }).click();
  assert.equal(await page.locator('.day-cell').count(), 7);
  await page.getByRole('button', { name: 'リスト', exact: true }).click();
  assert.equal(await page.locator('.calendar-list').count(), 1);
  await page.getByRole('button', { name: '月', exact: true }).click();
  assert.equal(await page.locator('.day-cell').count(), 42);
  await go('クローゼット');
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
  await closePanel();
  await index();
  assert.equal(await page.locator('.closet-index-grid>button').count(), 4);
  await closePanel();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px overflow`);
    await index();
    assert.equal(await page.getByRole('dialog').evaluate(e => e.scrollWidth <= e.clientWidth), true, `${width}px drawer overflow`);
    await closePanel();
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '黒のパンツを取り出す' }).click();
  assert.equal(await page.locator('.closet-inspect').evaluate(e => getComputedStyle(e).animationName), 'none');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  // Scale fixtures live only in a disposable browser context, never in user data.
  const scaleContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const scalePage = await scaleContext.newPage();
  scalePage.on('pageerror', e => errors.push(e.message));
  await scalePage.goto(base);
  await scalePage.getByRole('heading', { name: '最初の1着からはじめよう' }).waitFor();
  await scalePage.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('clozy-local', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise((resolve, reject) => {
      const tx = db.transaction('clothing', 'readwrite');
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      for (let i = 0; i < 1000; i++) tx.objectStore('clothing').put({ id: crypto.randomUUID(), name: `服${String(i).padStart(4, '0')}`, category: i < 700 ? 'トップス' : i < 850 ? 'ボトムス' : 'シューズ', color: '', brand: '', size: '', notes: '', favorite: false, createdAt: new Date(1700000000000 + i * 1000).toISOString(), updatedAt: new Date().toISOString() });
    });
    db.close();
  });
  await scalePage.reload();
  await scalePage.getByText('1000 pieces', { exact: true }).waitFor();
  assert(await scalePage.locator('.closet-piece').count() <= 27, '1000 garments do not mount 1000 photos');
  const rail = scalePage.locator('#zone-tops .closet-rail-scroll');
  await rail.focus();
  await scalePage.keyboard.press('ArrowRight');
  await scalePage.waitForTimeout(400);
  assert(await rail.evaluate(e => e.scrollLeft > 100), 'keyboard moves rail');
  await scalePage.getByRole('button', { name: '写真索引・検索を開く' }).click();
  assert.equal(await scalePage.locator('.closet-index-grid>button').count(), 36);
  await scalePage.getByRole('button', { name: '次の36着', exact: true }).click();
  await scalePage.getByText('2 / 28', { exact: true }).waitFor();
  await scalePage.getByRole('searchbox', { name: '服を検索' }).fill('服0000');
  assert.equal(await scalePage.locator('.closet-index-grid>button').count(), 1);
  await scalePage.locator('.closet-index-grid>button').click();
  await scalePage.getByRole('dialog', { name: '服0000', exact: true }).waitFor();
  await scalePage.getByRole('button', { name: '閉じる', exact: true }).click();
  await scalePage.locator('#zone-tops .closet-piece.is-centered').getByText('服0000', { exact: true }).waitFor();
  await scalePage.evaluate(() => scrollTo(0, 0));
  await scalePage.screenshot({ path: '/tmp/clozy-immersive-mobile.png', fullPage: true });
  await scalePage.setViewportSize({ width: 1440, height: 1000 });
  await scalePage.screenshot({ path: '/tmp/clozy-immersive-desktop.png', fullPage: true });
  await scaleContext.close();
  // A merchant's HTTPS link lands in an unsaved draft, never an automatic purchase import.
  const shareContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const sharePage = await shareContext.newPage();
    await sharePage.goto(base + '/?from=share&title=' + encodeURIComponent('白のシャツ') + '&url=' + encodeURIComponent('https://store.example/products/shirt'));
    await sharePage.getByRole('dialog', { name: '服を登録' }).waitFor();
    assert.equal(await sharePage.getByLabel('アイテム名').inputValue(), '白のシャツ');
    assert.equal(await sharePage.getByLabel('商品URL').inputValue(), 'https://store.example/products/shirt');
    assert.equal(new URL(sharePage.url()).search, '', 'share URL is removed from browser history');
    await sharePage.getByRole('button', { name: 'キャンセル' }).click();
    assert.equal(await sharePage.getByRole('dialog').count(), 0, 'shared item remains unsaved when dismissed');
  } finally { await shareContext.close(); }
  const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const demoPage = await demoContext.newPage();
    demoPage.on('pageerror', error => errors.push(error.message));
    await demoPage.goto(base + '/?demo=1');
    await demoPage.getByText('26 pieces', { exact: true }).waitFor();
    await demoPage.locator('#zone-tops .closet-piece').first().click();
    await demoPage.getByRole('button', { name: 'ChatGPTで相談', exact: true }).click();
    await demoPage.getByRole('dialog', { name: 'コーデを相談する' }).waitFor();
    assert.ok((await demoPage.getByLabel('相談する内容').inputValue()).includes('Clozy'));
    await demoPage.getByLabel('ChatGPTプロジェクトのURL（任意）').fill('https://chatgpt.com.evil.example/g/g-p-test');
    await demoPage.getByText('ChatGPTのプロジェクトのリンクを設定してください。').waitFor();
    await demoPage.getByRole('button', { name: '相談を閉じる' }).click();
    await demoPage.getByRole('button', { name: '機能一覧を開く' }).click();
    await demoPage.getByRole('navigation', { name: '機能一覧' }).getByRole('button', { name: '設定', exact: true }).click();
    await demoPage.getByRole('heading', { name: 'これは見本のクローゼットです' }).waitFor();
    await demoPage.getByRole('button', { name: '自分のデータに切替' }).click();
    await demoPage.getByRole('button', { name: '見本データを見る' }).waitFor();
  } finally { await demoContext.close(); }
  assert.deepEqual(errors, []);
  console.log('PASS: immersive rails, index, manual outfits, archive, existing planning/calendar/analysis, bulk image retry, passkey, mobile overflow, reduced motion');
} finally { await browser?.close(); server?.kill('SIGTERM'); }
