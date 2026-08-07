# Codex Dream Skin Studio

Unofficial macOS theme studio for the **official Codex Desktop** app.

Turn an image you like into one continuous full-window Codex theme. The same wallpaper runs beneath the native sidebar and main surface, while route-aware translucency keeps home, task, plugin, scheduled-task, and pull-request controls fully interactive and readable.

This project injects through **local loopback CDP**. It does **not** modify the official `.app`, `app.asar`, or code signature.

> Not affiliated with OpenAI. Codex is a trademark of its respective owners.

## Requirements

- macOS 13 Ventura or newer (the native DMG app declares macOS 13 as its minimum)
- Official Codex Desktop installed and launched at least once (`~/.codex/config.toml` exists)
- No global Node.js install required (uses Codex’s signed bundled Node after validation)

## Release install (recommended)

普通用户请从 [GitHub Releases](https://github.com/YuxiangChai/Codex-Skin/releases) 下载
`CodexDreamSkin-vX.Y.Z.dmg`，按 [`docs/install-macos.md`](../docs/install-macos.md) 的图形界面步骤
拖入 Applications。正式 Developer ID 签名并公证的版本可从菜单完整自动更新；ad-hoc 开发构建也会
自动下载、校验、备份和替换，并优先直接重启新版 App、Codex 和当前皮肤。只有 macOS 实际阻止新版
App 启动时才打开“系统设置 → 隐私与安全性”作为兜底。不需要手动运行 `xattr` 或安装源码，用户主题
和图片会保留。

### Maintainer signing and notarization

本机构建默认仍使用 ad-hoc 签名，避免伪装成可分发产物；个人 Release 在没有完整证书 secrets 时也
会明确生成 ad-hoc 包，其更新走需要 Gatekeeper 确认的辅助路径。正式分发需要 Apple Developer Program
签发的 `Developer ID Application` 证书，并先把 notarytool 凭据存入钥匙串。例如：

```bash
xcrun notarytool store-credentials dreamskin-notary \
  --apple-id "APPLE_ID" --team-id "TEAM_ID" --password "APP_SPECIFIC_PASSWORD"

DREAMSKIN_CODESIGN_IDENTITY="Developer ID Application: NAME (TEAM_ID)" \
DREAMSKIN_NOTARY_PROFILE="dreamskin-notary" \
./scripts/build-dmg.sh
```

构建器会使用 hardened runtime 与可信时间戳签 App 和 DMG，分别提交公证、staple 并运行
`spctl` 校验。凭据只放在本机钥匙串或 CI secrets，不提交到仓库。没有 Developer ID 身份时，
构建器继续产生明确的 ad-hoc 开发包；辅助更新会保留 quarantine，并在 macOS 实际阻止新版启动时
才要求用户通过系统设置确认。

## Advanced: run from source

The Release DMG above is the normal user path. The commands below are for
contributors, diagnostics, and legacy deployments.

```bash
# 1) Optional checks (needs the installed Codex/ChatGPT.app bundled Node)
./tests/run-tests.sh

# 2) Install to the stable path and create Desktop launchers
./scripts/install-dream-skin-macos.sh --no-launch

# 3) Switch to the tested featured preset, or import your own pure background
~/.codex/codex-dream-skin-studio/scripts/switch-theme-macos.sh --id preset-iron-man
# ~/.codex/codex-dream-skin-studio/scripts/customize-theme-macos.sh

# 4) Start/re-apply, verify, or restore via Desktop:
#    Codex Dream Skin.command
#    Codex Dream Skin - Customize.command
#    Codex Dream Skin - Verify.command
#    Codex Dream Skin - Restore.command

# 5) Legacy only: install the old SwiftBar menu (do not enable it beside the native app)
./Install\ Menu\ Bar.command
# Look for 🎨 Skin in the top-right menu bar
```

Install location after step 2:

| Item | Path |
| --- | --- |
| Engine | `~/.codex/codex-dream-skin-studio` |
| State / logs / user images | `~/Library/Application Support/CodexDreamSkinStudio` |
| Theme backup | under Application Support (`theme-backup.json`) |

## Legacy standalone ZIP (maintainer/offline packaging only)

To build the “double-click install” folder layout for non-git users:

```bash
./scripts/build-client-release.sh "$HOME/Desktop/Codex 主题编辑器.zip"
```

That ZIP contains a visible installer plus a hidden `.codex-dream-skin-studio`
engine and is staged with only the redistributable Iron Man preset. It is
retained for existing offline workflows; prefer the DMG for ordinary users.
Do not ship only CSS/images.

## How it works (security boundary)

1. Discover `com.openai.codex` and validate signature / Team ID / arch / bundled Node.
2. Start Codex via user `launchd` with CDP bound to `127.0.0.1` only.
3. Accept the debug port only when it belongs to Codex (or a legitimate child).
4. Inject only into expected `app://` renderer targets.
5. Resolve the selected theme and image to real paths, then enforce 10 MB,
   `16384px`-per-side, and 50-megapixel limits before injection.
6. Keep a small injector alive across reloads and route changes.
7. Pause/Restore stops the injector only when PID, executable, script path, and
   start time match the recorded job; a stop failure preserves state and aborts.
8. Config backup/restore requires Codex to be closed, strict UTF-8, an operation
   lock, same-directory atomic replacement, and an unchanged-byte check.

CDP is powerful and unauthenticated on loopback. Prefer Restore when you are done theming.

## Bundled presets

The public DMG and source checkout seed only **Iron Man**. Its pack contains
`background.jpg`, `theme.json`, and Safe CSS in `theme.css`; the image and both
configuration files are pinned by SHA-256 in the macOS and Windows release
builders. The user confirmed that the background is AI generated and may be
redistributed. It is not an official OpenAI/Codex or Marvel visual or
endorsement.

Seeding is idempotent. Upgrades remove retired bundled preset IDs; your own
`custom-*` themes from “换一张图” and the currently active theme copy are
never touched. A regular `themes/.disable-bundled-presets` marker opts a local
library out of future preset seeding without deleting custom themes.

To contribute a preset, see [`presets/README.md`](./presets/README.md).

## Import a theme ZIP

The native menu-bar app has **导入主题 ZIP…**. It accepts ordinary `.zip`
files only; `.dreamskin` is deliberately unsupported. An official Studio pack
contains `manifest.json`, non-empty `theme.json`, non-empty `theme.css`, and exactly one
`background.webp|jpg|png`, with optional `LICENSE.txt` and the
reserved `manifest.sig`. Put them at archive root or inside one top-level theme
folder. A local simplified pack must contain exactly `theme.json`, `theme.css`, and its
referenced image; because it lacks manifest integrity and compatibility data,
use that format only for trusted local content.

The importer allows at most 32 MiB compressed, 32 entries, and 64 MiB expanded.
It rejects links, traversal, nested archives, unregistered payload files, and
anything that fails theme/image validation. Official packs also verify the
platform, minimum client version, and each manifest payload's byte length and
SHA-256. Safe CSS is locally revalidated on import and every apply, then runs
only against the 12 registered parts. `manifest.sig` is reserved and not used
for signature verification; `LICENSE.txt` is preserved. Previously saved legacy
themes without CSS remain switchable and inject no additional CSS.

An import only adds to **已保存的主题**. It never replaces or applies the
active/last-known-good copy. Reimporting identical content reports a duplicate;
a newer pack with the same ID replaces the saved copy in place after its stored
identity is confirmed. Only a legacy suffix directory (`-2`, `-3`, and so on)
with an identical semantic fingerprint is consolidated; names alone never prove
that a directory is a duplicate, so ambiguous entries are preserved.

Manual fallback: choose **打开主题文件夹**, or open
`~/Library/Application Support/CodexDreamSkinStudio/themes/`, then move in the
complete extracted directory whose immediate children are `theme.json`, `theme.css`, and the
referenced image. Reopen the menu afterward. Do not add another wrapper folder;
manual placement bypasses archive checks, so use trusted content only.

## Image guidelines

- PNG / JPEG / HEIC / TIFF / WebP (macOS readable)
- Source ≤ 50 MB; prepared file ≤ 10 MB, ≤ 16384 px per side, and ≤ 50 MP
- `2560 × 1440` (16:9) is the recommended master size; width ≥ 2000 px minimum
- Keep roughly the left 50%–58% calm and low-contrast for native home content;
  place the subject in the right 58%–88% without touching the edge
- Use pure edge-to-edge background art only: no window chrome, sidebar, cards,
  buttons, composer, readable text, logo, or watermark
- The prompt-ready composition template and negative prompt live in
  [`docs/reference-background-prompt-guide.md`](../docs/reference-background-prompt-guide.md)

## Adaptive image themes

The renderer treats every image as a theme input instead of assuming a fixed
character palette. It downsamples the image in a local Canvas to estimate
brightness, accent color, visual focus, left/right safe area, and aspect ratio.
The pixels stay in the Codex renderer; there is no upload or external API call.
If Canvas analysis is unavailable, the theme falls back to a safe default and
the detected Codex shell/OS appearance.

Theme metadata is optional. The defaults are deliberately adaptive:

```json
{
  "appearance": "auto",
  "art": {
    "focusX": 0.72,
    "focusY": 0.45,
    "safeArea": "auto",
    "taskMode": "auto",
    "scope": "window",
    "sidebar": "solid"
  }
}
```

- `appearance`: `auto`, `light`, or `dark`. `auto` follows the native
  Codex/ChatGPT or OS appearance; an explicit value wins. Image luminance
  still informs palette and composition, but never overrides the user's UI mode.
- `art.focusX` / `art.focusY`: normalized `0..1` coordinates used for
  `background-position` (left/top is `0`, right/bottom is `1`).
- `art.safeArea`: `auto`, `left`, `right`, `center`, or `none`. Automatic mode
  finds the lower-information side so native home content does not cover the
  subject. Use `none` when the artwork should fill the composition evenly.
- `art.taskMode`: `auto`, `ambient`, `banner`, `full`, or `off`. Ultra-wide art
  automatically uses a full-width task banner with a vertical fade; standard
  art uses a quieter ambient layer. `full` keeps the artwork at normal strength
  with only the baseline readability veil; `off` removes the task-page artwork
  while leaving the rest of the theme active.
- `art.scope`: `window` or `main`. `window` preserves the full-window immersive
  layout. `main` paints the image only inside the responsive main surface and
  keeps the sidebar on the theme's solid `panel` color, so the image stays
  centered when the sidebar is expanded, collapsed, or absent.
- `art.sidebar`: `solid` or `shared`. It only changes `scope: main`: `solid`
  keeps the sidebar on `panel`, while `shared` extends one continuous wallpaper
  under the sidebar and shifts its focal point by half the current inline
  sidebar width. Collapsing the sidebar returns the focal point to the window
  center. The renderer observes the sidebar's style attribute without layout
  reads. Shared mode does not add a separate task-page veil over the main
  surface, so the sidebar and conversation always have the same exposure.
- `art.dim`: a number from `0` to `1`. The theme owns this uniform black
  overlay for the shared canvas (`0` is unchanged, `1` is fully black). The
  engine does not change it between home and task routes.

The image-derived palette is used unless a theme explicitly supplies color
fields. Explicit art metadata (`focusX`, `focusY`, `safeArea`, `taskMode`,
`scope`, `sidebar`, `dim`) has
the same priority over automatic inference. The home route remains expressive;
task routes keep native content, cards, composer, and code readable above the
image layer.

CLI example:

```bash
~/.codex/codex-dream-skin-studio/scripts/customize-theme-macos.sh \
  --image "/path/to/image.png" \
  --name "My theme" \
  --accent "#7cff46" \
  --secondary "#36d7e8" \
  --highlight "#642a8c"
```

To tune composition without changing the image, pass the adaptive fields to
the image loader:

```bash
~/.codex/codex-dream-skin-studio/scripts/load-image-theme-macos.sh \
  --file "/path/to/image.png" \
  --appearance auto \
  --focus-x 0.72 --focus-y 0.45 \
  --safe-area left --task-mode banner \
  --art-scope main --art-sidebar shared --art-dim 0.18
```

Reset to the bundled abstract demo:

```bash
~/.codex/codex-dream-skin-studio/scripts/customize-theme-macos.sh --reset-demo
```

## License

MIT — see `LICENSE`. Additional notices in `NOTICE.md` cover trademarks,
runtime Node, user-provided artwork, third-party rights, and assets that are not
licensed under the software license.

## Sponsors

Thanks to **[passion8.cc](https://passion8.cc/register?aff=TuPe)** for sponsoring this project.

<p align="center">
  <a href="https://passion8.cc/register?aff=TuPe">
    <img src="../docs/images/sponsor-passion8.png" alt="Passion8" height="96">
  </a>
</p>

<p align="center">
  <a href="https://passion8.cc/register?aff=TuPe"><strong>Passion8｜感谢 passion8.cc 赞助本项目</strong></a><br>
  AI API 中转站，支持 Codex / Claude Code / Grok 等工具接入。主题与 API 配置互相独立。
</p>

## What this is not

- Not an OpenAI product and not a fork of Codex source
- Not a way to patch or rebrand the official binary
- Not a Windows build (see `../windows/`)
- Not an API proxy: theming does not change model providers or API keys

If you use a third-party API relay, configure it separately — keep theme install and API config as two explicit steps.
