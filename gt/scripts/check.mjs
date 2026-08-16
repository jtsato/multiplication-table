import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) files.push(path);
  }
  return files;
}

const files = [...await collect('src'), ...await collect('scripts'), ...await collect('tests')];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`Syntax OK: ${files.length} JavaScript files`);
