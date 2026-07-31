# Task Progress

Updated: 2026-07-31 (Asia/Shanghai)

## Personal v1.5.9.2 Release and Assisted-Update Smoke Test (2026-07-31)

- [goal] Publish the committed personal `v1.5.9.2` macOS App, then exercise
  the installed `v1.5.9.1` App's “检查更新” flow against the new public Release.
- [release_candidate] Functional source commit `f925244` contains the synchronized six-file
  `1.5.9.2` version, Iron Man user-message surface, default-closed pinned
  summary, Settings continuity/flash fix, and current homepage behavior.
- [verified] `personal/main` is an ancestor of the release candidate, so the
  personal repository can be fast-forwarded without rewriting history.
  Source-level macOS tests pass with only the live Doctor skipped because the
  currently running older injected session intentionally cannot verify against
  the new workspace payload; signed runtime and theme-switch tests pass.
- [in_progress] Build and mount-check the local DMG, push the release candidate
  to personal `main`, wait for the public GitHub Release assets, then verify the
  assisted updater. Do not modify or publish to upstream `origin`.
- [finding] The first DMG build correctly stopped at the reviewed Iron Man
  metadata hash because `theme.json` intentionally changed. The background and
  Safe CSS hashes remain unchanged; the reviewed metadata hash was updated to
  the exact new manifest bytes before rebuilding.
- [verified] The rebuilt local universal macOS DMG passed its mandatory mount,
  strict code-signature, bundle/engine version, URL scheme, two-architecture,
  sole-preset and packaged-runtime checks. Local candidate SHA-256 is
  `9209abea07e0095e76bc8ef2d1aed30b21b25aef7a592411dfaa2a4b12bcb505`.

## Theme-Owned User Message Surface and v1.5.9.2 (2026-07-31)

- [goal] Give only user-authored chat messages a subtle translucent
  theme-owned surface, retain native assistant-message rendering, then prepare
  and commit the complete current macOS work as personal version `1.5.9.2`.
- [finding] The renderer already exposes the stable
  `[data-message-author-role]` boundary, but all roles currently receive the
  same public `message` part. Safe CSS cannot distinguish user messages without
  a dedicated registered part.
- [design] Expose `data-message-author-role="user"` as the bounded public part
  `message-user`; keep all other roles on `message`. Add `message-user` to the
  shared Safe CSS contract and add optional `colors.userMessage` to the theme
  color contract. Legacy themes derive a 12%-alpha surface from their own
  accent, so saved themes do not need to be recreated.
- [finding] GitHub currently reports personal release `v1.5.9.1` and upstream
  release `v1.5.9`. The previously displayed `1.5.10` was an unpublished local
  development-engine version, not a downloadable update. The four-component
  comparator intentionally orders `1.5.9.2 < 1.5.10`.
- [complete] Renderer and Safe CSS regressions were added before implementation.
  The shared runtime now labels user messages, applies the theme-owned
  `colors.userMessage` token, derives the exact Iron Man cyan fallback
  `rgba(100, 230, 255, 0.12)` for the existing custom theme, and keeps optional
  color-schema validation backward compatible.
- [complete] All six version-bound runtime files and their current-version
  assertions now use `1.5.9.2`; the updater continues to order the future
  upstream `1.5.10` after this personal revision.
- [verified] Focused Safe CSS, package import, macOS/Windows renderer, selector
  sync, shell/Node syntax, `git diff --check`, and all portable Windows Node
  tests pass. The complete macOS suite passes with Swift build, all 11 XCTest
  cases, signed theme switching, runtime-state integration and package/security
  regressions when only the live Doctor is skipped.
- [finding] The live Doctor correctly rejects the currently running older
  injected session when checked against the new `1.5.9.2` workspace payload.
  This is an expected local deployment mismatch, not a source regression; a
  traced fully enabled suite reaches only that final live verification before
  returning `2`.
- [constraint] The running ChatGPT instance blocks the atomic installer, so no
  live engine replacement or restart was forced. Preserve unsent content and
  commit the reviewed source without pushing, tagging or publishing.

## Pinned Summary Default-Closed Policy (2026-07-31)

- [goal] Keep the native `Toggle pinned summary` panel closed by default while
  preserving the user's ability to open and close it normally on demand.
- [finding] ChatGPT 26.727 exposes a stable native button with
  `aria-label="Toggle pinned summary"` and `aria-pressed="false|true"`; its
  wrapper reports `data-state="closed|delayed-open"`. The control is currently
  closed and lives in the native header above the thread surface.
- [design] Add a narrow registered selector and observer. Automatically close
  only an open state that was not preceded by a trusted user click. A trusted
  click that opens the panel grants permission for the current thread surface;
  replacing the thread surface resets the policy to default-closed. Never hide
  or remove the native control.
- [complete] Registered the native control as `pinned-summary-toggle` and added
  a bounded observer for its `aria-pressed` state. An automatic/untrusted open
  is closed once; a trusted user click may open it normally, a trusted close
  revokes that permission, and replacing the thread surface restores the
  default-closed policy. The button remains visible and usable.
- [verified] Renderer regressions cover initial auto-open, trusted manual open
  and thread replacement. Runtime assets are synchronized for macOS and
  Windows, selector diagnostics and `git diff --check` pass, and the complete
  macOS suite passes including Swift build and all 11 XCTest cases.
- [verified] The managed live engine was hot-updated without restarting the
  App. A simulated automatic open returned to `aria-pressed="false"`; a real
  user click remained open, and a second real click closed it. The panel was
  left closed.
- [decision] The fix is active locally. No commit, push, tag, Release, App
  replacement or ChatGPT restart was performed.
- [constraint] Preserve the current uncommitted Settings/theme work. Do not
  commit, push, publish, replace the App, or restart ChatGPT.

## Settings First-Frame Flash (2026-07-31)

- [goal] Remove the brief opaque flash when entering Settings without adding a
  second wallpaper, restarting ChatGPT, or changing native Settings layout.
- [root_cause] Live MutationObserver evidence captured the first Settings DOM
  frame while the renderer route attribute still read `thread`: the settings
  navigation computed to `color(srgb 0.164706 0.168627 0.235294 / 0.7)` and
  the main settings surface to opaque `rgb(30, 30, 46)`. About one coalesced
  route pass later, `data-dream-base-state` became `settings` and both surfaces
  became transparent. The background image and `240px` sidebar geometry never
  changed; the flash is the delayed CSS gate itself.
- [complete] The two Settings transparency rules now gate directly on their
  verified Settings DOM selectors, so Chromium applies them in the same style
  calculation that creates the native route surfaces. The route attribute is
  retained for diagnostics and non-first-frame policies.
- [verified] After hot-deploying only the synchronized CSS, the real first DOM
  frame was sampled again while `data-dream-base-state` still read `thread`:
  both navigation and main Settings surfaces already computed
  `rgba(0, 0, 0, 0)`. Width `240px`, offset `120px`, and dim `0.5` stayed
  unchanged. Closing Settings returned to a verified `thread` route.
- [verified] Focused macOS/Windows renderer tests, runtime asset sync,
  `git diff --check`, and the complete macOS suite pass, including Swift build
  and all 11 XCTest cases plus package/import/security regressions.
- [decision] The fix is active in the managed local engine. No App restart,
  commit, push, tag or Release was performed.
- [constraint] Preserve the current uncommitted work. Do not commit, push,
  publish, replace the App, or restart ChatGPT.

## Iron Man Dim, Retired Theme, and Settings Continuity (2026-07-31)

- [goal] Raise the Iron Man theme-owned image dim to `0.5`, prevent a stale
  retired Gothic Void preset from reappearing after App replacement, and let
  Settings use the same continuous wallpaper without changing its geometry
  when the native sidebar is temporarily absent.
- [finding] The installed v1.5.9.1 App bundles only Iron Man. Gothic Void was
  created in the saved-theme library before the current App replacement and
  survived because reinstall/upgrade intentionally preserves user theme data.
  The existing seed cleanup removes it when the managed engine installer runs,
  but an older App does not overwrite or rerun installation for the newer
  locally deployed v1.5.10 engine.
- [finding] Shared main-centered artwork is already painted once on the
  persistent `body`. During a Settings route transition the native sidebar
  disappears, so the renderer currently changes the saved sidebar width from
  its last valid value to zero; that changes both wallpaper scale and focal
  offset until Settings closes.
- [complete] Added regression coverage and preserved the last valid
  shared-sidebar geometry through Settings. The renderer now refreshes route
  scope before parts, exposes `data-dream-base-state`, and keeps one stable
  body canvas instead of resetting its width/offset to zero.
- [complete] Added verified macOS 26.727 Settings selectors and made only its
  opaque navigation/content route surfaces transparent in shared main-art
  mode. Native cards and controls retain their own readable surfaces.
- [complete] The native saved-theme menu now filters exact retired bundled
  preset IDs while preserving all custom IDs. Both platform Iron Man preset
  manifests now use theme-owned `art.dim: 0.5`; synchronized runtime assets
  and focused macOS/Windows renderer plus selector-doctor tests pass.
- [complete] Updated the current saved and active `custom-iron-man` theme to
  `art.dim: 0.5`, removed the exact stale
  `preset-gothic-void-crusade` directory through the existing bounded preset
  cleanup, and hot-deployed the synchronized renderer/CSS/selectors into the
  managed local v1.5.10 engine without restarting ChatGPT.
- [finding] Live Settings verification initially exposed one additional
  26.727 compatibility gap: target discovery and early injection still
  recognized only the retired appearance-radio/theme-preview anchors. Added
  `settings-sidebar` to macOS and Windows probe, bootstrap and visible L0
  verification paths, then restarted only the recorded injector watcher.
- [verified] Real 1512x949 Settings transition holds the exact same shared
  canvas geometry before, during and after the route:
  sidebar width `240px`, focal offset `120px`, dim `0.5`, background position
  `calc(50% + 120px) 42%`, and unchanged cover size. Both Settings route
  surfaces compute transparent; Settings verifies as visible L0 and returning
  to the thread verifies as L1 with no overflow. Screenshot:
  `/private/tmp/iron-man-settings-continuity.png`.
- [verified] The complete macOS suite passes, including Swift build and all 11
  XCTest cases, shell/static/security/package/import/renderer tests. All
  portable Windows Node tests, shared runtime sync and `git diff --check`
  pass. The live saved-theme library now contains only `custom-iron-man`, and
  managed renderer/CSS/selectors are byte-identical to the source outputs.
- [decision] No App was replaced or restarted, and no commit, push, tag or
  Release was created.
- [constraint] Do not publish, tag, push, replace the installed App, or restart
  ChatGPT/Codex without a new explicit user request.

## Personal README Rewrite (2026-07-31)

- [goal] Replace the inherited upstream-facing README with a concise personal
  product page for `YuxiangChai/Codex-Skin`.
- [complete] Removed the inherited sponsorship, DreamSkin.cc community,
  upstream marketing, cross-platform walkthrough and extended theme-package
  documentation from the root README.
- [complete] Documented the personal behavior: theme-owned home copy across
  Chat/Work/Codex, vertically centered greeting, main-surface image focus,
  continuous shared-sidebar artwork, theme-owned dimming, compact Work-style
  composer, hidden recommendation cards, transparent chrome, guarded theme CSS,
  engine repair and assisted ad-hoc updates.
- [complete] Kept one upstream acknowledgement at the end of the README and
  linked installation, release and Iron Man source files maintained by this
  repository.
- [verified] All relative README targets exist, both external repository links
  respond, Markdown fences are balanced, `git diff --check` passes, and the
  inherited sponsor/community/Windows/English-README terms are absent. The
  upstream project name and repository appear only once, in Credit.
- [complete] Committed the rewrite as `cd0d4e1` with CI skipped and pushed it
  to personal `main`; no version, tag or Release asset changed.

## Personal v1.5.9.1 Release (2026-07-31)

- [goal] Publish the explicitly requested personal macOS release `v1.5.9.1`
  from `YuxiangChai/Codex-Skin`, containing the unreleased local compatibility,
  repair, self-update, Gatekeeper-assistance and Iron Man UI work.
- [decision] Personal releases use
  `upstream-major.upstream-minor.upstream-patch.personal-revision`. Three-part
  upstream versions compare as revision zero, so
  `1.5.9 < 1.5.9.1 < 1.5.10`. Theme package versions remain three-part; only
  Dream Skin client/minimum-client comparisons accept the optional revision.
- [remote] `origin/main` is still `cd71dfd` (`v1.5.9`) and contains no commits
  missing from the current branch. `personal/main` is `5b3fb24` and is an
  ancestor of the current branch, so the release can be a fast-forward without
  rewriting history.
- [complete] Six release version sources are synchronized to `1.5.9.1`.
  Swift, shell, PowerShell, runtime theme compatibility and the personal
  Release workflow now accept and compare the optional fourth numeric part.
- [verified] Complete macOS regression suite passes outside the SwiftPM
  sandbox, including Swift build and all 10 XCTest cases. All 60 macOS and 18
  Windows portable Node regressions pass; payload checks and shell syntax pass.
  Windows-native PowerShell tests remain CI work because `pwsh` is unavailable
  on this Mac.
- [verified] Built and independently mounted the arm64 smoke-test
  `CodexDreamSkin-v1.5.9.1.dmg`. Bundle short/build version and bundled engine
  are all `1.5.9.1`; the executable is arm64, Bundle ID is
  `cc.dreamskin.menubar`, strict ad-hoc code-signature verification passes, and
  the reviewed Iron Man preset is present. Local DMG SHA-256 is
  `dff3e511555830994413bbcd0c2a9e25cfb61b0efbc4b71cf57acd41b739d793`.
- [complete] Release commit `112ca3578fec32346fafa119b7e75c7b3b32bb60`
  was fast-forwarded to personal `main`. GitHub Release run
  `30610704512` passed its guard, portable regressions, tag creation, macOS
  build, asset verification and publication jobs.
- [released] Public non-prerelease GitHub Release `v1.5.9.1` was published at
  `2026-07-31T06:50:46Z`; its tag points exactly at the release commit. Assets
  are `CodexDreamSkin-v1.5.9.1.dmg` (2,978,569 bytes) and
  `SHA256SUMS.txt`.
- [verified] Re-downloaded the public DMG in independent byte ranges and
  confirmed the published checksum:
  `e123d7581fb986b557789049a5c281dd534161137aa4cb16fde91642ef638818`.
  The public DMG mounts read-only and contains a strict-valid ad-hoc universal
  (`x86_64 arm64`) App. App short/build version and bundled engine are all
  `1.5.9.1`; Bundle ID, Iron Man preset, repair helper and update helper match
  the release contract.
- [complete] Publication is finished. The first installation of this release
  remains a manual DMG replacement and may require macOS Privacy & Security
  approval; later personal releases can use the included assisted updater.

## Engine Repair, Self-Update, and Border Cleanup (2026-07-31)

- [goal] Make the bundled-engine repair action understandable and complete,
  replace the manual DMG drag workflow with a confirmed, verified, atomic
  in-app self-update, remove visible skin border colors, and reconcile the
  result with the latest upstream without losing personal behavior.
- [constraints] macOS is the active product target. Preserve Iron Man,
  main-centered shared artwork, theme-owned dimming, unified custom home title,
  bottom compact composer, hidden recommendation cards, transparent session
  footer and ChatGPT 26.727 renderer compatibility. Do not push, tag, publish,
  or claim updater availability without a new explicit user request.
- [finding] “安装 / 修复引擎” currently copies the engine bundled inside the
  menu-bar App into the managed `~/.codex/codex-dream-skin-studio` runtime,
  validates versions and required files, and preserves user themes. It is not
  an online update. The current installed App bundles v1.5.9 while the managed
  local hotfix is v1.5.10, so repair correctly refuses a downgrade. Even at
  equal versions, the current UI does not coordinate the installer’s required
  ChatGPT shutdown, repair, restart and skin reapply.
- [finding] “检查更新” already presents a native version confirmation and
  downloads/verifies the DMG’s GitHub size and SHA-256, but stops after opening
  Finder. The user still has to quit the menu-bar App and drag/replace it.
- [finding] Fetched `origin/main`; it remains `cd71dfd` (v1.5.9), already
  incorporated by local merge `53e71e5`. `HEAD..origin/main` contains zero
  commits, so there is currently no upstream merge to perform.
- [complete] Replaced the repair menu action with an explicit native
  confirmation and a bundled repair transaction. It validates the official
  ChatGPT runtime, stops only the recorded injector, removes its launch job,
  restarts ChatGPT only when it was previously running, atomically reinstalls
  the App-bundled same-version engine, preserves user themes, and reapplies.
  A newer managed engine is still never downgraded by an older App.
- [complete] Added a confirmation-driven self-updater. It keeps the fixed
  personal GitHub channel and existing size/SHA checks, mounts the DMG
  read-only, validates the app/engine version, Bundle ID, strict code
  signature and signing mode, then uses a detached acknowledged helper to
  rename the current App to a rollback copy and install the staged App. Signed
  updates additionally require a matching Apple Team ID and successful
  Gatekeeper assessment, reopen automatically, and roll back if startup is not
  acknowledged. It never requests privilege, strips quarantine, disables
  Gatekeeper, or touches theme/image state.
- [complete] Added an explicit ad-hoc assisted-update path for the personal
  no-certificate release channel. It accepts only two strictly valid ad-hoc
  bundles after the fixed GitHub size/SHA/package checks, requires a reusable
  quarantine record on the current App, copies that record onto the replacement
  instead of deleting it, triggers the macOS block once, and opens Privacy &
  Security. The user only clicks “仍要打开”; successful startup acknowledges the
  transaction and removes the old hidden backup.
- [complete] Developer ID + hardened-runtime signing and App/DMG
  notarization/stapling remain supported but optional. The personal Release
  workflow builds an explicitly ad-hoc package when all signing secrets are
  absent, rejects partially configured secrets, and switches to the signed
  path only when all six values exist. This Mac still has zero identities.
- [complete] Made selected sidebar chrome consume the theme `line` token rather
  than a hard-coded accent border. Iron Man now sets `line: transparent` and
  uses registered Safe CSS parts to clear sidebar, main, header, composer and
  project-list border colors. Other themes retain control of their own lines.
- [verified] Full macOS regression suite passes outside the SwiftPM sandbox:
  Swift build, all 10 XCTest cases, shell/static safety checks, renderer/CSS
  sync, Safe CSS, payload, package/import and installer rollback tests. Built
  an arm64 App and DMG, mounted and statically validated the DMG, confirmed
  both new helpers are packaged/executable, and regression-covered the rule
  that assisted updates may write but never remove/clear quarantine.
  Signed-runtime integrations are explicit skips; actual Developer ID/notary
  submission cannot be exercised without credentials.
- [decision] No upstream merge was needed, no installed App was replaced, and
  no push, tag or Release was created. Publication remains forbidden until the
  user explicitly requests it.

## ChatGPT 26.727 Injection Compatibility (2026-07-31)

- [root_cause] The installed ChatGPT app updated to `26.727.40816`, while the
  current v1.5.9 selector contract was verified against `26.721.41059`.
  The visible 1512x949 renderer still exposes the native sidebar, composer and
  thread surface, but `main.main-surface` became a CSS-module
  `_MainContentSurface_…` class, `header.app-header-tint` became
  `_Header_…`, and the prior home-only `[role="main"]` marker is absent on
  the active thread. The injector therefore rejects the real renderer before
  installing any theme; the theme package and its managed background remain
  intact.
- [verified] The second 408x400 `app:` target is an auxiliary renderer with no
  sidebar, composer or thread surface and must continue to be rejected. The
  compatibility fix must not weaken target binding to accept that window.
- [complete] Added regression coverage for the new visible renderer while
  retaining the existing sidebar-gated auxiliary-window rejection. Updated the
  shared selector contract to accept both the old semantic classes and stable
  CSS-module name prefixes without matching build hashes; regenerated the
  byte-identical macOS/Windows renderer and CSS assets.
- [complete] Stopped the stale v1.5.9 launchd watcher that was immediately
  restoring its old payload after a one-shot source injection. Hot-deployed
  the verified local v1.5.10 engine to the managed `~/.codex` engine directory,
  restarted its watcher, and confirmed the installed engine remains active on
  port 9341 with `custom-iron-man`, exact revision
  `cdca77883d0d4daa06e8`, visible 1512x949 window, L1 thread scope, zero
  missing anchors and no horizontal overflow.
- [verified] Real-session screenshot:
  `/private/tmp/chatgpt-26727-dream-skin-fixed.png`. The Iron Man canvas,
  shared sidebar, dimming, transparent session surfaces and compact composer
  are visibly restored.
- [verified] Shared asset sync, focused selector/bootstrap/window/renderer/CSS
  tests, payload checks and `git diff --check` pass. The complete macOS suite
  passes outside the restricted SwiftPM sandbox, including the native Swift
  build, all 10 XCTest cases, shell/static/runtime/package/import/security
  regressions. Signed-runtime integrations are explicit environment skips.
- [decision] The user explicitly prohibited publishing a new version unless
  asked. The v1.5.10 identifier is local and unreleased: do not push, create a
  tag, trigger Release, or claim updater availability.
- [pending] Commit locally if desired; publication remains blocked on a new
  explicit user instruction. The currently open renderer is a thread, so the
  26.727 home route has not yet received a separate live navigation smoke test.

## Personal v1.5.9 Update (2026-07-30)

- [complete] Reduced the current macOS saved-theme library to the user's
  `custom-iron-man` theme only; removed the saved Gothic Void Crusade and Arina
  Hashimoto copies without changing the redistributable upstream preset assets.
- [complete] Added and regression-covered the local
  `themes/.disable-bundled-presets` preference. The current profile has the
  marker enabled, so later engine upgrades remove only presets shipped by that
  engine instead of silently re-adding them; custom themes remain untouched.
- [complete] Raised both the saved and active Iron Man theme-owned
  `art.dim` value from `0.28` to `0.4`, reapplied it through the validated
  theme switch path, and confirmed the renderer verification passed.
- [complete] Confirmed the personal repository already has public tags through
  `v1.5.8`, while `origin/main` has advanced to `v1.5.9`; the next personal
  updater-visible release must therefore be `v1.5.9`, not a reused `v1.5.8`.
- [in_progress] Commit the unified `homeTitle` implementation, merge the
  upstream v1.5.9 Windows one-click handoff fix, re-run release-level tests,
  and push the verified result to `YuxiangChai/Codex-Skin` main.
- [note] The downloaded Marvel/Iron Man artwork remains local and is not added
  to the public repository or release assets because redistribution rights
  were not established. Engine updates preserve the user's managed theme
  state and background image.

## Main-Surface Artwork Scope (2026-07-30)

- [complete] Added an opt-in `art.scope: "main"` theme setting so artwork is
  painted inside the responsive Codex/ChatGPT main surface instead of the
  full window. The default remains `"window"` for every existing theme.
- [complete] For main-scoped artwork, the default solid-sidebar mode keeps the
  native sidebar on the theme's opaque `panel` color and paints its resize
  extension the same color.
  The artwork must stay centered in `main.main-surface` as the sidebar expands,
  collapses, or disappears; no measured width or fixed pixel offset is allowed.
- [complete] Added the opt-in shared-sidebar variant that
  paints one continuous window background while keeping its focal center pinned
  to the responsive main surface. The renderer may parse Codex's sanitized
  inline sidebar width and observe that one style attribute, but must not add
  layout reads, polling, duplicate artwork, or fixed-width assumptions.
- [complete] Covered the shared renderer attribute/CSS contract, strict official
  package schema, and both macOS and Windows theme loaders before changing the
  runtime implementation.
- [complete] Set only the local Iron Man theme to main/shared scope with
  theme-owned dimming, applied the live payload, and verified expanded,
  collapsed, and restored sidebar states against the real app.

## Upstream v1.5.8 Merge (2026-07-30)

- [complete] Committed the pre-merge custom-engine snapshot as `2bdeb12`.
- [complete] Fetched `origin/main@0cb4e29` (v1.5.8), two upstream commits
  beyond the shared v1.5.6 base.
- [complete] Retained the verified `home-route-css` (`[role="main"]`) path,
  personal Jarvis/no-card/Work-style home policy, main-centered shared artwork,
  theme-owned dim, and transparent session-footer fix.
- [complete] Integrated upstream's light/full-mode text contrast, registered
  Safe CSS blur-variable parsing, Windows PowerShell security-module loading,
  and multiline TOML array preservation.
- [complete] Shared runtime sync, focused renderer/Safe CSS/readiness checks,
  all 17 Windows Node tests, the complete applicable macOS suite, Swift build,
  and all 10 XCTest cases pass. Signed installed-runtime integrations and
  Doctor remain explicit skips while Codex is running; PowerShell is not
  installed on this Mac, so Windows-native tests remain CI/Windows-host work.
- [complete] Hot-loaded the merged source and verified the real 1512x949 app:
  home retains one Jarvis heading, no four-card recommendations, the 640px
  bottom composer, and its attached project utility; session expanded /
  collapsed / restored sidebar states report offsets `120px / 0px / 120px`,
  keep the wallpaper centered on the main surface, retain Iron Man's uniform
  `0.28` dim, and expose no native footer gradient below the composer.
  Evidence: `/private/tmp/iron-man-home-utility-transparent.png` and
  `/private/tmp/iron-man-v158-merged-session.png`.

## Personal Release Download Link Fix (2026-07-28)

- [complete] The installed App and managed engine were both confirmed to
  contain the upstream CSS hash `0cc4d642...`, while the custom source and the
  actual `YuxiangChai/Codex-Skin` Release asset contain the personal policy and
  generated CSS hash `92a1022f...`.
- [root cause] The copied Release workflow hard-codes
  `Fei-Away/Codex-Dream-Skin` in its generated download links. The user clicked
  that release-note link and received the upstream DMG even though the personal
  repository's attached asset was correct.
- [complete] Added a regression that first failed on the upstream hard-coded
  URL, then changed generated download links to use `${GITHUB_REPOSITORY}`.
- [complete] Patched the existing personal `v1.5.6` Release notes through the
  GitHub API; all three binary/checksum links now point to
  `YuxiangChai/Codex-Skin`, with no upstream download link remaining.
- [verified] Downloaded the personal DMG through its direct asset URL, matched
  SHA-256 `f3cff722...` against `SHA256SUMS.txt`, mounted it read-only, and
  confirmed the bundled CSS contains the personal policy and hash
  `92a1022f...`. A clearly named verified copy is available locally as
  `~/Downloads/CodexSkin-PERSONAL-v1.5.6.dmg`.
- [verified] Focused fail/pass coverage, Bash syntax, `git diff --check`, and
  the full macOS suite pass, including Swift build and 10 XCTest cases. Signed
  runtime integrations and Doctor remain explicit environment skips. Personal
  repository CI run `30356819698` also passed at fix commit `a950e85`; the
  Release guard completed without rebuilding or replacing `v1.5.6`.
- [pending] The user must quit Codex and replace the old Applications copy with
  the verified personal DMG; re-check the installed/App CSS hash and visible
  home/task result after restart.

## Personal Custom Engine (2026-07-28)

- [complete] Branch `codex/custom-engine` was created from the clean
  upstream baseline `origin/main@611c101`.
- [complete] Added regression coverage for two intentionally minimal UI changes:
  remove Dream Skin brand/status/quote pseudo-content and hide the four native
  home recommendation cards while preserving the composer and project picker.
- [complete] Implemented the policy as an appended override block in canonical
  `runtime/dream-skin.css`; regenerated byte-identical macOS and Windows CSS
  payloads without editing platform copies by hand.
- [verified] The intentional pre-implementation renderer failure was observed.
  Both platform renderer tests, runtime sync check, all Windows portable Node
  tests, Windows payload self-check, and `git diff --check` pass.
- [verified] The full macOS suite passes outside the workspace sandbox,
  including Swift build, 10 XCTest cases, shared runtime tests, Node tests, and
  shell regressions. Signed Codex/ChatGPT runtime integrations and Doctor were
  explicitly skipped; PowerShell is unavailable on this Mac, so Windows native
  PowerShell tests remain for CI or a Windows host.
- [complete] Added `CUSTOM_ENGINE.md` with the upstream merge and personal push
  workflow.
- [complete] Committed the verified custom engine as `e4e5735` and published
  local `codex/custom-engine` as `personal/main` in the independent
  `YuxiangChai/Codex-Skin` repository. The first empty-repository push used the
  documented `[skip ci]` commit marker so the upstream release guard would not
  fail on a missing predecessor; normal CI resumes on subsequent pushes.
- [verified] Personal-repository CI run `30349647148` passed at
  `e267561`. Because the new repository had no existing `v1.5.6` release, its
  copied upstream Release workflow also published `v1.5.6` at that exact commit
  with a DMG, Windows installer, and `SHA256SUMS.txt`; no duplicate or unrelated
  commit was released.

## v1.5.1 Version Release (2026-07-25 08:28 HKT)

- [complete] Created `codex/release-v1.5.1` from the exact synchronized
  `origin/main@3593e8f`. No remote `v1.5.1` tag or GitHub Release existed at
  preflight.
- [complete] Updated the six release version sources to `1.5.1`, the two
  macOS current-version assertions, and the dated macOS/Windows changelog
  headings. The Windows readiness fixture added by #249 also encoded the
  current injected version; its `1.5.0` value initially made the two positive
  readiness cases fail after the bump, so that corresponding assertion now
  reports `1.5.1`. Historical changelog entries and unrelated fixture data
  remain unchanged.
- [verified] Six-source consistency, semantic/unpublished-tag preflight,
  focused macOS update/common version assertions, Bash and Node syntax, both
  injector payload checks, 21 macOS and 11 Windows portable Node regressions,
  and `git diff --check` pass locally. The Windows suite was rerun after the
  fixture correction and passed all 11 tests.
- [complete] Release commit `3289f64` is pushed to
  `codex/release-v1.5.1`; ready PR #250 targets `main` with that exact head.
- [verified] Initial CI run `30136427124` passed Static checks; both Windows
  suites passed their regressions/static checks and macOS passed regressions
  plus its native build before the required durable-progress checkpoint.
- [in progress] Push this progress-only docs commit to PR #250, then require a
  fresh Static checks, Windows PowerShell 5.1, PowerShell 7, and macOS run for
  the new exact head. The superseded CI head is not merge evidence.
- [pending] After merge, verify the automatic Release workflow creates a
  `v1.5.1` tag at the exact merge commit and publishes non-empty DMG, Setup.exe,
  and `SHA256SUMS.txt` assets. No manual package, tag, or Release publication is
  permitted.

## v1.5.1 Installer Preflight Fix (2026-07-25 07:36 HKT)

- [complete] Branch `codex/fix-macos-installer-preflight-v1.5.1` moves
  `discover_codex_app` before the outer running-app guard, so `CODEX_EXE` and
  the exact app bundle are bound before any engine bytes can be deployed.
- [complete] A real outer-installer regression covers the closed-app inner
  failure rollback and a compiled matching app process rejected before deploy;
  it verifies that the prior engine stays intact and no installing, previous or
  broken staging tree remains.
- [verified] Root reran Bash syntax, the focused installer preflight regression,
  `git diff --check`, and the complete macOS CI-parameter suite with signed
  runtime and Doctor integrations explicitly skipped. All applicable checks
  passed; full-Xcode SwiftPM/XCTest remains an environment skip.
- [complete] Fix commit `747c618` was pushed in PR #247. GitHub Actions run
  `30134848593` passed Static checks, both Windows jobs and macOS repository
  regressions; the PR was squash-merged to `main@3aa89d7` after bypassing only
  the impossible same-account self-review requirement.
- [complete] The post-merge Release guard run `30135002941` skipped duplicate
  publication successfully because the version remained 1.5.0. Post-merge CI
  run `30135002980` also passed all four jobs, including DMG and Setup builds.
- [in progress] Public v1.5.0 remains unsuitable for website enablement. ChatGPT
  26.721.41059 currently reaches CDP without a native window; an independent
  worktree is implementing correct post-CDP app activation and fail-closed
  visible-window verification before the separate v1.5.1 version PR.
- [in progress] A Windows parity audit found the same release-blocking class:
  the current verifier can accept hidden or minimized L0/L1 renderers without
  native-window evidence. A separate origin/main worktree owns Windows window
  binding, DOM visibility and non-minimized readiness tests. Both platform fixes
  must merge before the v1.5.1 version bump.
- [complete] macOS readiness commit `1d76a86` plus test-isolation follow-up
  `e7cc38c` passed all four PR CI jobs in run `30135795473`; PR #248 was
  squash-merged to `main@ea5f37f`.
- [complete] Windows readiness commit `fc454cb` passed all four PR CI jobs in
  run `30135894880`, including the new PowerShell 5.1 startup rollback fixture;
  PR #249 was squash-merged to `main@3593e8f`.
- [in progress] Prepare the separate v1.5.1 version-only branch from
  `main@3593e8f`, update all six sources, both assertions and both changelogs,
  then require CI before merge and automatic Release publication.

## v1.5.0 Installed Release Finding (2026-07-25 07:18 HKT)

- [complete] Public v1.5.0 Release/tag/DMG/Setup.exe/SHA256SUMS were independently
  downloaded and verified. The DMG installs and registers `dreamskin`, but a
  real engine upgrade exposed a release P1: the outer installer invokes
  `codex_is_running` before `discover_codex_app`, so its pre-copy running-app
  guard expands undefined `CODEX_EXE` and fails open under `set -u`.
- [complete] The failed real upgrade atomically restored the entire previous
  v1.4.0 engine tree; no mixed tree or installer staging residue remains and the
  original active theme bytes are unchanged.
- [blocked] Current ChatGPT `26.721.41059` opens a loopback CDP target but has no
  native window after launch on this host. The v1.5.0 injector applies its exact
  payload to that target but correctly refuses visible verification, so the
  outer installer rolls back. Do not enable the website for v1.5.0.
- [in progress] Prepare a focused v1.5.1 installer-preflight fix with functional
  regression coverage, then retest a public build and the current renderer
  before enabling the website.

## Final Publication Gate (2026-07-25 06:23 HKT)

- [complete] PR #245 passed all four CI jobs and was squash-merged to client
  `main` as `71f30f0`. The v1.4.0 Release guard completed successfully without
  publishing a duplicate because the feature PR did not change versions.
- [complete] Separate branch `codex/release-v1.5.0` changes only the six version
  sources, two version assertions and the macOS/Windows changelog headings.
  Version consistency, stale-reference scan, all 24 portable Node regressions,
  the CI-mode macOS suite and `git diff --check` pass locally.
- [complete] Version-only commit `3c43752` was pushed and Draft PR #246 targets
  `main`.
- [complete] PR #246 passed all four CI jobs and was squash-merged to client
  `main` as `aad9fc0`.
- [in progress] Automatic Release run `30131800275` is building v1.5.0 from
  that exact main commit. No public v1.5.0 tag/assets, website enablement or
  deployment exists yet.
- [complete] Initial PR #245 CI run `30130742965` exposed three gaps. The
  macOS-only Swift fixture now reports a real Node test skip on non-Darwin
  hosts; the signed package-identity shell integration honors the repository's
  existing CI skip; and Windows runtime fingerprinting recursively
  canonicalizes object keys so active-image renaming cannot change content
  identity.
- [verified] Root reproduced the Windows fingerprint mismatch with portable
  PowerShell, then proved the saved/active hashes are identical after the fix.
  CI-mode macOS regressions, 20 macOS and 4 Windows Node regressions, all
  PowerShell parse/encoding checks and `git diff --check` pass locally. Repair
  commit `3a2c809` is pushed; fresh CI run `30131282832` is the active gate.
- [complete] Feature commit `c44b434` was pushed to
  `codex/one-click-theme-apply`; Draft PR #245 targets `main`. All release
  version sources intentionally remain `1.4.0`.
- [in progress] PR #245 must pass Static checks, Windows PowerShell 5.1,
  PowerShell 7 and macOS repository regressions before it is marked ready or
  merged.
- [complete] The independent final Windows read-only audit reports PASS with no
  P0/P1 findings. `git diff --check` passes. Native PowerShell 5.1, compiled
  Setup.exe protocol registration and a real Windows renderer transaction remain
  required PR CI/Windows-host gates rather than local macOS claims.
- [complete] Root reran all 24 portable macOS/Windows Node regressions and the
  complete macOS repository suite on the final stable tree. Both passed; only
  the documented full-Xcode XCTest and installed-app Doctor branches skipped on
  this Command Line Tools host.
- [complete] Final static checks and an x86_64 native app build passed, including
  strict codesign, exact `dreamskin` URL-scheme registration and packaged helper
  inventory.
- [fact] The public client remains v1.4.0 and the website one-click action remains
  correctly disabled until the automatic v1.5.0 Release is public and verified.

## Root Integrated macOS Recheck (2026-07-25 05:50 HKT)

- [complete] Root independently reran the exact pre-switch community transaction
  regression, private ZIP identity regression, focused bounded-HTTP/import/
  staging Node tests, relevant Bash syntax, plist validation and
  `git diff --check`; all passed on the combined macOS tree.
- [complete] All 13 currently approved production ZIPs were exercised through
  the current strict macOS importer with an isolated temporary HOME. Every one
  failed closed on the missing required `theme.css`, and the isolated saved-theme
  library remained empty. The real user theme library and active renderer were
  not changed by this rejection test.
- [pending] Windows click-time baseline closure, combined cross-platform CI,
  final public Release install and website-button acceptance remain.

## macOS Rollback Pre-Switch Closure (2026-07-25 05:43 HKT)

- [complete] Inside the inherited community operation lock, the macOS
  transaction now snapshots the active theme and runs `injector --verify`
  against that exact snapshot and current CDP port before the first switch.
  The injector therefore checks both the rollback theme ID and computed payload
  revision against the renderer; a mismatch exits before any theme switch.
- [complete] The transaction fixture now records exact renderer-verification
  calls. A state mismatch proves zero verification and zero switches; an
  injected renderer-verification failure proves one verification and zero
  switches. Success, verified rollback and failed rollback cases continue to
  pass under one inherited lock.
- [complete] Rollback retention now distinguishes a snapshot promoted to the
  private `recovery/` tree, a structurally validated snapshot retained in its
  original operation directory when promotion fails, and no confirmed
  snapshot. The App does not delete an in-place fallback, startup stale cleanup
  skips community operations containing such a snapshot, and UI/docs no longer
  promise that retaining a snapshot means recovery succeeded.
- [verified] `macos/tests/community-apply-transaction.test.sh`, focused
  `bash -n`, `git diff --check`, and a standalone Swift recovery-promotion
  failure smoke pass. A direct x86_64 app build with the macOS 14.4 SDK passed at
  `/tmp/CodexDreamSkin-one-click-macos-closure.app`; strict ad-hoc signature,
  exact bundled transaction-script bytes, and the `dreamskin` URL scheme were
  rechecked. The build was not installed.
- [remaining] The owner must rerun the combined macOS suite after all agents
  finish, rebuild the final integrated app, reinstall it, verify bundled engine
  identity, and repeat the installed renderer transaction. Full SwiftPM/XCTest
  remains a CI/full-Xcode gate on this Command Line Tools-only host.

## Windows Transaction Hardening (2026-07-25 05:06 HKT)

- [complete] Community downloads now pass their approved byte count and SHA-256
  into the strict ZIP importer. The importer opens the archive exclusively,
  checks both values on that same FileStream, rewinds it, and extracts from the
  still-open handle. Replacement, truncation and wrong-hash regressions were
  added.
- [complete] Imported and duplicate results now return a stable runtime-content
  fingerprint. One-click apply copies the saved theme into a private transaction
  snapshot, recomputes the exact fingerprint, and refuses to write active files
  unless it still matches.
- [complete] The Windows operation lock now covers the exact active snapshot and
  active-file write. The parent releases it before invoking
  start-dream-skin.ps1, because that script acquires the same lock and only
  exits after exact renderer verification. Failed writes and failed startup
  restore under lock, restart, and verify the previous renderer; a newer manual
  theme choice is detected and never overwritten.
- [complete] Native confirmation metadata rejects Unicode Format, bidi,
  line-separator and paragraph-separator characters. Mocked transaction tests
  cover success, wrong private identity, partial writes, verified rollback,
  rollback file/renderer failure, and concurrent supersession.
- [in progress] Independent PowerShell 5.1/transaction review is running. This
  macOS host has no powershell.exe or pwsh, so executable Windows tests,
  Setup.exe protocol registration, and the real renderer transaction remain
  Windows CI/host gates. git diff --check currently passes.

## Active Scope

- Worktree: `/private/tmp/dreamskin-one-click.36Mjwl`
- Branch: `codex/one-click-theme-apply` based on public v1.4.0/main `277b520`
- Goal: strict `dreamskin://apply?version=ver_...` website-to-client apply for macOS and Windows.
- User primary client worktree was not touched.

## Root Repeated Installed Acceptance (2026-07-25 04:41 HKT)

- Root independently re-imported the three compliant official fixtures through
  the installed strict importer; each returned `duplicate`, validated Safe CSS
  and the expected stable content fingerprint.
- Root switched all three themes live again. Exact renderer verification passed
  each theme ID/revision with visible shell/sidebar/composer/home, zero business
  class pollution and no horizontal overflow. Fresh evidence is under
  `/private/tmp/dreamskin-installed-smoke.iVev9i/`.
- A deliberately wrong imported-content fingerprint exercised the parent
  transaction failure path. It returned exit `20`, reapplied the exact previous
  snapshot and visibly reverified it. Root then reapplied the exact original
  snapshot; `preset-gothic-void-crusade` is active and verified now.
- macOS metadata display validation now explicitly rejects bidi controls and
  line/paragraph separators that could visually spoof the native confirmation.
  Targeted tests and the final rebuild/reinstall remain after this edit.

## macOS Safety Closure

- Implemented fixed-origin bounded HTTP with explicit redirect failure, header/chunked size bounds, cancellation, and exactly-once completion coverage.
- Community ZIP import rechecks approved byte count and SHA-256 on the private no-follow snapshot used for extraction.
- Import publishing returns a runtime content fingerprint; staging calculates the same fingerprint and switching requires an exact match.
- Community apply holds one cross-process transaction lock across exact active-theme snapshot, apply/render verification, and verified rollback. Fresh ownerless locks fail closed; only a dead owner or an ownerless lock at least 10 minutes old is reclaimable.
- The rollback snapshot contains the exact active `theme.json`, referenced image, optional `theme.css`, and content identity even when the active theme is not in `themes/<id>`.
- Hot apply now runs exact injector verification; cold apply already runs `injector --verify` against the active theme before success. Failed community apply re-applies and verifies the exact snapshot; exit 20 means verified recovery, exit 21 means recovery was not verified.
- Quit/menu termination is blocked while network, import, apply, recovery, engine install, or runtime operations are busy. Startup removes only stale private operation directories older than 24 hours and preserves community operation roots that still contain a structurally validated rollback snapshot.
- Native confirmation states that a cold apply may restart ChatGPT and that unsent input should be saved. Menu progress covers metadata, download, import, snapshot/apply, and recovery state.

## Verification

- Root independently reran `CODEX_DREAM_SKIN_SKIP_DOCTOR=1
  macos/tests/run-tests.sh`: PASS, with only the documented full-Xcode
  SwiftPM/XCTest and explicitly skipped Doctor branches omitted.
- Root built and installed `/tmp/CodexDreamSkin-one-click-root.app`, verified
  its ad-hoc signature, `dreamskin` URL scheme, complete runtime inventory,
  and byte-identical deployed engine. The previous 1.3.3 app, engine and user
  state are recoverably backed up at
  `/tmp/dreamskin-before-one-click.g6pClo`.
- The real installed importer added three official four-file fixtures as
  `local-one-click-1/2/3`; all reported `safeCssStatus=validated` and a stable
  content fingerprint without changing the active theme during import.
- The installed switcher applied all three fixtures to the real ChatGPT/Codex
  renderer. Exact `injector --verify` passed each theme ID/revision, Safe CSS,
  visible shell/sidebar/composer/card geometry, matching text colors, zero
  business-class pollution and no document overflow. Screenshots are
  `/tmp/dreamskin-local-one-click-1.png`,
  `/tmp/dreamskin-local-one-click-2.png`, and
  `/tmp/dreamskin-local-one-click-3.png`.
- Root restored `preset-gothic-void-crusade`; its active theme/image are
  byte-identical to the pre-test backup (SHA-256 `8316c6ad...` and
  `b76a7cbe...`), exact renderer verify passes, and deep status reports
  `session=active`, `injectorAlive=true`, `cdpOk=true`.
- LaunchServices delivered malformed and canonical production legacy
  `dreamskin://` links to the installed app as native warning windows. The
  production exact-metadata route currently returns 404, so the legacy link
  failed closed and did not change the active theme. A successful end-to-end
  network apply still requires a deployed compatible package.

- `CODEX_DREAM_SKIN_SKIP_DOCTOR=1 macos/tests/run-tests.sh`: PASS. SwiftPM/XCTest skipped because this Command Line Tools host has no matching full Xcode platform; Doctor intentionally skipped. Signed-runtime switch and runtime-state integration passed.
- Direct Swift x86_64 typecheck with macOS 14.4 SDK: PASS.
- Bounded HTTP redirect/oversize/chunked/cancel/exactly-once fixture: PASS.
- Community import private-snapshot byte/SHA identity fixture: PASS.
- Community transaction success/verified rollback/rollback-failure and inherited-lock fixture: PASS.
- `DREAMSKIN_SDK=/Library/Developer/CommandLineTools/SDKs/MacOSX14.4.sdk DREAMSKIN_ARCHS=x86_64 macos/scripts/build-menubar-app.sh --skip-tests --output /tmp/CodexDreamSkin-one-click-hardened.app`: PASS. Built Mach-O x86_64; packaged runtime helpers and `dreamskin` URL scheme verified.
- `git diff --check`: PASS before final build.

## Remaining Integrated Work

- No commit, push, PR, merge, replacement Release, or deployment has occurred.
  A local development build is installed and fully backed up; public v1.4.0
  still does not contain one-click apply.
- A complete fixed-origin network success smoke still requires a deployed
  approved `applyCompatible: true` package. Existing approved legacy
  production packages are intentionally preview/download-only.
- Real Windows PowerShell 5.1 and Setup.exe protocol install require Windows CI/host verification.

## 2026-07-29 — Codex 26.721.41059 apply verification and native home layout

- Goal: stop the false “Injection verification failed” alert and keep the personal home policy (no brand text / no recommendation cards) while restoring the native bottom composer placement.
- Branch: `codex/custom-engine` tracking `personal/main`.
- Confirmed root cause: the active v1.5.6 payload, theme id, revision, adopted stylesheet, shell, sidebar, composer, viewport and native window all verify. The final check fails only because the selector contract still defines `home-route` as `[role="main"]:has([data-testid="home-icon"])`; Codex 26.721.41059 removed the old `home-icon` while retaining the home-only `[role="main"]` root.
- Current work:
  - [x] Collected live verifier output and relevant launcher/injector logs.
  - [x] Added selector/verifier regression coverage for the new home root.
  - [x] Added personal CSS regression coverage for the native bottom composer placement and the requested `Jarvis at your service` heading.
  - [x] Implemented shared runtime changes and synced macOS/Windows assets.
  - [x] Focused macOS/Windows Node tests, selector doctor, sync check, Swift tests and full macOS regression passed. The first full run hit a transient signed-runtime fixture exit; an immediate traced full rerun passed that fixture and the entire suite.
  - [x] Applied the source payload to the live renderer and captured a visual smoke screenshot: home scope is L1, verification passes, recommendation cards are hidden, composer is at y=787 in a 949px viewport, and the utility bar ends at y=925.
- Live-test note: the current renderer has the fixed source payload temporarily hot-loaded. Persistence across a ChatGPT restart still requires installing this branch's engine while ChatGPT is closed, or packaging this branch in a new app build.
- Safety: no official app bundle, `app.asar`, signature, ACL, user data, or `~/.codex/logs_2.sqlite` is modified.
- Release preparation:
  - [x] Bumped all six platform version sources and bound assertions to `1.5.7`.
  - [x] Full macOS suite passed with its built-in Doctor skip because the terminal test runner hides the active Codex renderer; the same v1.5.7 Doctor passed independently when Codex returned to a verifiable state.
  - [x] Pushed release commit `147ae9f`; CI passed static, macOS, Windows PowerShell 5.1 and PowerShell 7 jobs.
  - [x] Public Release `v1.5.7` published from exact commit `147ae9f` with non-empty `CodexDreamSkin-v1.5.7.dmg` (3,350,075 bytes), `CodexDreamSkin-Setup-v1.5.7.exe` (24,463,567 bytes), and `SHA256SUMS.txt`.
  - [x] Independently downloaded the DMG and matched SHA-256 `20e1dda96b6395a3321d4761e7e817b92bf42847e79ed6dab4805d7b3174dc86`; read-only mount, app code-signature check, bundled engine version `1.5.7`, personal policy marker, and `Jarvis at your service` payload all passed. Windows asset begins with the expected `MZ` executable magic; the Release validation job verified the published asset set and checksums.

## 2026-07-29 — Restore native home composer chrome

- Goal: restore the official Codex home composer surface while retaining the
  personal 640px width and bottom alignment.
- Branch: `codex/custom-engine` tracking `personal/main`.
- Evidence:
  - [x] Compared the skinned and unskinned live Codex 26.721.41059 composer.
    Native geometry is 640x98 with a 614x40 inset utility bar; native chrome
    uses the host radius, elevation, blur and appearance color tokens.
  - [x] Added a personal-policy regression that rejects the themed joined
    panel and requires the native composer/utility tokens without widening the
    composer.
  - [x] Synced the canonical runtime to macOS and Windows; both focused
    renderer tests pass.
  - [x] Hot-loaded the source payload into the live home renderer. Exact
    verification passes, the composer remains x=576/y=787/w=640/h=98 in the
    1512x949 viewport, and the utility bar is inset at x=589/w=614.
  - [x] Captured visual smoke evidence at
    `/tmp/codex-dream-skin-native-composer.png`.
- Safety: the official app bundle, `app.asar`, signature, ACL, user data and
  `~/.codex/logs_2.sqlite` remain untouched.
- Remaining: full regression, version preparation, push, CI and public Release.
- Release preparation:
  - [x] Bumped all six platform version sources and bound assertions to
    `1.5.8`; the version consistency check passes.
  - [x] Portable macOS/Windows Node regressions pass (71 tests).
  - [x] Full macOS regression passes, including Swift package tests; Doctor
    remains intentionally skipped in the suite because it requires the
    installed signed client and was not needed for this CSS-only renderer
    change.
  - [x] Pushed release commit `49665a9`; CI and Release workflows passed.
  - [x] Public Release `v1.5.8` was published from exact commit `49665a9`
    with non-empty DMG (3,350,526 bytes), Windows Setup
    (24,463,409 bytes), and `SHA256SUMS.txt`.
  - [x] Independently downloaded the DMG and matched SHA-256
    `c0319306d927be8506a5c12945d869d79d43bcdc6dfdedcb18f8b30a50d7ec5f`;
    its read-only mount, code signature, bundled `1.5.8` engine and native
    composer policy all passed. The Windows asset begins with the expected
    `MZ` executable magic.

## 2026-07-29 — Unified Chat/Work home and simpler updates

- Goals:
  - show `Jarvis at your service` on both Chat and Work home modes;
  - keep both native composers at their original 640px width and anchor them
    at the bottom;
  - stop requiring a GitHub release for every local CSS iteration;
  - make the menu-bar/tray “Check for updates” action use the personal release
    channel and download the verified installer directly.
- Branch: `codex/custom-engine` tracking `personal/main`.
- Confirmed live DOM:
  - Work home uses `[data-feature="game-source"]`, a 640x98 composer and a
    native utility bar.
  - Chat home has no game-source; it uses a visible `h1.heading-xl`, a 640x44
    pill composer and no utility bar.
  - The existing v1.5.8 bottom-row rule already moves both modes to the bottom
    without setting their width. Only the Chat heading replacement is missing.
- Confirmed persistence/update causes:
  - the source injector hot-load is renderer-session-only; reopening ChatGPT
    lets the installed engine take over again;
  - the installed updater is hard-coded to the upstream repository and only
    opens the GitHub release page.
- Current work:
  - [x] Collected live Chat and Work home geometry/structure.
  - [x] Added dual-home CSS regression and implementation, synced macOS and
    Windows generated assets, and hot-loaded the source payload.
  - [x] Added a source-development apply workflow that does not require a
    release for each iteration.
  - [x] Added bounded, checksum-verified installer download to the personal
    release channel from the existing update menu.
  - [x] Ran the final dual-platform tests, pushed commit `8e3ea9c`, and passed
    the Windows PowerShell 5.1/7 CI gates.
- Live renderer evidence:
  - Chat shows `Jarvis at your service`; the native pill composer is
    x=576/y=881/w=640/h=44 in a 1512x949 viewport.
  - Work shows the same greeting; the native composer is
    x=576/y=787/w=640/h=98 and its utility bar ends at y=925.
  - Screenshots are `/tmp/dream-skin-chat-home.png` and
    `/tmp/dream-skin-work-home.png`.
- Update/development evidence:
  - The real personal v1.5.8 GitHub response resolves the exact 3,350,526-byte
    DMG and SHA-256
    `c0319306d927be8506a5c12945d869d79d43bcdc6dfdedcb18f8b30a50d7ec5f`.
  - An end-to-end v1.5.7-to-v1.5.8 download-only smoke fetched the DMG into the
    private update directory and verified both bytes and SHA-256 without
    opening it.
  - The local development helper safely refuses to install while ChatGPT /
    Codex is running. A persistence smoke must wait until this active task is
    closed so the app can be quit without terminating the conversation.
- Verification so far:
  - Shared asset synchronization check and focused macOS/Windows renderer
    tests pass.
  - Full macOS regression passes outside the enclosing sandbox, including the
    native Swift build and all 10 XCTest cases.
  - Windows updater and installer tests are prepared; this macOS host has no
    `powershell.exe` or `pwsh`; GitHub CI run `30459877021` passed macOS,
    static, Windows PowerShell 7 and Windows PowerShell 5.1 jobs.
- Publication state:
  - Commit `8e3ea9c` is pushed to `personal/main`.
  - No version source changed. The Release workflow completed without
    publishing a new package, and the latest public version remains v1.5.8.
  - The current live renderer has the source payload hot-loaded. Persistent
    local installation still requires closing this ChatGPT / Codex task and
    running `tools/apply-local-development-engine-macos.sh`; doing so during
    this task would terminate the active conversation.
- Safety: no official app bundle, `app.asar`, signature, ACL, user data or
  `~/.codex/logs_2.sqlite` is modified.

## 2026-07-30 — Standalone Codex project-home parity

- Goal: make the standalone Codex project home use the same restrained
  Work-style hierarchy: one centered `Jarvis at your service` heading, the
  native compact composer, and the native project utility bar at the bottom.
- Branch: `codex/custom-engine` tracking `personal/main`.
- Screenshot diagnosis:
  - the project-scoped home renders a native child button inside
    `[data-feature="game-source"]`;
  - the personal heading rule only made the parent text transparent, while an
    earlier accent rule kept the child button visible with `!important`;
  - this leaked the large native “What should we build in …?” title underneath
    the much smaller Jarvis replacement.
- Current work:
  - [x] Reproduced and inspected the current standalone Codex home DOM through
    its local debug endpoint.
  - [x] Added regressions for nested native heading content, the 640px composer,
    utility ordering, and bounded bottom-bar spacing.
  - [x] Hid only the native heading children while preserving their layout
    box and the bottom project selector.
  - [x] Normalized the project home to the 672px native content wrapper
    (640px composer), reordered the project utility underneath the composer,
    and removed its obsolete overhang spacing.
  - [x] Synced macOS/Windows renderer assets and passed the complete macOS
    suite (including 10 Swift tests) plus all 17 Windows Node tests. Windows
    PowerShell tests remain CI-only on this macOS host.
  - [x] Hot-loaded and verified source revision `bee7493d9a2dc5bebb5d` on the
    real 1512x949 standalone Codex home: one centered Jarvis heading, no
    visible cards, composer x=576/y=772/w=640/h=98, and visible project button
    x=596/y=907/w=156/h=28 with no page overflow.
  - [x] Captured final visual evidence at
    `/tmp/codex-project-home-work-style-final.png`.
  - [x] Committed the verified CSS-only change as `53ebe7a` and pushed it to
    `personal/main`; no version or public Release was created for this
    source-development iteration.
  - [x] GitHub CI run `30515511444` passed the macOS, static, Windows
    PowerShell 7, and Windows PowerShell 5.1 matrix; the unchanged-version
    Release workflow exited successfully without publishing.
- Safety: the fix remains renderer CSS only; it does not modify the official
  application bundle, `app.asar`, signature, ACL, user data, or SQLite logs.

## 2026-07-30 — Standalone composer visual parity with Work

- Goal: make the standalone Codex home composer visually match ChatGPT Work:
  fully rounded native surface, no visible outline, native shadow/blur, and a
  compact utility bar tucked directly underneath.
- Branch: `codex/custom-engine` tracking `personal/main`.
- Screenshot differences:
  - standalone Codex currently shows square top corners and a visible outline;
  - its project utility remains a separate labeled panel with a larger gap;
  - Work uses a pill-like 640px composer and a visually attached translucent
    utility strip.
- Current work:
  - [x] Inspected the live computed styles and wrapper geometry. A legacy
    split-card rule with equal/higher specificity was overriding the later
    native reset, leaving the composer at `0 0 22px 22px`, with inset outline
    shadows and a 28px project-label gutter.
  - [x] Added macOS/Windows renderer regressions for the wide standalone
    override, compact translucent utility strip, removed duplicate project
    label, and zero-gap Work-style attachment.
  - [x] Added a project-home-specific late override, synchronized the canonical
    runtime CSS to both platform payloads, and retained all native project,
    environment and branch controls.
  - [x] Hot-loaded the source payload and verified the real 1512x949 home:
    composer x=576/y=803/w=640/h=98, 25px radius, native prominent shadow and
    16px blur; utility x=589/y=901/w=614/h=40, attached exactly at the
    composer's bottom edge, with no generated label or page overflow.
  - [x] Captured visual evidence at
    `/tmp/codex-work-style-composer.png`.
  - [x] Shared asset synchronization, focused macOS/Windows renderer tests,
    all 17 Windows Node tests, `git diff --check`, and the complete macOS suite
    pass. The macOS suite includes Swift build, 10 XCTest cases and all
    applicable shell/Node regressions; signed installed-runtime integrations
    are explicit environment skips.
  - [x] Committed the verified implementation as `3e28ef0` and pushed it to
    `personal/main`. No version source changed and no client Release was
    requested for this source-development iteration.
  - [note] GitHub CLI is not installed on this host, so the remote workflow
    status could not be queried locally; this does not change the completed
    local macOS/Windows verification evidence above.
- Safety: renderer CSS only; native controls and project functionality remain
  intact, and no official application files or user data are modified.

## 2026-07-30 — Main-centered continuous wallpaper and theme-owned dim

- Goal: let one wallpaper continue underneath the resizable sidebar while its
  focal point remains centered on the responsive main surface; remove the
  sidebar/task brightness seam and let each theme own its uniform dim value.
- Branch: `codex/custom-engine` tracking `personal/main`.
- Current work:
  - [x] Added the strict `art.scope: main` + `art.sidebar: shared` theme
    contract across the canonical validator, macOS/Windows injectors, macOS
    image-theme writer/loader, documentation, and synchronized runtime assets.
  - [x] Observe only Codex's sanitized inline sidebar `style.width` (no layout
    reads), shift the single body wallpaper by half that width, and return the
    focal point to the window center when the sidebar is hidden.
  - [x] Diagnosed live that the first coverage rule exposed a body-color strip
    after shifting; the shared canvas now grows enough to cover the sidebar
    edge.
  - [x] Added strict `art.dim` (`0..1`, default `0`) as a theme-owned uniform
    shared-canvas overlay. The engine no longer changes shared-canvas exposure
    between home and task routes.
  - [x] Diagnosed live that the task main surface still carried a legacy
    immersive gradient. Shared mode now clears both that background and the
    task-only `::before` veil while preserving message/composer surfaces.
  - [x] Updated saved and active `custom-iron-man` to theme-owned
    `art.dim: 0.28` (raised from `0.12`) so only this theme receives the
    stronger uniform background dim. Live inspection confirms the body
    renders one `rgba(0,0,0,.28)` overlay while composer/text surfaces remain
    unaffected.
  - [x] Hot-applied and inspected the real 1512x949 task page. Expanded:
    sidebar 240px, wallpaper position `calc(50% + 120px) 42%`; collapsed:
    sidebar 0px, wallpaper position `50% 42%`; restored values match expanded.
    In all three states the body contains one image plus one rgba(0,0,0,.28)
    overlay, main background image is `none`, main `::before` content is
    `none`, and sidebar/resize chrome are transparent.
  - [x] Captured current expanded/collapsed evidence at
    `/private/tmp/iron-man-main-scope-sidebar-expanded.png` and
    `/private/tmp/iron-man-main-scope-sidebar-collapsed.png`.
  - [x] Diagnosed the remaining solid strip below the session composer as
    Codex's two native `bg-gradient-to-t from-token-main-surface-primary`
    footer layers. Main/shared session pages now clear only those gradient
    images, leaving the native composer surface, shadow, blur, layout, and all
    home-page styling intact. Live evidence:
    `/private/tmp/iron-man-session-footer-fixed.png`.
  - [x] Focused renderer, package contract, all 17 Windows Node tests, syntax,
    runtime sync, and whitespace validation pass.
  - [x] Complete macOS regression passes, including shell checks, synchronized
    renderer/Safe CSS/package tests, the native Swift build, and all 10 XCTest
    cases. Signed installed-runtime integrations remain explicit environment
    skips on this source test pass.
- Persistence:
  - The active renderer is hot-loaded from this repository, so the verified
    behavior is live now.
  - The installed managed engine has not yet been replaced. After saving and
    fully closing ChatGPT/Codex, run
    `./tools/apply-local-development-engine-macos.sh` from the repository root
    to persist these engine changes across an ordinary restart/login.
- Safety: no official app bundle, `app.asar`, signature, ACL, user data, or
  SQLite log is modified.

## 2026-07-30 — Theme-owned unified home title

- Goal: let every theme define the home greeting while Chat, Work, and
  standalone Codex use one visual contract: identical text, font metrics and
  a title center aligned to the full available main window.
- Branch: `codex/custom-engine` tracking `personal/main`; upstream v1.5.8 is
  already merged and the worktree was clean at task start.
- Scope:
  - add a bounded, single-line `homeTitle` theme field to the official and
    local theme contracts on both platforms;
  - expose one renderer variable for that title and keep legacy themes
    compatible;
  - replace the two mode-specific inherited heading treatments with shared
    typography and one vertical-centering contract;
  - set the user's saved/active Iron Man theme to
    `Jarvis at your service`;
  - synchronize generated macOS/Windows payload assets and run focused,
    platform and real-UI regressions.
- Current work:
  - [x] Confirmed the present mismatch: standalone Codex renders through
    `[data-feature="game-source"]::before`, while Chat/Work renders through
    `h1.heading-xl::before`; both inherit different native font/layout metrics
    and both hard-code the Jarvis string.
  - [x] Added failing renderer, payload and package-contract regressions;
    confirmed the old engine rejected/dropped `homeTitle` and still depended on
    separate hard-coded native title nodes.
  - [x] Implemented the bounded `homeTitle` contract, renderer variable and one
    root-level title layer. Legacy themes retain `Jarvis at your service`;
    explicit themes can supply any safe single-line value up to 120 code points.
  - [x] Unified the title metrics (`inherit` font family, responsive
    28px–36px size, weight 600, line-height 1.15) and anchored its center to
    `50vh` after compensating for the native app-header offset.
  - [x] Synchronized canonical runtime assets; focused macOS/Windows renderer,
    package and payload-integrity tests pass.
  - [x] Updated the saved and active local Iron Man theme with explicit
    `homeTitle: "Jarvis at your service"` and documented the cross-platform
    field, limit, fallback and unified typography behavior.
  - [x] Real-UI verification on the 1512x949 app:
    - Chat: native `Ready when you are.` heading opacity 0; shared title
      `Jarvis at your service`, top 428.5px, 34.02px/600/39.123px.
    - Work: same shared title, top and font metrics; native game-source title
      absent from the visible screenshot.
    - Codex: same shared title, top and font metrics; native project heading
      opacity 0; 640px bottom composer and project controls remain intact.
    - Expanded and collapsed sidebars retain the same title top/font metrics;
      horizontal centering follows the responsive home root. The app was
      returned to Codex mode with its sidebar expanded after verification.
  - [x] Verified a transient custom value `说吧，想干啥` renders with exactly
    the same typography/position and restored Iron Man immediately afterward.
  - [x] Evidence:
    `/private/tmp/iron-man-chat-unified-title.png`,
    `/private/tmp/iron-man-work-unified-title.png`, and
    `/private/tmp/iron-man-unified-home-title.png`.
  - [x] All 75 cross-platform Node tests pass. The complete macOS suite passes
    outside the restricted SwiftPM sandbox, including Swift build, 10 XCTest
    cases, shell/static/runtime/package/import/security regressions. Canonical
    asset sync, Node/shell syntax and `git diff --check` also pass.
  - [note] Windows PowerShell-native tests remain CI-only on this macOS host;
    both Windows renderer/payload/package Node paths passed locally.
- Safety: this remains external renderer/theme data. Do not modify the
  official app bundle, `app.asar`, signing state, ACL, user data or logs.

## 2026-07-30 — Personal v1.5.9 single-theme release

- Goal: publish the merged upstream v1.5.9 engine while preserving the custom
  home layout/title and shipping only the user-approved Iron Man theme.
- Branch/remotes: `codex/custom-engine`; upstream is `origin/main`, personal
  release target is `personal/main`.
- Release scope:
  - [decision] after both Windows PowerShell CI jobs failed, the user explicitly
    narrowed this personal release to macOS only; Windows source remains in the
    repository, but Windows native CI and Setup.exe publication are no longer
    release gates;
  - [x] merged upstream v1.5.9 into the custom engine without losing the
    main-content-centered wallpaper or unified home layout;
  - [x] removed retired bundled preset directories and references from public
    package documentation;
  - [x] added one complete macOS/Windows `preset-iron-man` pack with non-empty
    `theme.json`, `theme.css`, and `background.jpg`;
  - [x] set dark appearance, shared sidebar canvas, main-content focus,
    `homeTitle: "Jarvis at your service"`, and theme-owned `dim: 0.4`;
  - [x] pinned the AI-generated wallpaper's dimensions and SHA-256 in both
    platform builders; user explicitly confirmed it may be distributed with
    this personal release;
  - [x] added macOS `.disable-bundled-presets` support and kept the user's local
    theme library at one Iron Man entry;
  - [x] complete local source, native macOS, and package validation: 76
    cross-platform Node tests pass; synchronized payload checks pass; the full
    macOS suite passes with 10 XCTest cases; and the universal v1.5.9 DMG
    mounts read-only with a valid ad-hoc signature and exactly one complete
    Iron Man preset;
  - [note] Windows renderer, metadata, payload, package-contract, and static
    source assertions remain portable checks, but this personal workflow does
    not run Windows-native jobs or publish Setup.exe;
  - [x] repository CI passed after the macOS-only workflow change: static
    checks and macOS repository regressions both completed successfully in run
    `30551535997`;
  - [x] commit the single-theme release implementation on
    `codex/custom-engine`;
  - [x] pushed the release implementation to `personal/main`;
  - [x] pushed the macOS-only workflow follow-up as `16e767c`;
  - [x] release run `30551539137` completed successfully and published public
    v1.5.9 from tag commit `52e9677`;
  - [x] public assets verified by the release job and GitHub metadata:
    `CodexDreamSkin-v1.5.9.dmg` (2,965,758 bytes,
    SHA-256 `89534b5587cdf70c615925c12a769c8cd8885b7928512870df5b13455aa433cc`)
    and `SHA256SUMS.txt` (92 bytes). The Release is non-draft,
    non-prerelease, and available to the personal updater.
- Version: all six required version sources are expected to remain at v1.5.9;
  do not create or reuse a different tag without re-running consistency checks.
- Safety: no official Codex/ChatGPT bundle, signature, protected path, ACL,
  user database, or logs are modified.
