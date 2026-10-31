#!/usr/bin/env node
// Local, bounded quality loop. No AI/API calls, deploys, commits or package installs.
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);
const once = args.includes('--once');
function numberOption(name, fallback, min, max) {
  const i = args.indexOf(name);
  const value = i < 0 ? fallback : Number(args[i + 1]);
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${name}: ${min}〜${max}で指定してください`);
  return value;
}
const hours = numberOption('--hours', 5, 0.001, 5);
const interval = numberOption('--interval', 20, 1, 3600) * 1000;
const deadline = Date.now() + hours * 60 * 60 * 1000;
const controller = new AbortController();
let child;
let stopping = false;
let failed = false;
function stop() {
  stopping = true;
  controller.abort();
  // npm spawns subprocesses: stop the whole group on POSIX, not only npm.
  function kill(running, signal) {
    try {
      if (process.platform !== 'win32' && running.pid) process.kill(-running.pid, signal);
      else running.kill(signal);
    } catch (error) { if (error.code !== 'ESRCH') console.error(error.message); }
  }
  if (child) {
    const running = child;
    kill(running, 'SIGTERM');
    const timer = setTimeout(() => kill(running, 'SIGKILL'), 3000);
    timer.unref();
  }
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
const deadlineTimer = setTimeout(stop, Math.max(1, deadline - Date.now()));
async function fingerprint() {
  const hash = createHash('sha256');
  async function visit(path) {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (['node_modules', 'dist', '.git', '.wrangler', '.npm-cache'].includes(entry.name)) continue;
      const file = `${path}/${entry.name}`;
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) hash.update(file).update(await readFile(file));
    }
  }
  for (const path of ['apps', 'packages', 'scripts']) await visit(path);
  for (const file of ['package.json', 'package-lock.json', 'tsconfig.json']) hash.update(await readFile(file));
  return hash.digest('hex');
}
function run(script) {
  return new Promise(resolve => {
    console.log(`\n[${new Date().toISOString()}] npm run ${script}`);
    child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
      stdio: 'inherit', detached: process.platform !== 'win32'
    });
    child.on('error', error => { if (!stopping) console.error(error.message); resolve(false); });
    child.on('exit', code => { child = undefined; resolve(code === 0); });
  });
}
console.log(`Clozy quality loop: 最大${hours}時間。変更時のみ検証。停止: Ctrl+C`);
console.log('これはコードを自動生成するエージェントではありません。修正中の型・テスト・ビルドを継続監視します。');
try {
  let previous;
  while (!stopping && Date.now() < deadline) {
    const next = await fingerprint();
    if (next !== previous) {
      previous = next;
      failed = false;
      for (const script of ['typecheck', 'test', 'build', 'test:browser']) {
        if (stopping) break;
        if (!await run(script)) { failed = true; break; }
      }
      if (!stopping) console.log(failed ? '\n検証失敗。修正を保存すると再検証します。' : '\nすべての検証が成功しました。');
    }
    if (once) break;
    await sleep(Math.min(interval, Math.max(1, deadline - Date.now())), undefined, { signal: controller.signal });
  }
} catch (error) {
  if (!stopping) { console.error(error); failed = true; }
} finally {
  clearTimeout(deadlineTimer);
  console.log('\n検証ループを終了しました。');
  process.exitCode = failed ? 1 : 0;
}
