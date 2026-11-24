// node tools/check.mjs [--base <git ref>]
//
// Checks every extension the way the Hub needs it, and (with --base, on a
// pull request) that a changed script says so with a new @version.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { parseHeader, one, sites } from './header.mjs';

// What MyPack's runtime offers scripts (anything else does nothing there).
const GRANTS = new Set([
  'none', 'unsafeWindow', 'window.close', 'window.focus',
  'GM_addStyle', 'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_listValues',
  'GM_getResourceText', 'GM_getResourceURL', 'GM_info', 'GM_log', 'GM_notification',
  'GM_openInTab', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand', 'GM_setClipboard',
  'GM_xmlhttpRequest'
]);
const RUN_AT = new Set(['', 'document-start', 'document-body', 'document-end', 'document-idle', 'context-menu']);
const SEMVER = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const args = process.argv.slice(2);
const base = args[0] === '--base' ? args[1] : '';

const problems = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);
const names = new Map();

const root = 'extensions';
for (const dir of readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const slug = dir.name;
  const where = `${root}/${slug}`;
  if (!SLUG.test(slug)) bad(where, 'the folder name must be lowercase-words-with-dashes');
  const file = join(root, slug, `${slug}.user.js`);
  if (!existsSync(file)) { bad(where, `needs ${slug}.user.js`); continue; }
  if (!existsSync(join(root, slug, 'README.md'))) bad(where, 'needs a README.md saying what it does and why it asks for what it asks');
  const src = readFileSync(file, 'utf8');
  if (src.includes('\r\n')) bad(file, 'use LF line endings');
  const meta = parseHeader(src);
  if (!meta) { bad(file, 'no ==UserScript== header'); continue; }

  const name = one(meta, 'name');
  if (!name || [...name].length > 40) bad(file, '@name is required, 40 characters at most');
  if (names.has(name.toLowerCase())) bad(file, `@name "${name}" is taken by ${names.get(name.toLowerCase())}`);
  names.set(name.toLowerCase(), file);
  if (!one(meta, 'namespace')) bad(file, '@namespace is required (it keeps the install id stable)');
  const desc = one(meta, 'description');
  if (!desc || [...desc].length > 200) bad(file, '@description is required, 200 characters at most');
  if (!SEMVER.test(one(meta, 'version'))) bad(file, '@version must look like 1.2.3');

  const hosts = sites(meta);
  if (!hosts.length) bad(file, 'needs @match (or @include) patterns with a host');
  if (hosts.includes('*')) bad(file, 'runs on every site: the Hub lists only scripts for named sites');
  if (hosts.length > 20) bad(file, 'more than 20 sites');
  if (meta.exclude && !meta.match && !meta.include) bad(file, '@exclude without @match');

  const grants = meta.grant || [];
  if (!grants.length) bad(file, 'say @grant none, or each GM_* function it uses');
  for (const g of grants) if (!GRANTS.has(g)) bad(file, `@grant ${g} is not something MyPack provides`);
  if (grants.includes('none') && grants.length > 1) bad(file, '@grant none with other grants');
  if (!RUN_AT.has(one(meta, 'run-at'))) bad(file, `@run-at ${one(meta, 'run-at')} is not supported`);
  if (grants.includes('GM_xmlhttpRequest') && !(meta.connect || []).length) {
    bad(file, 'GM_xmlhttpRequest needs @connect for each host it talks to');
  }
  for (const c of meta.connect || []) if (c === '*') bad(file, '@connect * lets it reach anything: name the hosts');
  for (const r of [...(meta.require || []), ...(meta.resource || []).map((x) => x.split(/\s+/)[1] || '')]) {
    if (!/^https:\/\//.test(r)) bad(file, `@require/@resource must be https:// (${r})`);
    else if (!/[@/](v?\d+\.\d+\.\d+|[0-9a-f]{40})[/@]|#sha(256|384|512)[-=]/.test(r)) {
      bad(file, `pin @require/@resource to a version or commit, or give a #sha256= hash (${r})`);
    }
  }
  if (/\beval\s*\(|new\s+Function\s*\(/.test(src)) bad(file, 'eval / new Function: run only code that is in the file');

  // A changed script carries a new version, so apps see the update.
  if (base) {
    let old = '';
    try { old = execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch {}
    if (old && old !== src) {
      const was = one(parseHeader(old) || {}, 'version');
      if (was === one(meta, 'version')) bad(file, `changed but still @version ${was}: raise it`);
    }
  }
}

if (problems.length) {
  console.error(problems.map((p) => '✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`✓ ${names.size} extension${names.size === 1 ? '' : 's'} ok`);
