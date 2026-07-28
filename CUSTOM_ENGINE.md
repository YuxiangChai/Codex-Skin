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
