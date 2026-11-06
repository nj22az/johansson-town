#!/usr/bin/env node
// Runs the CI guard: the test files listed in tests/ci-guard.txt, which all pass on main.
// Usage (from johansson-town/): node tools/ci-guard.mjs [--test-concurrency=N]
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = readFileSync(join(root, 'tests/ci-guard.txt'), 'utf8')
  .split('\n').map((line) => line.replace(/#.*/, '').trim()).filter(Boolean).map((name) => join('tests', name));
const missing = files.filter((file) => !existsSync(join(root, file)));
if (missing.length) {
  console.error(`ci-guard: listed but missing: ${missing.join(', ')}`);
  process.exit(1);
}
const concurrency = process.argv.find((arg) => arg.startsWith('--test-concurrency=')) ?? '--test-concurrency=4';
const started = Date.now();
const run = spawnSync(process.execPath, ['--test', concurrency, '--test-timeout=900000', ...files],
  { cwd: root, stdio: 'inherit' });
const seconds = Math.round((Date.now() - started) / 1000);
const ok = run.status === 0;
console.log(`\nci-guard: ${files.length} files, ${ok ? 'all green' : 'FAILED'} in ${seconds}s`);
process.exit(ok ? 0 : (run.status || 1));
