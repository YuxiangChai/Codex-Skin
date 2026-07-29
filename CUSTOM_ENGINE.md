# Personal Custom Engine

This repository keeps the upstream project and the personal build on separate
local branches:

- `main` mirrors `origin/main` from `Fei-Away/Codex-Dream-Skin`.
- `codex/custom-engine` contains the personal UI policy and is published as
  `personal/main` in `YuxiangChai/Codex-Skin`.

## Current personal policy

- Hide the four recommendation cards on the Codex home screen.
- Suppress the Dream Skin name/status text in the task header.
- Suppress the decorative Dream Skin quote on the home screen.
- Show `Jarvis at your service` on both Chat and Work home screens.
- Keep the native 640 px composer and place its row at the bottom of the home
  screen.

The policy is a small override block at the end of
`runtime/dream-skin.css`. Platform copies are generated; do not edit
`macos/assets/dream-skin.css` or `windows/assets/dream-skin.css` directly.

## Bring in upstream updates

```bash
git fetch origin
git switch main
git merge --ff-only origin/main
git switch codex/custom-engine
git merge main
node tools/sync-runtime-assets.mjs
```

Resolve conflicts only on `codex/custom-engine`, run the applicable tests, then
publish the verified result:

```bash
git push personal codex/custom-engine:main
```

Do not add personal changes to local `main`, and do not push local `main` to
`origin`.

## Local iteration without publishing a release

Small CSS or renderer changes do not need a version bump, GitHub Release, DMG,
or reinstall from the internet.

While ChatGPT / Codex is already open, synchronize generated assets and hot-load
the source tree:

```bash
node tools/sync-runtime-assets.mjs
node macos/scripts/injector.mjs --once --port 9341 --timeout-ms 10000 \
  --theme-dir "$HOME/Library/Application Support/CodexDreamSkinStudio/theme"
```

The hot-load only affects the current renderer session. After a batch is
accepted, close ChatGPT / Codex once and persist that exact local source tree:

```bash
tools/apply-local-development-engine-macos.sh
```

The helper checks that generated macOS and Windows assets match the shared
runtime, atomically installs the local macOS engine, preserves saved themes and
images, and reopens ChatGPT / Codex. Use a version bump and Release only when
distributing a tested build to another machine.

## Installed-app updates

Published personal builds check
`YuxiangChai/Codex-Skin` rather than the upstream release channel. The menu-bar
“检查更新” action downloads only the exact versioned DMG, verifies its GitHub
size and SHA-256 digest, and then opens the verified image. On Windows the tray
action performs the same checks before starting the exact Setup executable.

This separates the two workflows:

- local CSS/engine iteration uses hot-load plus the local apply helper;
- a tested release is published only for distribution, after which the
  installed app can fetch it without manually visiting GitHub.
