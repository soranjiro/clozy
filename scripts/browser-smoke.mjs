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
  // The whole app is reachable via a single cabinet handle; no fixed bottom tabs.
  async function navigate(label) {
    await page.getByRole('button', { name: '場所を移動' }).click();
    await page.getByRole('navigation', { name: 'クローゼットの移動' }).getByRole('button', { name: label, exact: true }).click();
  }
  assert.equal(await page.locator('.mobile-nav').count(), 0, 'bottom tabs are removed');
  await page.getByRole('heading', { name: '今日のクローゼット' }).waitFor();
  assert.equal(await page.locator('.closet-cabinet').count(), 1, 'physical cabinet fills landing page');
  assert.equal(await page.locator('header').count(), 0, 'no application header');
  await page.getByRole('button', { name: '引き出しを開く' }).click();
  assert.equal(await page.getByRole('button', { name: '引き出しを閉じる' }).getAttribute('aria-expanded'), 'true', 'drawer opens');
  await page.getByRole('button', { name: '引き出しを閉じる' }).click();
  await navigate('服を整理');
  await page.getByRole('heading', { name: 'クローゼット', exact: true }).waitFor();
  await page.getByRole('button', { name: 'まとめて登録', exact: true }).click();
  await page.getByLabel('写真なしで名前から追加').fill('白いシャツ\n黒のパンツ\n白いスニーカー');
  await page.getByRole('button', { name: '名前をリストに追加' }).click();
  const rows = page.locator('.bulk-row');
  await rows.nth(1).getByRole('combobox').selectOption('ボトムス');
  await rows.nth(2).getByRole('combobox').selectOption('シューズ');
  await page.getByRole('button', { name: '3着を登録', exact: true }).click();
  await page.getByText('3着登録済み / 0着未登録。', { exact: false }).waitFor();
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).last().click();
  assert.equal(await page.locator('.closet-garment-slide').count(), 3, 'registered clothes populate real hanger rail');
  assert.equal(await page.getByRole('navigation', { name: '収納場所から服を探す' }).getByRole('button', { name: 'トップス、1着' }).count(), 1, 'actual items appear in category compartments');
  await page.getByRole('navigation', { name: '収納場所から服を探す' }).getByRole('button', { name: 'シューズ、1着' }).click();
  assert.equal(await page.locator('.closet-hanging-area.is-shelf').count(), 1, 'shoes live on a shelf');
  await page.getByRole('navigation', { name: '収納場所から服を探す' }).getByRole('button', { name: /すべて/ }).click();
  assert.equal(await page.locator('.closet-garment-slide .garment-art').count(), 3, 'fallback garment silhouettes remain visible');
  await page.getByRole('button', { name: '次の服へ' }).click();
  assert.equal(await page.locator('.closet-garment-slide.is-active').count(), 1, 'next button changes selected hanger');
  await page.getByRole('button', { name: '服を検索' }).click();
  await page.getByRole('searchbox', { name: '服を検索' }).fill('白いシャツ');
  await page.getByRole('button', { name: '白いシャツ', exact: true }).click();
  await page.getByRole('button', { name: '今日着た' }).click();
  await page.getByRole('button', { name: '今日の記録を外す' }).waitFor();
  await page.getByRole('button', { name: '今日の記録を外す' }).click();
  await page.getByRole('button', { name: '今日着た' }).waitFor();
  await page.getByRole('button', { name: '詳細・編集' }).click();
  assert.equal(await page.locator('.category-tiles .category-tile').count(), 8, 'all clothing categories are selectable');
  assert.equal(await page.locator('.season-tiles .season-tile').count(), 4, 'season icons render');
  await page.getByLabel('購入金額').fill('3000');
  await page.getByLabel('商品URL').fill('https://zozo.jp/shop/example/');
  await page.getByLabel('メモ').fill('通勤に使う\n手洗い推奨');
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.locator('.closet-search input').fill('');
  await page.locator('.closet-plaque button').click();
  await page.getByRole('button', { name: '比較に追加' }).click();
  assert.equal(await page.locator('.closet-compare-thumb').count(), 1, 'first comparison item is retained');
  // Explicitly select a different physical compartment; smooth rail scrolling
  // must not make comparison depend on an animation's intermediate index.
  await page.getByRole('navigation', { name: '収納場所から服を探す' }).getByRole('button', { name: 'ボトムス、1着' }).click();
  await page.locator('.closet-plaque button').click();
  await page.getByRole('button', { name: '比較に追加' }).click();
  assert.equal(await page.locator('.closet-compare-thumb').count(), 2, 'two distinct garments selected');
  await page.getByRole('button', { name: '2着を比較', exact: true }).click();
  assert.equal(await page.locator('.closet-compare-columns section').count(), 2, 'side by side comparison renders');
  await page.getByRole('button', { name: '比較画面を閉じる' }).click();
  await page.getByRole('button', { name: '比較を解除' }).click();
  await page.getByRole('navigation', { name: '収納場所から服を探す' }).getByRole('button', { name: /すべて/ }).click();
  await navigate('コーデ');
  await page.getByRole('heading', { name: '今日のコーデ' }).waitFor();
  assert.equal(await page.locator('.planning-panel .wear-option').count(), 3);
  await page.getByRole('button', { name: 'この組み合わせを着用記録', exact: true }).click();
  await page.getByRole('button', { name: 'この日は記録済み', exact: true }).waitFor();
  await navigate('クローゼット');
  await page.getByRole('button', { name: '服を見直す' }).click();
  assert.equal(await page.locator('.category-donut').count(), 1, 'analysis includes wardrobe chart');
  await page.getByRole('heading', { name: '1回着るあたりの金額' }).waitFor();
  await page.getByText('¥3,000 / 回', { exact: true }).waitFor();
  await navigate('服を整理');
  await page.getByRole('button', { name: '服を検索' }).click();
  await page.getByRole('searchbox', { name: '服を検索' }).fill('白いシャツ');
  await page.getByRole('button', { name: '白いシャツ', exact: true }).click();
  await page.getByRole('button', { name: '詳細・編集' }).click();
  await page.getByRole('checkbox', { name: '衣替えで収納中' }).check();
  await page.getByRole('button', { name: '保存する', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('combobox', { name: /衣替え/ }).selectOption('収納中');
  assert.equal(await page.locator('.closet-garment-slide').count(), 1);
  await navigate('コーデ');
  await page.getByRole('heading', { name: '今日のコーデ' }).waitFor();
  assert.equal(await page.locator('.planning-panel .wear-option').count(), 2);
  await page.getByRole('link', { name: 'ZOZOで調べる' }).waitFor();
  await page.screenshot({ path: '/tmp/clozy-desktop.png', fullPage: true });
  // Native WebAuthn through Chromium's virtual platform authenticator.
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await navigate('設定');
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
  await navigate('クローゼット');
  await page.locator('.closet-cabinet').waitFor();
  assert.equal(await page.locator('.closet-cabinet').isVisible(), true, 'mobile first view is the closet');
  assert.equal(await page.getByRole('button', { name: '服を追加', exact: true }).isVisible(), true, 'add control is inside cabinet');
  await page.getByRole('button', { name: '引き出しを開く' }).click();
  assert.equal(await page.locator('.closet-drawer-content.is-open').count(), 1, 'mobile drawer can be explored');
  await page.getByRole('button', { name: '引き出しを閉じる' }).click();
  await page.getByRole('button', { name: '次の服へ' }).click();
  assert.equal(await page.locator('.closet-garment-slide.is-active').count(), 1, 'mobile rail supports tapping to advance');
  const rail = page.locator('.closet-rail-track');
  const beforeSlide = await rail.evaluate(el => el.scrollLeft);
  await rail.evaluate(el => el.scrollBy({left:140,behavior:'instant'}));
  await page.waitForTimeout(150);
  assert.notEqual(await rail.evaluate(el => el.scrollLeft), beforeSlide, 'hanger rail supports native horizontal scrolling');
  await navigate('コーデ');
  await page.getByRole('heading', { name: '今日のコーデ' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'mobile overflow');
  await page.screenshot({ path: '/tmp/clozy-mobile.png', fullPage: true });
  assert.equal(await page.locator('.mobile-nav').count(), 0, 'mobile layout has no bottom navigation');
  await page.getByRole('button', { name: '場所を移動' }).click();
  assert.equal(await page.getByRole('navigation', { name: 'クローゼットの移動' }).getByRole('button', { name: '設定' }).isVisible(), true, 'settings remain discoverable');
  await page.getByRole('button', { name: '移動メニューを閉じる' }).click({ position: { x: 8, y: 8 } });
  await page.setViewportSize({ width: 320, height: 720 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, '320px mobile overflow');
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate('着用記録');
  await page.getByRole('button', { name: '週', exact: true }).click();
  assert.equal(await page.locator('.day-cell').count(), 7, 'week calendar has seven days');
  await page.getByRole('button', { name: 'リスト', exact: true }).click();
  assert.equal(await page.locator('.calendar-list').count(), 1, 'list calendar renders');
  await page.getByRole('button', { name: '月', exact: true }).click();
  assert.equal(await page.locator('.day-cell').count(), 42, 'month calendar has 42 slots');
  await navigate('服を整理');
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
  assert.equal(await page.locator('.closet-garment-slide').count(), 3, 'closet shows three active garments after one was archived');
  assert.equal(await page.locator('.closet-drawer-content').getAttribute('aria-hidden'), 'true', 'closed drawer is hidden from assistive technology');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await navigate('クローゼット');
  await page.getByRole('button', { name: '引き出しを開く' }).click();
  assert.equal(await page.locator('.closet-drawer-content.is-open').count(), 1, 'reduced motion keeps drawer functional');
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
  // A fresh public preview can be explored with synthetic clothes and wear history.
  // This browser context must never import a private user's cloud snapshot.
  const demoContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const demoPage = await demoContext.newPage();
    const demoErrors = [];
    demoPage.on('pageerror', error => demoErrors.push(error.message));
    await demoPage.goto(base + '/?demo=1');
    await demoPage.getByRole('heading', { name: '今日のクローゼット' }).waitFor();
    assert.equal(await demoPage.locator('.closet-garment-slide').count(), 26, 'review preview shows 26 synthetic garments');
    assert.equal(await demoPage.locator('.closet-rail-track .garment-art').count(), 26, 'sample garments have colored illustrations without remote images');
    await demoPage.getByRole('navigation', { name: '収納場所から服を探す' }).getByRole('button', { name: 'アウター、9着' }).click();
    assert.equal(await demoPage.locator('.closet-garment-slide').count(), 9, 'category counts reflect actual sample data');
    await demoPage.getByRole('navigation', { name: '収納場所から服を探す' }).getByRole('button', { name: /すべて/ }).click();
    await demoPage.locator('.closet-plaque button').click();
    await demoPage.getByRole('button', { name: 'ChatGPTで相談' }).click();
    await demoPage.getByRole('dialog', { name: 'コーデを相談する' }).waitFor();
    assert.ok((await demoPage.getByLabel('相談する内容').inputValue()).includes('Clozy'));
    await demoPage.getByLabel('ChatGPTプロジェクトのURL（任意）').fill('https://chatgpt.com.evil.example/g/g-p-test');
    await demoPage.getByText('ChatGPTのプロジェクトのリンクを設定してください。').waitFor();
    await demoPage.getByLabel('ChatGPTプロジェクトのURL（任意）').fill('https://chatgpt.com/g/g-p-sample-project');
    assert.equal(await demoPage.getByText('ChatGPTのプロジェクトのリンクを設定してください。').count(), 0);
    await demoPage.getByRole('button', { name: '相談を閉じる' }).click();
    await demoPage.getByRole('button', { name: '場所を移動' }).click();
    await demoPage.getByRole('navigation', { name: 'クローゼットの移動' }).getByRole('button', { name: '服を見直す' }).click();
    assert.equal(await demoPage.locator('.metric strong').nth(1).innerText().then(x => x.replace(/\s/g,'')), '99回', 'synthetic wears power history stats');
    await demoPage.getByRole('button', { name: '自分のデータに切替' }).click();
    await demoPage.getByRole('button', { name: '見本データを見る' }).waitFor();
    await demoPage.getByRole('button', { name: '見本データを見る' }).click();
    await demoPage.getByRole('button', { name: '自分のデータに切替' }).waitFor();
    await demoPage.getByRole('button', { name: '場所を移動' }).click();
    await demoPage.getByRole('navigation', { name: 'クローゼットの移動' }).getByRole('button', { name: '設定' }).click();
    await demoPage.getByRole('heading', { name: 'これは見本のクローゼットです' }).waitFor();
    assert.deepEqual(demoErrors, [], 'demo environment has no browser exceptions');
  } finally { await demoContext.close(); }
    assert.deepEqual(errors, []);
  console.log('PASS: immersive horizontal hanger rail, drawer, garment inspection, bulk photos, metadata, wardrobe analytics, outfit recording, passkey, mobile and reduced motion; no page errors');
} finally { await browser?.close(); server?.kill('SIGTERM'); }
