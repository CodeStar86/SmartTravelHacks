import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOTS = ['src', 'supabase/functions'];
const ALLOWED = new Set([
  path.normalize('src/app/lib/logger.ts'),
  path.normalize('src/lib/logger.ts'),
  path.normalize('supabase/functions/server/observability.ts'),
]);
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const CONSOLE_PATTERN = /\bconsole\.(log|warn|error|info|debug)\s*\(/;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const offenders = [];
for (const root of ROOTS) {
  for (const file of await walk(root)) {
    const normalized = path.normalize(file);
    if (ALLOWED.has(normalized)) continue;
    const content = await readFile(file, 'utf8');
    if (CONSOLE_PATTERN.test(content)) offenders.push(file);
  }
}

if (offenders.length) {
  console.error('Console statements are not allowed outside logger wrappers:');
  for (const file of offenders) console.error(`- ${file}`);
  process.exit(1);
}
