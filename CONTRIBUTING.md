# Adding or changing an extension

An extension is one folder: `extensions/<name>/` with

- `<name>.user.js`: the userscript (the folder name in lowercase-words-with-dashes),
- `README.md`: what it does, what it asks for and why,
- optionally `<name>.test.js`: tests run with `node --test`.

Check it before opening a pull request:

```sh
node tools/check.mjs --base origin/main
node --test extensions/*/*.test.js
```

## What the check asks of a script

- `@name` (40 characters at most, not taken), `@namespace`, `@description` (200 at most), `@version` as `1.2.3`.
  A changed script raises its `@version`, so apps see the update.
- `@match` (or `@include`) patterns for the sites it runs on. The Hub lists only scripts for named sites, not every site.
- `@grant none`, or each GM function it uses, from those MyPack provides. `GM_xmlhttpRequest` needs a `@connect` for each
  host it talks to (`@connect *` is refused).
- `@require` and `@resource` over `https://`, pinned to a version or commit (or given a `#sha256=` hash).
- No `eval` or `new Function`: it runs only the code in the file. LF line endings.

## What a reviewer looks at

The check cannot tell what a script does. Before merging, a maintainer reads the change for:

- **Data leaving the page.** Requests to other hosts, beacons, analytics, anything sent with the user's sign-in. It
  should do only what its README says.
- **Reach.** Sites, grants and `@connect` no wider than the feature needs.
- **Readable code.** No minified or obfuscated code; third-party code only through pinned `@require`s worth trusting.
- **The page's own data.** Credentials, cookies and tokens stay where they are; a script may use the page's own requests
  as the page does, as X Thread View does, but never send them elsewhere.

When it is merged, the Hub list on the `hub` branch updates by itself (see the README).
