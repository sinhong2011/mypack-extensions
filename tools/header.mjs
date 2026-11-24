// Reading a userscript's ==UserScript== header, the way MyPack does.

export function parseHeader(src) {
  const m = /\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/.exec(src);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^\s*\/\/\s*@([\w:-]+)(?:\s+(.*?))?\s*$/.exec(line);
    if (!kv) continue;
    const key = kv[1], val = kv[2] || '';
    (meta[key] = meta[key] || []).push(val);
  }
  return meta;
}

export function one(meta, key) {
  return (meta[key] && meta[key][0]) || '';
}

// sites are the hosts a script runs on, as the Hub shows them: from its
// @match and @include patterns, "*.x.com" shown as "x.com". "*" means
// every site, which the Hub does not list.
export function sites(meta) {
  const out = [];
  for (const p of [...(meta.match || []), ...(meta.include || [])]) {
    if (p === '<all_urls>' || p === '*' || p === '*://*/*') return ['*'];
    const i = p.indexOf('://');
    if (i < 0) continue;
    let h = p.slice(i + 3).split(/[/?#]/)[0];
    if (h === '*') return ['*'];
    h = h.replace(/^\*\./, '');
    if (h && !out.includes(h)) out.push(h);
  }
  return out;
}
