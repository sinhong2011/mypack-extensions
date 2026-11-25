# MyPack Extensions

The extensions in [MyPack](https://github.com/sinhong2011/mypack)'s Hub. They are userscripts in the Greasemonkey
format: MyPack apps (runtime 1.0.12 or later) run them, and so do Violentmonkey, Tampermonkey and ScriptCat.

| Extension | Sites | What it does |
| --- | --- | --- |
| [X Thread View](extensions/x-thread-view) | x.com, twitter.com | Opens a post and its nested replies full screen over the page, without leaving where you are. |

## How the Hub stays what was reviewed

1. Every change comes in as a pull request. CI checks each script's header (name, version, sites, permissions), that a
   changed script raises its `@version`, and runs its tests. A maintainer reads the change before merging.
2. After a merge, [`publish`](.github/workflows/publish.yml) rebuilds the Hub list,
   [`index.json` on the `hub` branch](https://github.com/sinhong2011/mypack-extensions/blob/hub/index.json): each
   extension pinned to its file **at the merged commit**, with that file's SHA-256.
3. MyPack downloads an extension from that commit address and refuses it unless its SHA-256 matches the list. In the app,
   **Hub** next to an extension means the installed file is byte for byte the one in the list; an edited copy says
   *Edited*, and an older one *Update available*.

So nothing reaches the Hub without a reviewed pull request, and nothing changes after it is merged. "Reviewed" means a
maintainer of this repository read it; it is not a security audit.

## Install

From MyPack: **Extensions → Hub**. Or with the CLI:

```sh
mypack scripts install https://raw.githubusercontent.com/sinhong2011/mypack-extensions/main/extensions/x-thread-view/x-thread-view.user.js
```

Apps load extensions when they start, so reopen an app afterwards.

## Add or change an extension

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache 2.0](LICENSE), unless an extension's folder says otherwise.
