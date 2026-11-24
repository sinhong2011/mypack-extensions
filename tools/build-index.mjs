// node tools/build-index.mjs --repo owner/name --commit <40-hex sha>
//
// Prints the Hub list MyPack reads: every extension, each pinned to its
// file at that commit and that file's SHA-256. The app refuses a download
// whose hash differs, so what it installs is exactly what was merged.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { parseHeader, one, sites } from './header.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
  return acc;
}, []));
if (!/^[\w.-]+\/[\w.-]+$/.test(args.repo || '') || !/^[0-9a-f]{40}$/.test(args.commit || '')) {
  console.error('usage: node tools/build-index.mjs --repo owner/name --commit <40-hex sha>');
  process.exit(2);
}

const scripts = [];
for (const dir of readdirSync('extensions', { withFileTypes: true }).filter((d) => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  const path = `extensions/${dir.name}/${dir.name}.user.js`;
  if (!existsSync(path)) continue;
  const buf = readFileSync(path);
  const meta = parseHeader(buf.toString('utf8'));
  const entry = {
    name: one(meta, 'name'),
    description: one(meta, 'description'),
    author: one(meta, 'author') || undefined,
    sites: sites(meta),
    url: `https://raw.githubusercontent.com/${args.repo}/${args.commit}/${path}`,
    sha256: createHash('sha256').update(buf).digest('hex'),
    homepage: `https://github.com/${args.repo}/tree/main/extensions/${dir.name}`
  };
  scripts.push(entry);
}
process.stdout.write(JSON.stringify({ version: 1, scripts }, null, 2) + '\n');
