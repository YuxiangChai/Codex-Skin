# Task Progress

Updated: 2026-08-31 (Asia/Shanghai)

## Publish Personal macOS v1.5.16.2 (2026-08-31)

- [authorized] The user explicitly requested a commit and a new public release
  after the native long-text pasted-attachment recovery was verified.
- [scope] Publish macOS-only `v1.5.16.2`, preserving the completion-flash fix
  and native pasted-text card behavior. Synchronize required shared Windows
  version/runtime sources but do not build or upload a Windows Setup.exe.
- [baseline] Refreshed both remotes. `personal/main` remains at published
  `v1.5.16.1`; refreshed `origin/main` is already an ancestor of the candidate.
  Current `HEAD` is `beb541f`, four commits ahead of `personal/main`, and remote
  tag `v1.5.16.2` is absent.
- [ready] All six version sources and bound assertions equal `1.5.16.2`.
  Shared assets are synchronized. Passed macOS portable Node (92), shared
  Windows Node (29), tools (10), Swift/XCTest (15), the full protected macOS
  suite, both payload checks, release-workflow checks and `git diff --check`.
- [ready] Built and read-only mounted
  `macos/release/CodexDreamSkin-v1.5.16.2.dmg`. `hdiutil verify` and deep
  codesign verification pass; App and bundled engine versions are `1.5.16.2`,
  the binary contains x86_64 + arm64, exactly one Iron Man preset is present,
  and both the native pasted-text recovery and completion-flash fix are in the
  packaged assets. Local SHA-256 is
  `ac9ef213439f86718c299f0435acb6ddb2d2cfca61dda08e70190717f35d6c6f`.
- [published] Created release commit
  `a3efc03999b4bd34c346a9c0ba21c1f1876a5acd` and fast-forwarded
  `personal/main`. CI run `33382478670` and Release run `33382478675` both
  completed successfully. Tag `v1.5.16.2` points at that exact immutable
  release commit; `personal/main` subsequently advanced only through
  documentation-only publication records with the version unchanged.
- [verified] Public Release
  `https://github.com/YuxiangChai/Codex-Skin/releases/tag/v1.5.16.2` is the
  non-draft, non-prerelease Latest release. Its complete custom asset set is
  `CodexDreamSkin-v1.5.16.2.dmg` (3,129,298 bytes) plus
  `SHA256SUMS.txt` (95 bytes); no Windows Setup.exe exists.
- [verified] Independently downloaded both public assets. The checksum file and
  local `shasum` agree on
  `00bfd510a58ccfb00fca95bf0698a05bd7d86036d63c5c779c6762b61ba99ad3`;
  `hdiutil verify` passes. A read-only mount confirms App and engine version
  `1.5.16.2`, x86_64 + arm64, one Iron Man preset, both requested fixes, and
  the expected ad-hoc signature (`TeamIdentifier=not set`).
- [completed] The macOS-only `v1.5.16.2` publication is complete. No public tag
  or Release was replaced and no Windows installer was built or uploaded.

## Native Long-text Pasted Attachment Recovery (2026-08-31)

- [goal] Preserve Codex 26.825's native compact `Pasted text` attachment card
  for long clipboard text while preventing its `Adding pasted text...` state
  from remaining pending forever.
- [scope] Repair the official attachment pipeline only. Do not insert long
  clipboard contents into the ProseMirror composer, fabricate a visual card,
  read/log pasted contents, patch `app.asar`, publish, or build a Windows
  installer. Keep the completion-flash fix at `ce8da57`.
- [correction] The earlier direct-composer workaround was the wrong UX and was
  reverted in `74598e5`; its live listener was also removed. The native card
  behavior is now the acceptance contract.
- [root_cause] Codex 26.825 starts
  `cleanupPendingPastedTextAttachments()` before the local app-server bridge is
  reliably ready. Its initial attachment-registry `fs/readFile` request can
  lose its response, has `timeoutMs=0`, and remains cached forever in
  `pastedTextAttachments.state`. Every later long paste creates the native
  pending card and then waits on that same Promise, so no attachment directory
  or text file is written and the card never calls its official success path.
- [evidence] The current local manager contains one startup-era attachment
  registry read pending for hours. A separate bounded read of the same registry
  completed in 47 ms and returned valid metadata, proving the filesystem,
  registry and current app-server are healthy. Live transport tracing confirmed
  that a reproduced paste emits no new filesystem request because it is blocked
  on the cached startup Promise.
- [implemented] Added a version- and structure-gated, one-shot recovery that
  retries only the unique stale local registry read, validates its bounded
  metadata, and resolves the original official request through the request
  client's own result path. Normal, remote, cloud, ambiguous, invalid and
  failed states remain untouched. The runtime neither listens for paste events
  nor reads/inserts the clipboard body, and it does not fabricate attachment UI.
- [validated] Hot-applied the exact renderer payload to the running Codex and
  dispatched a generated long-text paste. The official compact attachment card
  completed, `Adding pasted text...` disappeared, the ProseMirror editor stayed
  empty, and the card's native remove control worked. The stale request was
  recovered with one bounded retry; the generated test registry entry and its
  uniquely timestamped orphan test directory were removed afterward.
- [tests] Passed shared-asset sync, renderer syntax/runtime and early-injection
  tests on both platform payloads, 39 portable tool/Windows Node tests, and the
  macOS suite including 15 Swift/XCTest cases. Signed-runtime switching,
  runtime-state integration and Doctor were intentionally skipped to avoid
  changing the currently running signed Codex; no Windows installer was built.

## Agent Completion Top-left Flash (2026-08-31)

- [goal] Reproduce and remove the very brief light/white flash near the main
  page's upper-left corner when an agent finishes replying in a Session.
- [scope] Preserve the published Iron Man canvas, Settings, Chat/Work/Codex
  states, composer and message surfaces. Diagnose the transient completion
  node/state before changing CSS; do not hide unrelated notifications or
  weaken verification.
- [baseline] Start from clean published-state commit `4c65139` on new branch
  `codex/fix-completion-flash`; public `v1.5.16.1` remains untouched.
- [diagnosis] Live CDP capture on Codex 26.825 ruled out Sonner toast, pinned
  summary, and the main top fade. At finalization the response is reparented
  into `data-local-conversation-final-assistant`, the reverse-thread virtual
  list corrects its geometry by about 246px within two animation frames, and
  the streaming reasoning surface simultaneously drops its `backdrop-filter`
  compositor layer. No light-colored DOM surface was inserted; the flash is
  compositor churn from destroying the transient blur layer during the scroll
  correction.
- [implemented] Keep the streaming reasoning glass fill, gradient, border,
  shadow, and inset highlight, but force `backdrop-filter: none`. Added a
  regression assertion that rejects a blur filter on this transient selector.
- [validated] Synchronized the canonical CSS into both platform payloads and
  hot-applied the exact rule to the currently running Codex renderer (one
  matching rule changed from blur to none). Passed renderer tests for macOS
  and Windows assets, shared-asset sync, `git diff --check`, the macOS suite
  with signed-runtime/duplicate-Doctor probes skipped to avoid changing the
  running app, and a separate live Doctor (`pass: true`, official signature
  valid). The first unskipped suite reached only the signed runtime switch
  integration before exiting without an assertion; no CSS or renderer test
  failed.
- [remaining_live_check] A post-fix natural agent-completion frame has not yet
  occurred in the active Session. The running renderer already has the hot
  patch, so the user's next completed response can verify the visual symptom
  without restarting Codex.

## Publish Personal macOS v1.5.16.1 (2026-08-31)

- [authorized] The user explicitly requested publication after reviewing the
  live composer, Settings and message-surface fixes.
- [scope] Publish the personal repository's macOS-only `v1.5.16.1` release.
  Preserve the existing release workflow and all personal features; do not
  build or upload a Windows Setup.exe.
- [baseline] `personal/main` is `df48f18` at version `1.5.14.1`. The release
  candidate is local commit `3d5708b` on `codex/merge-origin-v1.5.16`, eleven
  commits ahead and with both `personal/main` and refreshed `origin/main` as
  ancestors. Remote tag `v1.5.16.1` is absent.
- [ready] All six version sources equal `1.5.16.1`; generated assets are in
  sync; macOS Node (92), shared Windows Node (29), tools (10), Swift/XCTest
  (15), full macOS integrations, local DMG mount verification and detached
  SHA-256 verification pass.
- [ready] Final local DMG SHA-256 is
  `81ad33ef349d3ccd310dcba2ecd053fb8e80cabcbd9de9d7b09da6d519a3592c`.
- [published] Fast-forwarded `personal/main` to release commit `9ab8978` and
  completed Release workflow run `33372218577`: guard, portable regressions,
  tag creation, macOS DMG build and public Release publication all succeeded.
  Tag `v1.5.16.1` points at the exact release commit.
- [verified] The public Release is non-draft, non-prerelease and marked Latest:
  `https://github.com/YuxiangChai/Codex-Skin/releases/tag/v1.5.16.1`.
  Its only custom assets are `CodexDreamSkin-v1.5.16.1.dmg` (2.98 MB) and
  `SHA256SUMS.txt` (95 bytes); no Windows Setup.exe was built or uploaded.
- [verified] Independently downloaded the public assets. The checksum file,
  GitHub asset digest and local `shasum` all agree on
  `06d25b84a8c4288767cdda8f0cf755547213f43bc9882539dcc3c36d2b68359f`,
  and `hdiutil verify` passes. A read-only mount confirms app/engine version
  `1.5.16.1`, x86_64 + arm64, one Iron Man preset and the final composer/steer
  runtime markers. The published package is explicitly ad-hoc signed.
- [completed] Publication is complete. No tag or public Release was replaced,
  and no Windows installer was created.

## ChatGPT Chat / Work Composer Transition Flash (2026-08-31)

- [goal] Remove the transient frame where switching between Chat and Work
  shows the home composer near the horizontal center before it snaps to the
  intended bottom position.
- [scope] Preserve the final Chat / Work / Codex home layout, native controls,
  Iron Man visuals and shared renderer contract. Change only the initial home
  composer positioning path, synchronize generated assets, and validate on
  macOS; do not publish or build a Windows installer.
- [baseline] Work begins from clean local merge commit `58790c6` on
  `codex/merge-origin-v1.5.16`; the currently merged personal version is
  `1.5.16.1` and no push, tag or public Release has been performed.
- [root_cause] Live frame sampling reproduced the flash: a replacement
  ChatGPT composer first appeared at `y=466.7` without `data-ds-part`, then the
  debounced part pass annotated it roughly 80 ms later and the personal CSS
  moved it to `y=881`. The bottom-row rule incorrectly depended on that
  asynchronous public-part annotation even though the native
  `_ComposerLayoutRoot_` selector was already present in the first frame.
- [additional_bug] The merged Codex 26.825 project home now places its utility
  rail and composer in the same wrapper, with the rail first. The older rule
  moved the combined wrapper but could no longer put the rail below the
  composer; the rail's native `_attached_` top radius then produced the
  detached upper card and incorrect corner arc shown in the user screenshots.
- [additional_bug] Codex 26.825 paints both `_ComposerLayoutRoot_` and its
  direct `_ComposerLayoutBody_` child. The personal theme kept both paints in
  Sessions, producing two concentric corner arcs. New Chat also removed the
  outer border and relied on an elevation outline, leaving its top edge and
  corner continuity visually incomplete.
- [additional_bug] Normal committed user messages have a semantic user anchor,
  but a live steer submitted during an active turn can expose only the exact
  native `data-user-message-bubble` marker. The old bounded-part pass required
  the missing anchor, so steer bubbles kept the host's neutral/transparent
  surface instead of the theme-owned user-message color.
- [implemented] Home-row positioning now matches the synchronous native
  composer selector while visual surface styling still requires the single
  public composer part. Standalone Codex project homes make the shared wrapper
  a deterministic column, order the composer before the utility rail, and
  retain only the rail's lower corner radii.
- [implemented] The public ComposerLayoutRoot is now the only visual surface:
  its direct Body is transparent, borderless, radius-free and shadow-free in
  both Home and Session. New Chat uses one real 1 px outer border, one 25 px
  radius and one drop shadow; the Iron Man preset no longer erases that border.
- [implemented] Every explicit native user-message bubble is now a bounded
  `message-user` surface, including anchorless live steer bubbles. Both normal
  and steer messages share the existing theme color plus a translucent
  highlight gradient, accent border, 18 px backdrop blur and one soft shadow.
- [verified] Targeted renderer regression and generated-asset sync/check pass.
  Live candidate revision `87054da570d7e92ceb50` verifies L1 home structure,
  no overflow and the 640 px Codex composer. Screenshot evidence is
  `/private/tmp/codex-project-home-fixed.png`.
- [verified] Trusted real-renderer switching has no intermediate centered
  frame: Chat -> Work first replacement frame is already at `y=787` before
  public-part annotation; Work -> Chat first replacement frame is already at
  `y=881`. The later annotation changes no geometry.
- [verified] Live Codex 26.825 computed styles confirm New Chat Root is
  `border: 1px solid`, `border-radius: 25px`, while its Body is transparent,
  shadow-free and `border-radius: 0`. Session keeps one 22 px Root and likewise
  clears the direct Body (`transparent`, `none`, `0px`), removing the second
  arc. Screenshots are `/private/tmp/codex-composer-final.png` and
  `/private/tmp/codex-session-final-2.png`.
- [verified] Live normal and steer bubbles both resolve to
  `background: rgba(100, 230, 255, 0.12)`, a 22% accent border, 18 px blur and
  identical shadow/radius values. Visual evidence is
  `/private/tmp/user-message-glass-final.png`.
- [verified] Final suites pass: 92 macOS Node tests, 29 shared Windows Node
  tests, 10 tools tests, 15 Swift/XCTest cases, and the complete macOS shell,
  theme, package, signed-runtime, runtime-state and Doctor integrations.
- [verified] Rebuilt the local universal macOS DMG after updating the reviewed
  Iron Man preset CSS hash. `hdiutil verify` and the detached checksum pass for
  `macos/release/CodexDreamSkin-v1.5.16.1.dmg`; SHA-256 is
  `81ad33ef349d3ccd310dcba2ecd053fb8e80cabcbd9de9d7b09da6d519a3592c`.
- [completed] Reviewed the scoped diff and created the local fix commit. No
  Windows Setup.exe was built, and nothing was pushed, tagged or published.

## Origin v1.5.16 Integration With Personal macOS Features (2026-08-31)

- [goal] Merge refreshed `origin/main` `e0341de` into the personal engine while
  preserving the Iron Man theme, Chat / Work / Codex home states and layout,
  main-area artwork focus, Settings main-surface transparency, composer fixes,
  Safe CSS boundaries, and the assisted macOS updater / rollback / theme
  restoration flow.
- [scope] Integrate and validate macOS behavior. Keep shared runtime and
  generated Windows assets coherent, but do not build or publish a Windows
  Setup.exe and do not spend this task on Windows release packaging. No push or
  public Release is implied by the merge request.
- [baseline] `codex/custom-engine` is at `df48f18`, synchronized with
  `personal/main`, and is 57 commits ahead / 8 commits behind `origin/main`.
  The worktree contains the completed, tested Codex 26.825 Settings
  transparency repair and no interrupted Git operation.
- [upstream] The merge range contains released v1.5.15 / v1.5.16 Codex
  26.814-26.818 compatibility plus unreleased watcher backoff, update-version
  source, selector provenance, Windows overflow and managed-CDP-profile fixes,
  and documentation.
- [branch] Created `codex/merge-origin-v1.5.16` from `df48f18` and protected the
  completed Settings repair in commit `f5ce691` before starting the merge.
- [merged] `git merge --no-ff --no-commit origin/main` is resolved as a feature
  union. Accepted upstream Codex 26.818 composer / Pet / Markdown / message
  compatibility, Safe CSS composer-border bridge, watcher backoff, bundled-App
  update-version source and selector provenance. Preserved personal Chat / Work
  / Codex home policy, Jarvis title, main-centered shared artwork and sidebar
  geometry, bounded Settings transparency, pinned-summary policy, user-bubble
  tint, Iron Man-only package and guided macOS updater / rollback / restart /
  theme restoration.
- [release_scope] Kept the personal macOS-only Release workflow and did not add
  the upstream Windows Setup.exe CI/release job. Shared runtime and generated
  Windows assets remain synchronized and covered by portable Node tests.
- [version] Selected personal integration version `1.5.16.1`, rather than the
  already-existing upstream tag `v1.5.16`, and synchronized the six platform
  version sources plus bound assertions. No tag, push or Release is authorized
  or performed in this task.
- [verified] Generated-asset sync/check, selector provenance, selector Doctor
  unit tests, macOS and Windows renderer tests, both payload-integrity suites,
  watcher backoff, bundled update-version source, Safe CSS and composer-fade
  tests pass. The personal tests explicitly cover three home modes, shared
  artwork geometry, Settings 26.727 + 26.825 bounded transparency, adaptive
  user bubbles, Pet exclusion and composer border restoration.
- [verified] Final portable suites pass: 92 macOS Node tests, 29 Windows shared
  / Node tests and 10 tools tests. The complete macOS suite passes with 15
  Swift/XCTest cases plus shell, renderer, Safe CSS, theme staging/import,
  manifest, ZIP, HTTP and updater safety checks. The final elevated packaging
  run also passes signed-runtime switching, runtime-state integration and
  Doctor checks.
- [verified] The final v1.5.16.1 candidate hot-applies to the current visible
  thread with active `custom-iron-man`, L1 structure, no horizontal overflow,
  no missing L1 anchors and revision `2002d9f05b3571e6b655`. Static/runtime
  fixtures cover Chat / Work / Codex home, Settings and Pet-specific states;
  direct live navigation through every route remains a post-install smoke test.
- [artifact] Built and mounted the local universal macOS DMG at
  `macos/release/CodexDreamSkin-v1.5.16.1.dmg`. It contains arm64 + x86_64,
  exactly the Iron Man three-file public preset, matching App/engine versions
  and required runtime scripts. Independent SHA-256 and `hdiutil verify` pass;
  digest is `dcccae4a7c5f2d399bb97fe87a9689387d230e6a6299b2d523a39867b8920cc9`.
- [complete] Final staged-diff, version, generated-asset and ancestry checks
  are complete; this integration is recorded in the local merge commit. No
  push, tag or public Release was performed.

## Codex 26.825 Settings Main Background Repair (2026-08-31)

- [goal] Restore the active theme background on the newly updated Codex
  Settings main content while leaving the already-correct Settings sidebar and
  every non-Settings native surface unchanged.
- [scope] Update the shared selector contract, generated macOS/Windows runtime
  assets and regression assertions. Do not modify the signed official Codex
  App, restart it, change the selected theme, bump a version or publish.
- [baseline] Working tree is clean on `codex/custom-engine` at `df48f18`, aligned
  with `personal/main`; the latest personal release commit is `v1.5.14.1` at
  `cc50ae0`.
- [complete] Diagnosis, bounded compatibility implementation, generated asset
  synchronization, current-renderer hot application and applicable regression
  testing are complete.
- [evidence] The installed official App is `26.825.51511` build `7377`; the
  installed Dream Skin engine is active and verified at `1.5.14.1`, and its
  renderer/selectors/generated CSS match this repository's released payload.
  A sanitized live capture confirms the main renderer still has the Iron Man
  payload and normal thread anchors, so this is not a stopped injector or lost
  active-theme state.
- [root_cause] The personal Settings transparency contract is still tied to
  the Codex 26.727 content class/path
  `.electron\\:bg-token-main-surface-primary`. Read-only inspection of the
  26.825 renderer bundle shows that exact class no longer exists; the current
  non-embedded Settings detail wrapper uses
  `electron:bg-surface electron:elevation-prominent`, whose native CSS paints
  `var(--color-surface)`. The old bounded selector therefore misses and the
  opaque native dark surface covers the body artwork that remains underneath.
- [diagnostic_gap] Selector doctor currently chooses the first `app://` page,
  which can be the `/avatar-overlay` auxiliary target. Its no-shell fallback
  then misclassifies that target as Settings; because every Settings probe is
  optional L2 and Settings has no required L1 probes, four misses still return
  `pass: true`. This is a doctor false positive, not live Settings evidence.
- [test_gap] Existing renderer tests assert that the old selector text is
  present and that a mocked Settings scope installs a stylesheet, but do not
  exercise a real Settings hierarchy or computed transparency. Payload tests
  only validate substitution/syntax, and verifier checks a visible Settings
  anchor rather than the content surface's computed background.
- [implemented] `settings-surface` now retains the 26.727 direct-child path and
  adds the 26.825 `electron:bg-surface` + `electron:elevation-prominent` path.
  Both alternatives remain anchored beneath the sibling of the confirmed
  Settings sidebar; the rule clears only background and box-shadow. A negative
  assertion prevents this repair from becoming a global native-surface rule.
- [generated] `node tools/sync-runtime-assets.mjs` synchronized selectors,
  compiled CSS and renderer payloads to both `macos/assets` and
  `windows/assets`; `--check` confirms there is no generated drift.
- [upstream] Remote `origin/main` is now `e0341de` and includes the Codex
  26.818 / v1.5.16 compatibility work, but its current selector contract has no
  personal `settings-surface` transparency selector. Merging upstream alone
  will not repair this exact personal Settings background regression.
- [verified] Selector-doctor tests, macOS and Windows renderer tests, both
  payload integrity suites, `git diff --check`, and the full applicable macOS
  suite pass. The full run includes 15 Swift/XCTest cases plus shell, CSS,
  renderer, Safe CSS, staging, manifest, ZIP and HTTP boundary tests. Signed
  runtime integrations and Doctor were intentionally skipped because this task
  must not restart or mutate the official signed App; Windows PowerShell remains
  for CI/on-platform validation.
- [live] The candidate payload was hot-applied through the running renderer's
  supported injector and passed visible verification with active theme
  `custom-iron-man` at revision `bba760253d0cb64e8fff`. The user must reopen
  Settings in the same app session for direct visual confirmation; the repo fix
  has not replaced the installed engine on disk because its atomic installer
  correctly requires Codex to be closed.

## Upstream v1.5.14 Integration And Personal v1.5.14.1 Release (2026-08-14)

- [goal] Merge the upstream v1.5.12-v1.5.14 feature/security set, retain the
  personal Iron Man theme/layout and assisted self-update behavior, include the
  Codex 26.810 composer-fade repair, then publish macOS personal v1.5.14.1.
- [upstream] `origin/main` advanced from integrated `0a727a5` to `95423d8`
  (v1.5.14), 19 commits covering bilingual clients, macOS background update
  notifications/menu organization, renderer visibility validation, bounded
  image inspection, theme schema/manifest hardening and Windows cold-start /
  failed-start recovery.
- [complete] Resolved the upstream merge as a feature union: localized menus
  and background update discovery now feed the personal download-progress,
  checksum verification, atomic install, rollback, Codex restart and
  active-theme restoration flow. The update menu item and notification both
  enter the assisted installer instead of opening the upstream release page.
- [verified] All six version sources and bound assertions are synchronized at
  `1.5.14.1`; no unresolved merge entries or conflict markers remain, and the
  staged diff contains no secrets or personal paths. The Iron Man-only preset
  pack, `.disable-bundled-presets` support and README credit are preserved.
- [verified] Runtime asset sync, selector doctor, both platform payload checks
  and all 110 portable Node tests pass. The complete macOS suite passes outside
  the restricted sandbox, including 15 Swift tests, localization/update
  contracts, Safe CSS, ZIP/import and updater safety checks. Signed-runtime
  switching/state and Doctor were skipped locally to preserve the live Codex
  session; CI reruns the full gate on the pushed `main`.
- [released] Merge commit `cc50ae064c248c8789376577c7b7a8b54a00bc85` was pushed
  to `personal/main`. CI run `31810574603` and Release run `31810574598` both
  completed successfully; the public tag `v1.5.14.1` points exactly to the
  release commit.
- [verified] Public Release
  https://github.com/YuxiangChai/Codex-Skin/releases/tag/v1.5.14.1 is
  non-draft and non-prerelease with exactly the macOS DMG plus `SHA256SUMS.txt`.
  A clean single-pass download of the 3,117,898-byte DMG matches both the
  published checksum and GitHub asset digest (SHA-256
  `5726fa98694711500147399654fc027a6c1a8d632e5c285e922ee34b6c949034`), and
  `hdiutil verify` reports the image checksum as valid.
- [complete] v1.5.14.1 is publicly downloadable.

## Cross-Mac Consistency And Composer Shadow Repair (2026-08-14)

- [goal] Explain why the same saved theme can render differently on another
  Mac, inspect the newly updated local Codex renderer, and remove the new
  shadow/underlay below the composer without changing the official App bundle.
- [scope] Keep the repair in the shared runtime and synchronize generated
  macOS/Windows payloads. Preserve the Iron Man artwork focus, unified home
  title and compact composer. Do not restart Codex or publish a version unless
  the user explicitly asks.
- [root_cause] Local Codex/ChatGPT is 26.810.41047 (build 6570) with engine
  v1.5.11.5. The sticky session footer renamed its two gradient stops from
  `from-token-main-surface-primary` to `from-surface` / `via-surface`; the old
  compatibility rule therefore missed a 148px native fade below the composer.
  The other Mac difference was an older installed engine, as the user later
  confirmed, rather than a separate theme-layout defect.
- [implemented] Added a session-footer-scoped, hash-free selector for the new
  `from-surface` class while retaining the legacy token selector. Synchronized
  the canonical CSS into both macOS and Windows payloads and added assertions
  for both generations.
- [verified] Hot-applied the candidate payload to the open renderer without a
  restart. Both live fade nodes remain structurally present but compute to
  transparent `background` and `background-image: none`; the composer stays at
  736x100 and the active `custom-iron-man` theme remains applied.
- [verified] Runtime asset sync, both platform payload checks, all 19 portable
  Windows Node tests, the full macOS source suite and 13 Swift tests pass.
  Signed-runtime switching/state tests and Doctor were intentionally skipped
  to avoid changing the current installed engine/session. No version was
  bumped, no commit was created and no Release was published.
- [authorized] The user requested an upstream comparison/merge when available,
  followed by a new public personal release. Commit this verified repair first,
  then fetch and integrate origin without losing the personal theme/layout
  behavior; do not restart the currently open Codex during release work.

## Personal v1.5.11.5 Release (2026-08-07)

- [goal] Publish the verified macOS self-update restart and active-skin restore
  repair as personal release `v1.5.11.5`.
- [baseline] `origin/main` remains at already-integrated `0a727a5`; no upstream
  merge is required. Public personal latest is `v1.5.11.4`, and both the remote
  `v1.5.11.5` tag and Release are absent.
- [authorized] The user explicitly requested a new public release. Synchronize
  all six version sources and bound assertions, rerun the full release gate,
  build and mount-check the macOS DMG, then push the exact candidate and verify
  CI, tag, public Release, assets and checksums.
- [verified] All six release version sources and their bound assertions are
  synchronized at `1.5.11.5`. All 19 portable Windows Node tests and both
  platform payload checks pass.
- [verified] The complete macOS suite passes without skips after hot-applying
  the candidate payload to the current renderer, including 13 Swift tests,
  signed theme switching, runtime-state integration and live Doctor against
  Codex 26.803.41515 with `custom-iron-man` active.
- [verified] The local universal arm64+x86_64 DMG passed the build script's
  read-only mount contract and an independent `hdiutil imageinfo` check.
  `CodexDreamSkin-v1.5.11.5.dmg` is 3,044,108 bytes with SHA-256
  `7c3e00ca684990973383108e975ad76c112c53c4371a02080ed6528bd6a9ca34`.
- [released] Candidate `3466927a0c5b76acf6d3f824a9001bb08f6d3067`
  was fast-forward pushed to `personal/main`. CI run `31147682793` and Release
  run `31147682796` completed successfully; public tag `v1.5.11.5` points
  exactly to the candidate commit.
- [verified] Public Release `366522542` is non-draft and non-prerelease with
  exactly the expected macOS DMG and `SHA256SUMS.txt`. A clean single-pass
  download of the 3,043,359-byte public DMG matches both the published checksum
  and GitHub asset digest: SHA-256
  `44ed110923826754e2b97387cdd3ade060033c468fbd02bbdfa5673a1fa65503`;
  independent `hdiutil imageinfo` validation also passes.
- [complete] `v1.5.11.5` is publicly downloadable. The local and CI DMG bytes
  differ as expected for independent ad-hoc builds, while both passed the same
  mounted package contract.
- [follow-up] Corrected the generated ad-hoc release guidance for subsequent
  versions: assisted updates relaunch the replacement App and restore Codex;
  Privacy & Security is documented only as a fallback when macOS blocks that
  launch. The already-published v1.5.11.5 binaries, tag and checksums are
  unchanged.

## Self-Update Restart And Skin Restore Repair (2026-08-07)

- [goal] Simplify the macOS self-update path so a normal ad-hoc update relaunches
  the replacement App directly, then opens Codex and visibly reapplies the
  active theme without requiring the user to reopen either app or click Apply.
  Privacy & Security should remain a fallback only when macOS actually blocks
  the replacement, never an eager step on the normal path.
- [upstream] Fetched `origin/main`; it remains at `0a727a5`, which was already
  merged by `6dbd590`. The current branch is 50 commits ahead and zero behind,
  so there is no upstream engine, version or documentation update to merge.
- [evidence] The installed App and engine are both v1.5.11.4 and the current
  Codex 26.803.41515 renderer is verified active with `custom-iron-man`. The
  v1.5.11.2 self-update log records a launch without additional approval, while
  v1.5.11.4 incorrectly reported “waiting for Gatekeeper approval”. The latter
  helper waits only one second before opening Privacy & Security, even though
  the replacement App still has to launch and deploy its bundled engine.
- [root cause] The update confirmation passes `restartCodex` only when Codex is
  detected running at that instant; a false/closed result intentionally skips
  the post-update `start-dream-skin-macos.sh` path. Separately, the ad-hoc
  helper's fixed one-second acknowledgement window can misclassify a slow but
  successful replacement launch as a Gatekeeper block.
- [implemented] Every confirmed update now records a deterministic Codex
  restart, including the first upgrade from an older App whose pending marker
  stored `restartCodex = false`. After the replacement App installs its bundled
  engine, it opens Codex through `start-dream-skin-macos.sh`, which verifies and
  reapplies the current theme before reporting success.
- [implemented] Replaced the ad-hoc helper's fixed one-second decision with a
  bounded 60-second acknowledgement wait. A normal replacement launch now
  completes directly; Privacy & Security opens only when the new App never
  acknowledges startup. Quarantine, signature checks, fixed download channel,
  atomic swap, backup and rollback remain unchanged.
- [verified] Added Swift policy coverage for running, closed and legacy pending
  states, plus shell coverage for delayed acknowledgement and bounded timeout.
  The complete macOS suite passes without skips, including 13 Swift tests,
  signed theme switching, runtime-state integration and live Doctor against
  Codex 26.803.41515 with `custom-iron-man` active.
- [verified] A local, non-installed universal arm64+x86_64 App build passed
  strict code-sign verification and contains the updated installer. No version
  was bumped, no installed App was replaced, and no Release was published.
- [complete] Source and documentation changes are ready for a future personal
  release. `origin/main` had no new commits, so no merge was necessary.

## Codex Updated Chat / Work Home Adaptation (2026-08-05)

- [goal] Inspect the currently installed Codex/ChatGPT desktop build and repair
  the Chat and Work home layouts after its DOM update, while preserving the
  Iron Man shared artwork, theme-owned Jarvis text, vertical centering and the
  compact bottom composer.
- [constraint] Diagnose the live renderer read-only before changing selectors
  or CSS. Keep the shared runtime as source of truth, synchronize both platform
  payloads, and do not publish a new version unless the user explicitly asks.
- [done] Captured live Chat / Work evidence from Codex 26.730.61309 build 6223
  (Chromium 151.0.7922.71): the complete composer moved to
  `_ComposerLayoutBody_`, while the old fallback incorrectly exposed
  `_ComposerLayoutFooter_` as the whole surface.
- [in_progress] Update the shared hash-free selector contract, restore the
  bottom composer row and centered theme title, sync both platform payloads,
  and verify with tests plus live screenshots.
- [done] Updated the shared contract to select the full
  `_ComposerLayoutBody_` and its `_ComposerLayoutFooter_` toolbar without the
  build hash, while preserving the legacy `.composer-surface-chrome` path.
- [done] Synchronized macOS and Windows assets. Targeted renderer/doctor tests,
  the complete macOS suite (including Swift build and 12 XCTest cases; signed
  runtime-only integrations intentionally skipped) and all six portable
  Windows Node suites pass.
- [done] Hot-applied the local payload to the signed Codex renderer and
  verified both modes at 1512x949: Chat composer 640x44 at y=881; Work composer
  640x98 at y=787 with its utility strip; both show the theme title on the
  full-window vertical center and no horizontal/vertical overflow.
- [pending] The currently open renderer is fixed, but persisting this exact
  local engine across the next Codex restart requires one explicit Codex
  restart through the atomic engine repair flow. No version was bumped or
  published.
- [authorized] User approved a Codex restart, requested an upstream check and
  merge when available, then explicitly requested a new public release. Commit
  this already verified adaptation before fetching/merging origin; preserve
  the personal home layout and Iron Man behavior through the integration.
- [upstream] Fetched origin/main at `0a727a5`; it adds two post-v1.5.11
  documentation-only commits (Gallery / Studio captures and README table
  layout). Runtime and version sources remain v1.5.11 with no new engine
  feature. Merge keeps the personal Chinese README content where Git aligned
  upstream gallery blocks with unrelated personal feature sections; the
  conflict-free English gallery refresh and image asset history are retained.
- [release] Personal latest is public v1.5.11.3; both local and remote
  `v1.5.11.4` are absent. Prepare v1.5.11.4 with all six version sources and
  bound update assertions synchronized, then run the full release gate before
  pushing. Public artifacts remain macOS DMG plus SHA256SUMS only.
- [verified] All six version sources and bound assertions are synchronized at
  `1.5.11.4`. Portable macOS Node tests pass 67/67, Windows Node tests pass
  19/19, and both platform payload checks pass.
- [verified] The full macOS suite passes with the installed official Codex
  26.730.61639 signed runtime, including 12 Swift tests, signed theme-switch
  integration, runtime-state integration, Safe CSS, ZIP/import and updater
  safety checks. The live Doctor check alone was explicitly skipped because
  the user asked not to restart the currently open v1.5.11.3-injected Codex;
  a direct Doctor trace confirmed that its only failure was the expected
  candidate/live version and payload fingerprint mismatch.
- [verified] The local universal arm64+x86_64 DMG passed the build script's
  read-only mount validation, bundled App/engine version checks, strict ad-hoc
  signature check, URL scheme, runtime file allowlist and sole Iron Man preset
  contract. `CodexDreamSkin-v1.5.11.4.dmg` is 3,048,779 bytes with SHA-256
  `7b8836e729e0f2d24c58d61dfe1249edc967f886756d4f546dadba5622d06e35`;
  an independent `hdiutil imageinfo` and SHA-256 check also passed.
- [released] Release commit `8663f76e0c830d737f661cb159a8a23ffbff5f27`
  was fast-forward pushed to `personal/main`. CI run `30979795021` and Release
  run `30979795092` both completed successfully; public tag `v1.5.11.4` points
  exactly to the release commit.
- [verified] Public Release `365314741` is non-draft and non-prerelease with the
  expected macOS-only asset set. The published DMG is 3,047,991 bytes with
  SHA-256 `82b5c3ffcd308a597a9533a0d2831b198e30d72c356d646a4cfbbc9ddd5aeb3b`;
  GitHub's asset digest, `SHA256SUMS.txt`, a clean single-process download and
  `hdiutil imageinfo` all agree. The local and CI DMG bytes differ as expected
  for independent ad-hoc builds, while both passed the same mounted contract.
- [complete] `v1.5.11.4` is publicly downloadable. The currently open Codex was
  intentionally not restarted at the user's request; installing/updating the
  new App remains the final user-side live smoke test.

## Personal v1.5.11.3 Build And Release (2026-08-03)

- [goal] Publish the verified guided macOS self-update flow as personal release
  `v1.5.11.3`, so the user can manually install it and exercise future updates
  with progress, retry, automatic Codex/Dream Skin shutdown, atomic App swap,
  DMG detach, engine handoff and Codex restoration.
- [baseline] `personal/main` is `3ce0f7e`; local `codex/custom-engine` adds only
  the tested self-update commit `a72c4eb`. Upstream remains at integrated
  `v1.5.11` (`1c7a859`). Git refs and the public GitHub API confirm that neither
  a personal `v1.5.11.3` tag nor Release exists.
- [authorized] The user explicitly requested publication. Synchronize all six
  release version sources and bound assertions, run local regressions, build
  and mount-check the exact macOS DMG, then push the verified candidate and
  confirm CI, tag, public Release, assets and checksums.
- [verified] All six version sources and bound assertions are `1.5.11.3`;
  shared runtime synchronization, shell syntax and diff hygiene pass. All 19
  portable Windows Node tests pass. The complete macOS suite passes, including
  the native App build, 12 Swift tests, installer rollback, ad-hoc identity,
  package security, signed theme switching and runtime-state integration;
  Doctor alone was intentionally skipped to preserve the installed Codex App.
- [verified] The local universal arm64+x86_64 DMG passed the build script's
  read-only mount validation for App/engine version `1.5.11.3`, strict ad-hoc
  signature, URL scheme, icon, notices, packaged update helpers and the sole
  bundled Iron Man preset. `CodexDreamSkin-v1.5.11.3.dmg` is 3,048,558 bytes
  with SHA-256
  `472be8791fd22c483980769655f5b6f872bbc6b1aec4c18eb76fa476dd889d8f`;
  an additional `hdiutil imageinfo` check also passed outside the test sandbox.
- [released] Candidate `30f1562c417dd8e2c457d47de3e816b82c9282d7`
  was fast-forward pushed to `personal/main`. CI run `30787390568` and Release
  run `30787390560` both completed successfully; public tag `v1.5.11.3` points
  exactly to the candidate commit.
- [verified] Public Release `364004634` is non-draft and non-prerelease with
  exactly two uploaded assets. The published
  `CodexDreamSkin-v1.5.11.3.dmg` is 3,047,815 bytes; GitHub's asset digest, the
  published `SHA256SUMS.txt` and an independently resumed download all report
  SHA-256
  `9e1714d949663493dffa032d01f2df7c3aa659916e12e74bbb82328ed06adb3e`.
- [complete] `v1.5.11.3` is publicly downloadable. It must still be installed
  manually once because the user's current App predates this guided updater;
  the new flow can then be exercised against a future version.

## Native Self-Update Experience Repair (2026-08-03)

- [goal] Turn “检查更新” into a native, observable and mostly unattended
  update: show real download/stage progress, ask once after verification,
  automatically close Codex and Dream Skin, install atomically, eject the DMG,
  relaunch the new menu-bar App and restore Codex only when appropriate.
- [evidence] The current shell path already downloads, hashes, mounts, stages,
  detaches and rollback-swaps the App, but `ScriptRunner` buffers all output so
  the UI appears frozen. It also leaves Codex running. The replacement App then
  calls `install-dream-skin-macos.sh` directly, which correctly refuses to
  rewrite `config.toml` while Codex is saving it; this produces the screenshot's
  “Close Codex before installation” error after an otherwise successful App
  update.
- [scope] Preserve the strict GitHub URL/size/SHA checks, quarantine behavior,
  atomic App backup/rollback and official Codex bundle validation. Add native
  progress and explicit restart consent without weakening those boundaries.
- [constraint] Implement and validate locally on `codex/custom-engine`. Do not
  bump a version, push, tag or publish unless the user later requests it.
- [implemented] Added a bounded `[update-progress]` event contract, streaming
  script output, a native determinate/indeterminate progress panel and a safe
  download cancel path. Update checking now downloads and verifies first, then
  asks once before installation.
- [implemented] The verified DMG can be reused without redownloading. Final
  installation automatically stops the validated Codex process/injector when
  authorized, mounts and detaches the DMG, stages the App, and hands off to the
  existing atomic self-update helper.
- [implemented] The replacement App defers update acknowledgement until its
  bundled engine is installed. It then removes the rollback marker and restores
  Codex/skin only if Codex had been running before the update.
- [implemented] GitHub metadata and DMG transfers retry transient failures;
  the DMG download resumes its verified staging file when GitHub supports byte
  ranges. Persistent check/download failures now offer an immediate native
  retry instead of ending at an acknowledgement-only alert.
- [verified] Shell syntax and diff hygiene pass. The native menu-bar App builds,
  all 12 Swift tests pass (including malformed progress-event bounds), and the
  complete macOS suite passes with installer rollback, ad-hoc signature,
  runtime-state, signed theme switching and package/security coverage. Doctor
  alone was intentionally skipped because it requires touching the installed
  signed Codex App.
- [complete] Local implementation is ready on `codex/custom-engine`. No version
  bump, push, tag, DMG or Release was created; the currently installed/public
  `v1.5.11.2` therefore remains unchanged until the user requests a release.

## Personal v1.5.11.2 Build And Release (2026-08-03)

- [goal] Publish the verified native user-message bubble surface repair as the
  personal macOS release `v1.5.11.2`.
- [baseline] `personal/main` is `516059c`; local `codex/custom-engine` adds the
  tested fix at `340104b`. GitHub currently has no `v1.5.11.2` tag or Release.
- [authorized] The user explicitly requested publication. Bump all six release
  version sources and bound assertions, build and mount-check a local DMG, then
  push the exact candidate and verify CI, tag, public Release and checksums.
- [verified] All six release version sources and bound assertions are
  `1.5.11.2`. Shared assets are synchronized; 67 macOS and 19 Windows portable
  Node tests pass; the full macOS suite passes, including 11 Swift tests.
- [verified] Local universal arm64+x86_64 DMG build and its built-in read-only
  mount validation passed. `CodexDreamSkin-v1.5.11.2.dmg` is 3,002,295 bytes
  with SHA-256
  `f709c0596b0bfb97308fee6aa4e82447382f15b58c563c6fe51a2c55762b5d5f`.
- [released] Candidate `bbb8becbca00f20fca0c1b5cdb3327b512a27712`
  was fast-forward pushed to `personal/main`. CI run `30782578410` and Release
  run `30782578405` completed successfully; the public `v1.5.11.2` tag points
  exactly to that candidate.
- [verified] Public Release `363977236` is non-draft and non-prerelease. Its
  `CodexDreamSkin-v1.5.11.2.dmg` is 3,001,601 bytes and uploaded alongside
  `SHA256SUMS.txt`; both GitHub's asset digest and the published checksum report
  SHA-256 `5d442b344130f7da466ed0acc7a892c202ea9e93ac4b09ce3845e73405fe64be`.

## User Message Bubble Surface Repair (2026-08-03)

- [goal] Apply the Iron Man user-message color to the existing rounded native
  bubble only. The full-width message row must remain transparent; do not add a
  second rectangular backdrop behind the bubble.
- [evidence] On the released v1.5.11.1 renderer, `message-user` is currently
  assigned directly to `[data-local-conversation-user-anchor]`. In the current
  Codex DOM that semantic anchor spans the full content row, while the native
  rounded bubble is a descendant, producing the screenshot's wide rectangle.
- [constraint] Preserve the bounded Safe CSS bridge and legacy message-role
  compatibility. Diagnose the live DOM read-only, fix shared runtime sources,
  synchronize generated platform assets and validate locally. Do not publish a
  new version unless the user explicitly requests it.
- [evidence] Live read-only CDP inspection found the native rounded surface at
  `[data-user-message-bubble]` inside the full-width
  `[data-local-conversation-user-anchor]`. The inner node owns the native 20 px
  radius, padding and 77% max width.
- [implemented] The renderer now assigns the public `message-user` part only to
  `[data-user-message-bubble]` descendants bounded by a recognized user row.
  The outer modern row remains unmarked and transparent. Older role-based
  builds without the descendant keep the prior bounded fallback.
- [verified] Selector contract and renderer regression tests pass. Shared asset
  synchronization is clean; both macOS and Windows renderer payload tests pass;
  all 19 Windows Node tests pass; the full macOS suite passes, including 11
  Swift tests, Safe CSS, package import, installer and runtime-state coverage.
- [release] Local fix only on `codex/custom-engine`. No version bump, push, tag,
  DMG or Release was created because publication was not requested. A future
  public build must use a version newer than the already published `1.5.11.1`.

## Personal v1.5.11.1 Build And Release (2026-08-03)

- [goal] Build, verify and publish the already merged personal `v1.5.11.1`
  integration so the user can manually install its macOS DMG.
- [baseline] `codex/custom-engine` is clean at merge commit `8525188`, whose
  parents are the personal checkpoint `d9756c4` and upstream v1.5.11 commit
  `1c7a859`. All six release-bound version sources are `1.5.11.1`.
- [authorized] The user explicitly requested build and publication. Build and
  mount-check a local DMG first; only after it passes, push the exact candidate
  to `personal/main` and verify CI, tag, public Release and asset checksums.
- [verified] Local candidate commit `0ad4c1603d0c8b37d0b8e51620d479f6cb4bee06`
  built a 2.9 MiB universal arm64+x86_64 DMG. Read-only mount validation passed
  for App/engine version `1.5.11.1`, strict ad-hoc signature, URL scheme and the
  sole bundled `preset-iron-man`; local SHA-256 is
  `08d433a1aa459773e7496ac33759927747729ea7de045714a9c0eaf48affc233`.
- [released] Candidate `0ad4c16` was fast-forward pushed to `personal/main`.
  CI run `30779967299` and Release run `30779967336` both completed
  successfully. Public tag `v1.5.11.1` points exactly to that commit; Release
  `363962488` is public, non-draft and non-prerelease.
- [verified] Public `CodexDreamSkin-v1.5.11.1.dmg` is 3,001,280 bytes with
  GitHub digest and `SHA256SUMS.txt` value
  `cd02462b72eb3c072013560f6f51fef7eb8942a831d7ac940e29cf33ed3b2848`.
  The public download responds and redirects to a release-asset URL. The
  currently installed App was not modified; the user can now install manually.

## Merge Upstream v1.5.11 Into Personal Engine (2026-08-02)

- [goal] Merge current `origin/main` (`v1.5.11`) into the personal engine while
  retaining Iron Man, theme-owned homepage/message styling, main-centered
  shared artwork, default-closed pinned summary and the repaired ad-hoc updater.
- [baseline] Local `codex/custom-engine` and `personal/main` are at `a9ed47a`;
  `origin/main` is `1c7a859` with four upstream-only commits since common base
  `cd71dfd`. The upstream changes cover v1.5.10 community-import/renderer work
  and v1.5.11 Codex 26.727 Settings renderer detection.
- [constraint] Merge and validate locally only. Do not push the version-changing
  result to personal `main`, tag it or publish a Release without a separate
  explicit user request. Use personal version `1.5.11.1` after integration so
  it remains distinct from upstream `1.5.11`.
- [complete] Merged upstream `origin/main` at `1c7a859` into the personal
  engine and resolved the renderer, selector, injector, test and documentation
  conflicts. The integrated local version is `1.5.11.1`; no push, tag, Release
  or installed-engine replacement was performed.
- [preserved] Iron Man remains the sole bundled preset. Theme-owned home text,
  the compact bottom composer, recommendation-card removal, main-centered
  shared artwork, theme-owned dimming and user-message styling, and the
  default-closed pinned summary remain in the merged renderer contract.
- [upstream] Integrated the v1.5.10 community-theme identity/journal recovery,
  Safe CSS and generic-renderer improvements plus the v1.5.11 Codex 26.727
  general-Settings detection and stable app-shell selectors.
- [verified] `tools/sync-runtime-assets.mjs --check`, JavaScript syntax,
  selector doctor, both renderer suites, bootstrap and window-readiness tests
  pass. The full macOS suite passes with Swift build, 11 XCTest cases and all
  package/import/security regressions; Doctor alone was intentionally skipped
  to avoid touching the installed app. All 19 portable Windows Node tests pass;
  Windows PowerShell/installer execution remains a CI-only verification gap on
  this Mac.

## Local Legacy v1.5.10 Engine Migration (2026-08-02)

- [goal] Replace the user's unpublished legacy managed engine `v1.5.10`, which
  lacks the `message-user` theme contract, with the installed App's bundled
  `v1.5.9.3` engine so the Iron Man user-message surface becomes available.
- [finding] The App and bundled engine are both `v1.5.9.3`, while
  `~/.codex/codex-dream-skin-studio/VERSION` is the older local-development
  label `1.5.10`. Semantic ordering correctly blocks the GUI from silently
  downgrading, even though this particular unpublished engine is functionally
  older and has no `message-user` / `userMessage` runtime support.
- [authorized] The user saved their work and explicitly authorized restarting
  ChatGPT/Codex. Run the bundled repair script directly with its explicit
  restart flag; retain atomic deployment/rollback and preserve themes/images in
  the separate Application Support state root.
- [stopped] The restart interrupted the active tool turn before installation.
  Post-restart verification showed no partial deployment: App remains
  `v1.5.9.3`, managed engine remains the intact legacy `v1.5.10`, and its old
  injector restarted normally. The user chose to defer this visual issue and
  requested an upstream merge instead.

## Personal v1.5.9.3 Assisted-Update Repair Release (2026-08-02)

- [goal] Publish the verified ad-hoc assisted-update repair as personal
  `v1.5.9.3`, so the user can perform one final manual App replacement and use
  the corrected updater for later releases.
- [baseline] Personal `main` is an ancestor of local commit `b25d4df`, and the
  current public personal Release is `v1.5.9.2`. Upstream `origin/main` has
  advanced to `1c7a859`; defer that unrelated merge so this patch Release stays
  limited to the already verified updater repair and current personal features.
- [complete] Synchronized all six version-bound sources and current-version
  assertions to `1.5.9.3`; README and changelog now document the one-time
  manual upgrade required from `v1.5.9.1` / `v1.5.9.2`.
- [verified] The complete macOS suite passes, including the real ad-hoc signing
  regression, Swift build, all 11 XCTest cases, signed theme switching,
  runtime-state integration and package/security tests; Doctor alone is
  intentionally skipped to preserve the live old-version session. All 18
  portable Windows Node tests pass after synchronizing their version-bound
  window-readiness fixture; Windows PowerShell coverage remains assigned to CI.
- [verified] The local universal `v1.5.9.3` DMG passed mandatory mount,
  strict code-signature, App/engine version, URL scheme, arm64+x86_64,
  sole-Iron-Man-preset and packaged-runtime checks. Local candidate SHA-256 is
  `0eb7c4cfc9a83bc51db0f885d23b03a642fda0911b1ec45a16f19a96d8314367`.
- [released] Release commit `32bdcf7db657508120873fe3dd00d7cc0ee24c58`
  was pushed to personal `main`; CI run `30730262892` and Release run
  `30730262925` both completed successfully. Tag `v1.5.9.3` points exactly to
  that commit, and the public Release is neither draft nor prerelease.
- [verified] Public asset `CodexDreamSkin-v1.5.9.3.dmg` is uploaded and non-empty
  at 2,982,809 bytes. GitHub's asset digest and `SHA256SUMS.txt` both report
  `389fe95e4466263b13e820c6b9b897315509a65776229e444d42da83976fb682`.
  The installed `v1.5.9.1` checker correctly discovers `v1.5.9.3` and its exact
  metadata; do not use its broken install step. The user should download and
  manually replace the App once, then repair/apply the bundled `v1.5.9.3`
  engine so later releases can use the corrected automatic updater.

## Assisted Self-Update Ad-Hoc Team ID Regression (2026-08-01)

- [goal] Complete the real installed-App update smoke test from personal
  `v1.5.9.1` to the newly published personal `v1.5.9.2` Release without
  bypassing Gatekeeper or overwriting an existing public Release.
- [verified] Personal Release `v1.5.9.2` is public from commit `d7f49ab`; its
  Release workflow and repository CI both passed. The public DMG is 2,982,572
  bytes with SHA-256
  `705ee8d82a7703444be8fd923714e652d0b371643f693b19b952aaf639d46005`.
- [verified] The installed `v1.5.9.1` menu action correctly discovered
  `v1.5.9.2`, displayed the confirmation alert, downloaded the exact public
  asset, verified it, mounted it, and staged a complete replacement App. The
  current App remained intact when preflight failed.
- [root_cause] `/usr/bin/codesign -dvv` reports an ad-hoc signature as the
  literal `TeamIdentifier=not set` on this Mac. The updater treated that
  non-empty text as a Developer Team ID, incorrectly entered the signed-update
  branch, and failed `spctl` instead of using the explicit ad-hoc assisted path.
- [root_cause] The ad-hoc signature checks also piped `codesign` into
  `grep -q` under `set -o pipefail`; an early grep match can close the pipe and
  turn a valid `Signature=adhoc` result into a SIGPIPE failure. Both metadata
  values must be captured completely and then compared exactly.
- [root_cause] The quarantine validator used `[^;\r\n]` with POSIX
  `grep -E`, where `\r` and `\n` do not mean CR/LF and instead reject ordinary
  letters such as the `r` in `Chrome`. Replace that class with the POSIX
  control-character class while continuing to reject separators and injected
  line breaks.
- [complete] Normalize `TeamIdentifier=not set` to an absent Team ID, capture
  `Signature=adhoc` without a `pipefail`/SIGPIPE false negative, and validate
  quarantine provenance with POSIX control-character semantics. A real ad-hoc
  codesign regression covers all three cases.
- [verified] The repaired source installer passes preflight against the exact
  public `v1.5.9.2` staged App and the running installed `v1.5.9.1` App. The
  complete macOS suite passes, including Swift build, all 11 XCTest cases,
  signed theme switching, runtime-state integration and package/security
  regressions; only Doctor was intentionally skipped to preserve the live
  ChatGPT session.
- [next] `v1.5.9.2` is already public and therefore cannot be replaced. Keep
  the verified repair local until the user explicitly authorizes a new patch
  version (recommended `1.5.9.3`); then synchronize all six version sources,
  rebuild/mount-check the DMG, publish, and repeat the installed-App update
  smoke test.

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
- [complete] Built and mount-checked the local DMG, pushed the release candidate
  to personal `main`, and verified the public GitHub Release assets. The real
  assisted updater reached the final preflight but exposed the ad-hoc Team ID
  parsing regression documented above. Do not modify or publish to upstream
  `origin`.
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

## Issue #352 fix and v1.5.14 release (2026-08-12)

- [fix merged] PR #360 (`e3787857953998a1916c39b10942ac6c15978a25`) passed exact-head CI run `31558654733`: Static, macOS repository regressions plus universal DMG, Windows PowerShell 7, and Windows PowerShell 5.1 plus Setup.exe. It was squash-merged with the authorized same-owner review bypass at `2026-08-12T03:06:37Z` as `main@69a5a2e4b68174b1c0c70a2fa62adf1aca1eff2a`.
- [release branch] This isolated worktree is `codex/release-v1.5.14` from that exact merge commit. Only the six version sources, two version-bound macOS assertions, both platform changelogs, and this durable progress record are in scope. All six version sources equal `1.5.14`.
- [local gate] Portable Node regressions pass 103/103; runtime asset sync, macOS/Windows payload checks, Node/Bash syntax, version consistency, and `git diff --check` pass. `CODEX_DREAM_SKIN_SKIP_DOCTOR=1 bash macos/tests/run-tests.sh` passes with only the documented full-Xcode XCTest and installed signed Codex Doctor branches skipped.
- [next] Commit and push the version branch, open a Ready PR, require exact-head CI, merge it, then verify the sole Release workflow creates `v1.5.14` from the exact main merge and publishes non-empty DMG, Setup.exe, and `SHA256SUMS.txt`. Only after public asset/checksum verification will #352 receive the customer reply; keep it open pending field confirmation.

## Issue #352 Windows one-click cold-session baseline (2026-08-12)

- [root cause] The reporter's exact `One-click apply requires an existing
  verified Dream Skin session.` failure is the cold-session guard introduced
  by PR #245 (`c44b434`, merged as `71f30f0`), not PR #357. The guard conflicts
  with the documented one-click start/restart path by rejecting before that
  path can run. Upstream Issue #235 remains a separate limitation: current
  Store Codex may still fail to expose a verified CDP endpoint after startup.
- [local implementation] Isolated worktree
  `/private/tmp/dreamskin-issue352-baseline`, branch
  `codex/fix-352-one-click-baseline`, starts from exact public v1.5.13
  `main@6ae42e645c15f6ac91f5fa54a9c37dbc57af646c`. The Windows community apply
  path now classifies only a missing session as bootstrap-eligible, releases
  the operation lock while invoking the existing start-and-verify child, then
  reacquires the lock and revalidates the complete old-theme baseline and its
  fingerprint. All other baseline failures remain fail-closed.
- [safety/order] User confirmation still precedes startup. Old-theme baseline
  establishment and visible verification precede temporary work-root creation,
  ZIP download, import, snapshot, or active-theme write. The transaction keeps
  its second baseline check to reject a concurrent pause/theme/session change.
  A baseline failure therefore performs zero candidate download/import/write,
  and no longer claims that nonexistent download files were cleaned up.
- [tests] Before the final orchestration assertion, focused PowerShell suites passed for community apply, both appearance
  recovery paths, renderer readiness, verified-skin preservation, config
  rollback, and the structured start-result contract. All 11 Windows scripts
  parse; Windows Node tests pass 27/27, tools Node tests 2/2, and the focused
  macOS ZIP validator passes. The final portable Node set passes 103/103,
  runtime asset sync, dual payload checks, Node syntax, and `git diff --check`
  pass. The portable macOS set previously passed 73/74 in one
  parallel run with only a host subprocess exit 141, and that exact ZIP case
  passed alone. Full Windows wrapper and one ZIP guard remain native-Windows CI
  gates because macOS lacks `Get-AuthenticodeSignature` and resolves `/var`
  through a symlink. This shell no longer has `pwsh` installed, so the final
  test-only orchestration ordering assertion has not been executed locally and
  remains an explicit exact-head Windows CI gate.
- [independent review] Final read-only review found no P0/P1. It confirmed
  lock release before child startup, bounded lock reacquisition, exact
  fingerprint revalidation, download-before-baseline prevention, accurate
  cleanup messaging, and PowerShell 5.1-compatible syntax. Residual evidence
  required before merge is exact-head Windows PowerShell 5.1/7 CI plus Setup.
- [current truth] Six implementation/test/documentation/progress files are modified and
  uncommitted. No push, PR, merge, version bump, tag, Release, or Issue reply
  exists for this fix yet. Next: rerun the corrected focused/static gates,
  review the final diff, commit/push, open a Ready PR, and require all four
  exact-head CI jobs before merge. Then prepare v1.5.14 through the sole Release
  workflow, verify tag/assets/checksums/public status, and reply to #352 without
  closing it until the reporter confirms the field fix.

## Issue #354 Windows failed-start appearance recovery (2026-08-12)

- [current local implementation] All prior independent-audit findings are
  addressed. Startup appearance uses a strict, 64 KiB durable
  `preparing -> committed` journal before marker/config writes. Recovery is
  three-way per managed key and marker, preserves a newer post-crash user
  `system -> light` edit, rejects a journal whose declared changes do not match
  its snapshots without mutating config/marker/evidence, and normalizes CRLF
  snapshot line endings before serialization. One-click child completion gets
  lock timeout plus 300000 ms independent grace, never force-kills a live child,
  and keeps candidate files coherent for timeout/invalid/blocked/
  `preserved-rendered` states. A rendered-but-unverified result-token child
  closes its exact new CDP session and restores appearance before returning
  `restored`.
- [focused verification 2026-08-12] Seven PowerShell 7.6.4 suites pass together:
  `config-startup-rollback`, `start-result-contract`, CDP-failure recovery,
  post-launch recovery, renderer readiness, verified-skin preservation, and
  `community-theme-link`. Executable coverage includes marker/config hard-stop
  windows, tampered journals, CRLF quoted keys and dollar-bearing values,
  post-crash user edits, 480000 ms parent wait, no force-kill/result cleanup
  while the child remains live, preserved-rendered file coherence, and the full
  outer child catch/writer/reader category path.
- [complete local gate 2026-08-12] Portable Node passes 103/103 (macOS 74,
  Windows 27, tools 2). All 23 PowerShell files parse and satisfy the PS5.1
  non-ASCII UTF-8 BOM policy; all Node and Bash syntax checks, both platform
  payload checks, runtime asset sync, and `git diff --check` pass. The full
  `CODEX_DREAM_SKIN_SKIP_DOCTOR=1 bash macos/tests/run-tests.sh` wrapper exits
  0, including signed-runtime switch and runtime-state integration. Native
  SwiftPM/XCTest is skipped because this host lacks a matching full Xcode
  platform, and Doctor is explicitly skipped because no installed signed Codex
  app is available. Native Windows PowerShell 5.1/7 and Setup remain CI gates.
- [independent final audit] Read-only review of the complete local diff found no
  remaining P0/P1. The prior parent hard-kill and `preserved-rendered` mixed-state
  blockers are closed by executable production-helper/result-path coverage.
  Non-blocking P2 residuals are documented: same-user coherent rewriting of the
  entire local journal is outside corruption detection; the explicitly invoked
  test/debug-only `-ForegroundInjector` mode has a narrow pre-injector committed
  window and no production caller; and a concurrent manual action choosing
  byte-identical theme content is indistinguishable from no superseding change.
- [remote state] PR #351 is squash-merged as
  `main@9e6798700c0e35be0713135ebd9b3a6f01583499`; exact-head run
  `31522162828` and post-merge run `31523222468` passed all four client CI
  jobs. Draft PR #357 targets that `main` from
  `codex/fix-354-appearance-rollback@fa3e53822a4158d56dc1ae10efa8f288b2d73a88`.
  Exact-head run `31531028135` passed Static, macOS/DMG, Windows PowerShell 7,
  and Windows PowerShell 5.1/Setup.
- [pushed checkpoint] The 15 implementation, test, and Windows documentation
  files are committed as `54933c3678034333a4e00c0a93c9d4da5d2ded6d`; the
  first verification checkpoint is `8ad35f2`. Both were pushed to
  `codex/fix-354-appearance-rollback` for Draft PR #357. Run `31531028135`
  remains historical evidence for older head `fa3e538`, not the new changes.
- [scope] The PR fixes only caught Windows failed-start partial appearance,
  rollback ownership/concurrency, and bounded one-click diagnostics. It does
  not claim that official Store Codex `26.803.5235.0` restored a supported CDP
  endpoint. User authorization covers scoped commit, push, PR merge, and issue
  handling, but not a version, tag, Release, deployment, or external config.
- [remaining] Push this progress-only checkpoint and update the PR body. Require
  all four CI jobs green on the resulting exact head before marking #357 Ready
  and squash-merging with head protection. Verify post-merge `main` CI, then
  update only #235, #352, and #354. Native Windows 5.1/7 and Setup are CI-only
  evidence on this macOS host.

## Client release v1.5.12 (2026-08-08)

- [scope] Reviewed and merged 10 pending community/self PRs that had accumulated
  unmerged on `main` since late July (#68, #212, #283, #284, #285, #286, #288,
  #289, #106, #342) — each individually verified against current `main` before
  merge: git-mergeable both alone and stacked together, no version-fragile
  selector/DOM assumptions, and (for #283 specifically) the Safe CSS sandbox
  in `runtime/safe-css-policy.json` was cross-checked to confirm no community
  theme can trip the stricter visibility check (opacity floored at 0.65,
  display/visibility/position not themable at all).
- [diagnosed] Merging #68 exposed that `macos/scripts/image-metadata.mjs` is
  generated from `runtime/image-metadata.mjs` via `tools/sync-runtime-assets.mjs`;
  #68 edited the generated output directly instead of the source, so
  `--check` failed on `main` and `windows/scripts/image-metadata.mjs` never
  picked up the new `readRawDimensions` export at all. Fixed at the source
  and regenerated both platform outputs (#347).
- [diagnosed] `Static checks` CI was independently red on `main` — 3 tests in
  `macos/tests/renderer-verification.test.mjs` failed against `main` HEAD
  directly, unrelated to any merge here. Root cause: the test's hand-rolled
  DOM mock had drifted from the real runtime contract in three ways (stale
  `shell-main` selector literal predating the 26.727 `:is(...)` update,
  missing `scope.missingL1` that `assessRendererVerification` requires,
  hardcoded `version: "1.5.6"` against the real `SKIN_VERSION` of `"1.5.11"`).
  Fixed the fixtures and exported `SKIN_VERSION` so the test imports the real
  constant instead of re-hardcoding a value that drifts on every release (#349).
- [implemented] Regrouped the menu bar's ~16 flat top-level items into
  `主题`/`链接`/`维护` submenus, and replaced the always-present manual
  "检查更新…" item with a background check (24h timer + one-shot ~15s after
  launch) that posts a system notification the first time a new version is
  seen and shows a conditional "🆕 发现新版本" item only while one is
  available; manual check moved into 维护 as "立即检查更新" (#348). Could not
  run `swift build`/`swift test` locally — this sandbox's Command Line Tools
  (Swift 5.10) don't match the macOS 15.2 SDK (needs 6.0.3) — so an
  independent review agent read the full diff for compile-breaking issues
  before push, and the PR was only merged after real CI's `macos-latest` job
  (`swift test --package-path macos/menubar-app` + DMG build) came back
  green. The review agent's two substantive findings (install doc no longer
  matched the new background-polling behavior; a manual check during an
  in-flight background check could double-spawn `check-update-macos.sh`)
  were fixed before merge with a dedicated `updateCheckInFlight` guard
  separate from the broader `operationInFlight` busy state, so the 24h timer
  no longer disables the primary apply/open actions while it runs.
- [verified] Before cutting the version: `node --test macos/tests/*.test.mjs
  windows/tests/*.test.mjs tools/*.test.mjs` (93/93 pass), full
  `macos/tests/run-tests.sh` including signed-runtime and Doctor checks, and
  both `injector.mjs --check-payload` invocations all pass on `main` post-merge.
- [implemented] Version bump touches all six release version sources
  (`macos/VERSION`, `windows/VERSION`, `macos/package.json`,
  `macos/scripts/common-macos.sh`, both platforms' `injector.mjs`
  `SKIN_VERSION`) plus the two hardcoded `1.5.11` assertions in
  `macos/tests/run-tests.sh` (the update-check JSON fixture and the
  `common-macos.sh`-sourced `$SKIN_VERSION` check). A grep-only pass across
  the repo for the literal `1.5.11` first missed a third real dependency:
  `windows/tests/injector-window-readiness.test.mjs` imports `verifySession`
  (not `assessRendererVerification` directly), so its mock
  `__CODEX_DREAM_SKIN_STATE__.version` is transitively checked against the
  real `SKIN_VERSION` even though the test file never names that identifier.
  The full portable test run after the version bump caught this immediately
  (4 failures) before it reached CI; fixed the same way as the macOS
  `renderer-verification.test.mjs` case — export `SKIN_VERSION` from
  `windows/scripts/injector.mjs` (as a separate `export { }` statement, same
  reason as macOS) and import it into the test instead of re-hardcoding.
  `windows/tests/start-verified-skin-preserved.tests.ps1`'s literal
  `"version":"1.5.11"` is a fully mocked PowerShell fixture with no path to
  `SKIN_VERSION` at all (grepped every `.ps1` script; it's JS-only), so that
  one is genuinely safe to leave unchanged.
- [gap] Live click-through of the reorganized macOS menu bar and a real
  "update available" notification have not been manually exercised on a
  physical Mac — verification here is CI (`swift test`) plus static review,
  not an interactive smoke test.

## macOS menu reapply/open ChatGPT restart fix (2026-08-05)

- [scope] Branch `codex/fix-macos-reapply-open-chatgpt` was created from latest
  `upstream/main` (`0a727a5`). Fix the macOS menu behavior where the first
  "重新应用皮肤" click can restart ChatGPT even though the prompt says no restart,
  and review its interaction with the separate "打开 ChatGPT" action.
- [diagnosed] The menu title is derived from lightweight `session=active`
  status, while `apply-from-menubar-macos.sh` always calls
  `start-dream-skin-macos.sh --restart-existing`. If ChatGPT is running without
  a verified CDP endpoint, `start-dream-skin-macos.sh` stops and relaunches it.
- [implemented] `apply-from-menubar-macos.sh` keeps the original
  `CHEAP_RUNNING` / `SESSION` prompt flow and now attempts `hot_reapply_theme`
  after the existing confirmation but before falling back to
  `start-dream-skin-macos.sh --restart-existing`. A successful hot reapply
  exits without restarting ChatGPT.
- [corrected] The native menu keeps the original "打开 ChatGPT" operation title
  and always shows that action. Its implementation preserves the original
  "未找到 ChatGPT" and "无法打开 ChatGPT" error surfaces, but replaces the
  successful native `NSWorkspace.openApplication` launch with the Dream Skin
  start path only when the installed engine is complete. If the engine is
  missing or incomplete, the action falls back to native `NSWorkspace` opening
  and does not install the engine implicitly.
- [covered] Added static regressions to lock menu apply hot-reload ordering,
  the preserved session-driven prompt model, the unchanged "打开 ChatGPT" title,
  the Dream Skin-backed open action, and the native fallback when the engine is
  not installed. The macOS test Gatekeeper scan now ignores the same
  `.build-*` SwiftPM artifacts already listed in `macos/menubar-app/.gitignore`.
- [verified 2026-08-06] `bash -n
  macos/scripts/apply-from-menubar-macos.sh macos/tests/run-tests.sh`,
  `git diff --check`, `swift build --package-path macos/menubar-app --product
  CodexDreamSkinMenuBar`, and `CODEX_DREAM_SKIN_SKIP_DOCTOR=1 bash
  macos/tests/run-tests.sh` all pass. The wrapper skipped Doctor as requested
  by the environment flag.
- [gap] Live restore / re-apply / open ChatGPT smoke has not been rerun after
  narrowing the implementation back to the minimal AppDelegate + hot-reapply
  path.
- [gap] Direct `swift test --package-path macos/menubar-app` fails on this host
  because the installed Swift toolchain cannot import `XCTest`; the repository
  macOS test wrapper detects the missing full matching Xcode platform and skips
  native XCTest accordingly.

## Client release v1.5.11 — preparing (2026-08-01)

- [base/merged] Settings renderer PR #334 passed exact-head CI run
  `30648201928` at `6d8d2c561cae1e6084bd1fd288264be7c0823907`: Static,
  macOS with Universal DMG, Windows PowerShell 7, and Windows PowerShell 5.1
  with Setup.exe compilation all succeeded. It was squash-merged to `main` as
  `6e71534cd9cd55f87d1f6c9ff1cf305c7ef43893`.
- [scope] Independent worktree `/private/tmp/dreamskin-release-v1511.KVcKVg`
  is on `codex/release-v1.5.11` from that exact `origin/main`. The release
  changes only the six required platform version sources, four version-bound
  assertions, both platform changelogs, and this durable record.
- [implemented locally] All six release version sources and four bound test
  assertions now report `1.5.11`. Both changelogs describe the shared
  Codex 26.727 Settings marker fix and its strict `app:` origin boundary.
- [verified locally] The six-source consistency check passes. Portable Node
  regressions pass 82/82 (macOS 63 and Windows 19); both platform payload
  checks report v1.5.11; runtime asset sync and `git diff --check` pass. The
  complete applicable macOS suite passes with only its documented full-Xcode,
  installed signed-runtime, and Doctor branches skipped.
- [committed locally] Reviewed release commit
  `7d87e6e5ab14256ce6a44a2b7c327bfa6afef878` contains exactly the 12-file
  v1.5.11 scope above.
- [pushed/PR open] Release commit
  `7d87e6e5ab14256ce6a44a2b7c327bfa6afef878` and progress commit
  `733b0a3ae95779714a736de86bcf1daf40cc1501` are pushed on
  `codex/release-v1.5.11`; PR #335 targets `main` at
  `https://github.com/Fei-Away/Codex-Dream-Skin/pull/335`.
- [pending] Commit and push this PR checkpoint, require four exact-head CI
  jobs, then merge.
  Only the Release workflow from the resulting `main` commit may tag and build
  the public DMG, Setup.exe, and `SHA256SUMS.txt`.

## PR #334 Windows CRLF CI follow-up — locally verified (2026-08-01)

- [scope] Client worktree `/private/tmp/dreamskin-settings-fix.4tH4ld` is on
  `codex/fix-26-727-settings-renderer`; PR #334 targets `main`. The pre-fix PR
  head is `159c650c3b43877df4413a7b0a20562fe556a018`.
- [reproduced from CI] Run `30646840223` passed Static checks and macOS
  repository regressions, but both Windows PowerShell 5.1 and PowerShell 7 jobs
  failed in their regression suite. On the Windows CRLF checkout, the bootstrap
  source-contract test's fixed 2,200-character slice ended at
  `setInterval(in`, before the asserted `setInterval(install, 250)` text.
- [fixed locally/tests only] Both platform bootstrap tests now inspect the
  complete string returned by the already imported
  `earlyPayloadFor("", "source-contract")`. This removes line-ending-dependent
  truncation without changing or weakening the early-injection assertions and
  without changing runtime implementation.
- [verified locally] `node macos/tests/injector-bootstrap.test.mjs`,
  `node windows/tests/injector-bootstrap.test.mjs`, both platform
  `renderer-inject.test.mjs` tests, `node tools/doctor-selectors.test.mjs`, and
  `git diff --check` all pass.
- [committed/pushed] Test-only fix commit
  `7d19780ec56446c3d1bd1ac61931588c5487f55f` is pushed to
  `origin/codex/fix-26-727-settings-renderer` for PR #334.
- [pending] Require a fresh exact-head CI pass for all four jobs before merge.
  No merge, release, deployment, Issue reply, or Issue closure has occurred in
  this follow-up.

## Client release v1.5.10 — in progress (2026-07-31)

- [base] Feature PR #324 was squash-merged to `main` at
  `a58e63c6909082706c02824622d0e902b3539065`; its exact-head CI run
  `30638018730` passed all four jobs.
- [scope] Branch `codex/release-v1.5.10` changes the six required version
  sources, version-bound assertions, dual-platform changelogs, the exact-event
  Release binding and its regression, plus this durable release record. Public
  v1.5.9 is the predecessor; v1.5.10 does not yet exist.
- [verified locally] All six release version sources are exactly `1.5.10`.
  Portable macOS/Windows Node regressions pass 82/82, and the complete
  applicable macOS suite exits 0 with only its documented full-Xcode native
  XCTest and installed signed-Codex Doctor branches skipped. Runtime asset
  sync, all Node/Bash syntax, both payload checks, PowerShell 5.1 BOM and
  execution-policy scans, and `git diff --check` pass.
- [committed locally] Version release commit
  `7abaea700130207ab2a57cf6ae4881f9673ff93d` contains only the reviewed
  v1.5.10 release scope above.
- [pushed/PR open] Branch `codex/release-v1.5.10` is on `origin`; release PR
  #332 targets `main` at
  `https://github.com/Fei-Away/Codex-Dream-Skin/pull/332`.
- [fixed before merge] Independent release review found the guard checked out
  moving `main`, so a later push could retarget v1.5.10 before packaging. The
  guard now checks out `${{ github.sha }}`, derives the release candidate from
  that exact `HEAD`, and has a portable regression rejecting moving-main
  release binding.
- [pending] Require all PR CI jobs on the final head, merge #332 to `main`,
  then verify the sole Release workflow creates tag v1.5.10 and publishes
  non-empty DMG, Setup.exe, and SHA256SUMS.txt from the exact merge.

## PR #324 hard-interruption import recovery — in progress (2026-07-31)

- [reproduced by review] Both platform importers move the existing canonical
  theme to a hidden replacement backup before publishing the new directory.
  An uncatchable process termination or system restart between those two atomic
  moves leaves the canonical saved theme missing; neither platform currently
  recovers the hidden backup on the next import/startup.
- [scope] Add a persisted, contained replacement journal before the first move.
  Under the existing import lock, recovery must restore the verified old
  fingerprint when the canonical destination is absent, keep a verified new
  destination when publication committed, and fail closed without deleting
  evidence on identity/path/fingerprint ambiguity.
- [ownership] Root owns only macOS publisher/test changes; the Windows agent
  owns only `windows/scripts/theme-windows.ps1` and
  `windows/tests/theme-zip-import.tests.ps1`; the protocol-review agent is
  read-only. Root will run the combined gates before any push.
- [fixed locally/macOS] Replacement candidates and journals are durably synced
  before the first canonical move. Prepared recovery now restores the verified
  old canonical theme before inspecting a suspect candidate, retains malformed
  evidence, rejects conflicting `committed` plus `commit.tmp` markers, and
  preflights duplicate destination journals before any recovery mutation.
- [verified locally/macOS] `node --test
  macos/tests/theme-import-publish.test.mjs` passes (1/1, 12.8 s), including
  real child-process `SIGKILL` after backup rename, candidate publication and
  commit-marker rename, plus corrupt-candidate, conflicting-marker and
  duplicate-transaction recovery cases. `node --check` and
  `git diff --check` also pass at this checkpoint.
- [verified locally/macOS app] An x86_64 menu-bar app build and strict deep
  code-signature verification passed before the final wrapper correction.
  Packaging included the new executable wrapper and publisher, but that build
  is now superseded and must be repeated before push.
- [fixed locally/macOS wrapper] Packaging review caught the wrapper calling the
  nonexistent `discover_codex_bundle`; it now uses the established
  `ensure_node_runtime` path. A source regression guards that call, and the
  focused publish suite, wrapper Bash syntax, and `git diff --check` pass after
  the correction. Startup recovery failure cancels any pending one-click apply
  and reports a bounded repair instruction instead of silently continuing.
- [verified locally/macOS final app] The corrected source builds as
  `/tmp/CodexDreamSkin-pr324-recovery-final.app` (x86_64 Mach-O). Strict deep
  code-signature verification passes; the packaged recovery wrapper is
  executable, and its bytes plus the publisher bytes match the current
  worktree exactly.
- [verified locally/macOS full gate] `CODEX_DREAM_SKIN_SKIP_DOCTOR=1 bash
  macos/tests/run-tests.sh` passes on the integrated macOS files, including the
  publish hard-kill regression, ZIP/archive bounds, community apply rollback,
  installer rollback, signed-runtime switch, and runtime-state integration.
  Only the documented full-Xcode native XCTest and installed signed-Codex
  Doctor branches skipped on this host.
- [fixed locally/Windows] Only a durable `committed` journal plus marker retains
  the new theme. Earlier phases restore the verified old fingerprint first;
  corrupt or missing candidate evidence is retained with the journal and fails
  closed. Duplicate destinations and unsafe/unknown journal fields are rejected
  before mutation, cleanup order is crash-safe, and legacy cleanup is outside
  rollback. A corrupt published candidate is moved back to its contained stage
  before the exact old canonical theme is restored.
- [covered/Windows] The focused suite now includes a real child `FailFast` after
  the first rename plus deterministic restart states for published and committed
  phases, corrupt/missing candidates, duplicate targets, unsafe journals, and
  committed-marker conflicts. Native PowerShell execution is unavailable on
  this Mac and remains a fresh PR CI gate.
- [verified locally/final] Portable macOS/Windows Node regressions pass 81/81.
  The complete applicable macOS suite passes with only its documented full-
  Xcode native XCTest and installed signed-Codex Doctor branches skipped.
  Runtime asset sync, all Node and changed Bash syntax, Windows PowerShell BOM,
  execution-policy safety, and `git diff --check` gates pass.
- [committed locally] Recovery implementation and Windows validation document
  are commit `dd19005e8a37ad7a80f1b957cf9759743b50d7e7` on branch
  `codex/pr324-final-review-fixes`, intended for remote PR head branch
  `origin/codex/fix-318-320-322` (Draft PR #324).
- [pending] Commit this durable progress record, push both commits to the Draft
  PR branch, and require fresh PowerShell 5.1/7 CI. Do not merge, release,
  comment on issues, or close issues.

## PR #324 final L0 readiness correction — pushed and CI-verified (2026-07-31)

- [reviewed] Remote Draft PR head `8b39dcdaff5985f3a2247c13176cd4329a5186eb`
  correctly rejects an ordinary `thread/L0` renderer, but still accepts
  `home/L0` when required L1 shell anchors are missing. That permits an
  unrecognized sidebar/main/header to be reported as a successful apply or
  rollback on both platforms.
- [fixed] macOS and Windows now reserve L0 visible verification only
  for the real cross-platform Settings exception. Home and ordinary task views
  require `scope=L1` with an empty `missingL1`; focused dual-platform readiness
  tests and Node syntax checks pass.
- [verified locally] Shared runtime sync passes, portable Node regressions pass
  80/80, and the complete macOS repository suite passes with only the documented
  full-Xcode and installed signed-app Doctor skips. `git diff --check` passes.
- [committed/pushed] Code fix `0884be7c34cbbd62974d1ce8669a139ffbe81be2`
  and progress commit `1a693364db0086afed30fa9a4e5991d1c61f9237`
  are on remote Draft PR #324. The PR remains open, Draft, and unmerged.
- [verified] GitHub Actions run `30632592756` passed all four jobs at exact head
  `1a693364`: Static checks, macOS repository regressions with Universal DMG,
  Windows PowerShell 7, and Windows PowerShell 5.1 with Setup.exe compilation.
- [verified locally] Root repeated the portable Node suite (80/80), complete
  applicable macOS suite, runtime asset sync, and `git diff --check` at the
  exact remote head; all passed. Only documented full-Xcode and installed-app
  Doctor branches were skipped.
- [correlated] New issue #330 reports the same Codex `26.727.40816` app-shell
  selector migration already reproduced for #322/#326 and covered by this PR's
  shared macOS/Windows selector contract. It is not evidence of a separate
  unresolved root cause.
- [pending] Real Windows Codex validation must be repeated from exact head
  `1a693364` using `docs/pr-324-windows-validation.md`. Do not merge, release,
  tell issue users to retry a public version, or close issues before that result
  is reviewed.

## PR #324 final review blockers — pushed and CI-verified (2026-07-31)

- [reviewed] Draft PR #324 head `598dd07f6831faa238230752531bc75064baa581`
  passed all four CI jobs and has real Windows Codex 26.727 renderer/import
  evidence, but that evidence exposed follow-up behavior and does not waive
  review of the resulting shared-runtime/import changes.
- [reproduced] The head can clear the registered wallpaper whenever validated
  Safe CSS sets `background-color`; its client Safe CSS parser also diverges
  from the website/server glass-filter contract. A preceding search textbox can
  prevent the real prompt composer from receiving its public part marker.
- [reproduced] macOS validates the extracted payload before a missing or
  non-string source ID is normalized, while Windows normalizes first. Windows
  saved-theme enumeration also permits dotted recovery directories to leak into
  the tray menu.
- [fixed] Root/background colors preserve the registered body wallpaper;
  surface image clearing is limited to registered core surfaces. The client
  accepts the same bounded composite glass filters as Studio/server, and a
  preceding search input no longer hides the real semantic composer.
- [fixed] Missing/non-string IDs pass a private pre-publish payload check only
  after temporary normalization, then receive the stable cross-platform ID and
  pass the mandatory final check before any old theme moves. Windows saved-theme
  enumeration filters every dotted transaction/recovery directory.
- [fixed] Generic parts can verify an ordinary route only with `scope=L1` and
  an empty `missingL1`; an L0 thread missing shell/sidebar/header can no longer
  make apply or rollback report false visible success. Explicit settings/home
  L0 anchors remain supported on both platforms.
- [verified locally] Portable Node regressions pass 80/80; focused Safe CSS,
  renderer, fallback-ID ZIP import, runtime sync, Node/shell syntax, and
  `git diff --check` pass. The complete macOS repository suite passes with only
  its documented full-Xcode and installed-app Doctor skips.
- [committed/pushed] Fix commit
  `8b39dcdaff5985f3a2247c13176cd4329a5186eb` is the remote code head of
  `codex/fix-318-320-322`; Draft PR #324 remains open and unmerged.
- [verified] GitHub Actions run `30632144001` passed all four jobs for
  `8b39dcd`: Static checks, macOS repository regressions with Universal DMG,
  Windows PowerShell 7, and Windows PowerShell 5.1 with Setup.exe compilation.
- [pending] The updated real-Windows checklist must still be run from the exact
  PR source-installed engine. Do not merge, release, comment on issues, or close
  issues until that user acceptance result is reviewed.

## Windows Codex 26.727.4816 final worktree acceptance (2026-07-31)

- [verified] The official Store package is `OpenAI.Codex_26.727.4816.0`; the
  installed DreamSkin engine was replaced from this exact worktree under
  `RemoteSigned`, and its CSS, renderer, selector, validator, and importer
  hashes match the repository copies.
- [verified] A real `dreamskin://apply` transaction downloaded and applied
  Lyn-in's complete `juzizhoutou` package through the native confirmation UI.
  The result confirmed size/SHA-256, ZIP, manifest, and Safe CSS validation.
- [verified] Three current complete community themes from different creators
  (`juzizhoutou`, `taishan-wuyue-duzun`, and `cecilylove002`) render in the real
  Codex Home/task UI. Home reports `L1` with `missingL1=[]`; task navigation
  refreshes to `thread/L1`; sidebar, header, message region, composer, toolbar,
  background, and controls remain visible and interactive with no overflow.
- [fixed] Real rendering exposed two final shared-runtime gaps. A root Safe CSS
  background color now also clears the body's canonical image, and Codex
  26.727's user/assistant conversation anchors now map to the public `message`
  part while retaining the legacy selector. Real task inspection found 8/8
  message anchors inside the thread and zero sidebar matches.
- [verified] Final real screenshots are under
  `%TEMP%\dreamskin-pr324-final-live`. Focused 34/34 Node regressions, selector
  doctor, renderer runtime, asset sync, PowerShell 5.1/7 parsing, installer
  static checks, and `git diff --check` pass. Full dual-PowerShell CI remains
  the post-push gate; no merge, Release, or Issue mutation is authorized.

## Windows continuation after macOS 26.727 fix — in progress (2026-07-31)

- [verified] Draft PR #324 and the local branch are both at `98e308a`; the
  macOS follow-up commits `9098060`/`98e308a` are present. The shared selector
  change keeps the legacy anchors and adds Codex 26.727 app-shell attributes,
  so its compatibility direction is appropriate for Windows as well. Real
  Windows 26.727 acceptance is still pending.
- [verified] On real Windows Codex `26.721.11231.0`, the updated selector
  contract still reaches Home at `L1` with `missingL1=[]`. The new CSS parses
  in the Windows Chromium 150 renderer, and shared macOS/Windows selector,
  renderer, and CSS assets are byte-identical.
- [reproduced] Full community-theme Safe CSS loads but loses the cascade for
  sidebar, header, composer, home typography, and toolbar colors because the
  canonical runtime uses `!important` while the untrusted Safe CSS contract
  correctly rejects author-supplied `!important`. Root font-family is one of
  the few declarations that currently wins.
- [in progress] Keep the Safe CSS input contract unchanged, compile only the
  already-validated declarations to a controlled runtime priority, synchronize
  both platform assets, and add cascade regressions. Also tighten generic
  composer/Home verification false positives before reinstalling the exact
  worktree engine and repeating real Windows community-theme checks.
- [fixed] The shared parser now recompiles only validated part/property/value
  rules into the `dreamskin-community` cascade layer with client-owned
  priority. Author CSS still rejects `!important`; original bytes remain the
  semantic/fingerprint input. A higher-priority accessibility layer preserves
  `prefers-reduced-motion` behavior.
- [fixed] Generic composer fallback now requires an explicit composer/prompt
  semantic owner and never marks a plain form or bare textbox. Home verification
  fails when runtime scope claims Home but the real Home identity/surface is
  absent; thread/settings routes retain their existing acceptance boundaries.
- [verified] Shared runtime sync, renderer fixture, Windows readiness 10/10,
  Safe CSS 9/9, and macOS/Windows payload tests 12/12 pass. macOS and Windows
  generated CSS, renderer, and validator assets remain synchronized.
- [in progress] Run the complete Node and Windows PowerShell 5.1/7 suites,
  including the preserved same-ID, reserved-ID, long-path, legacy-suffix, and
  rollback import cases. Then deploy the exact worktree engine and repeat real
  Windows Codex computed-style and community-theme interaction checks.
- [preserved] Existing uncommitted cross-platform importer changes remain in
  the four macOS/Windows import implementation/test files. They are not being
  reverted or overwritten. No merge, Release, Issue edit, or publish is in
  scope until explicit authorization.
- [fixed] A theme whose destination passed the final semantic fingerprint is
  now treated as committed on both platforms even when obsolete backup cleanup
  fails. The import returns `cleanupWarning`/`CleanupWarning`; manual import and
  one-click apply show a bounded local warning without exposing the raw path or
  rolling back the new theme.
- [fixed] Invalid or Windows-reserved source IDs use one cross-platform stable
  identity mapping. The fixed `con.theme` vector is
  `import-931599c2985393be807cf0ed` on macOS and Windows, so a later package with
  the same source ID updates in place instead of creating another directory.
- [verified] Windows PowerShell 5.1 completed the full focused ZIP-import suite,
  including same-ID replacement, exact duplicate, conservative legacy cleanup,
  unrelated suffix preservation, file collision, pre-commit rollback,
  committed cleanup warning and long-path cases. Focused macOS publisher,
  community-link, Safe CSS, dual payload, renderer-runtime, readiness and asset
  sync checks pass; the macOS immutable-backup cleanup case remains a macOS CI
  execution because this worktree is on Windows.
- [fixed] The trusted Safe CSS compiler now clears a core background image when
  a validated part supplies `background-color`, bridges bounded root typography
  and color to `body`, passes composer-toolbar color to its registered buttons,
  and marks the real `game-source` node as `home-hero` when present. SPA DOM
  mutations refresh both public parts and verification scope.

## Codex 26.727 real-renderer visual follow-up — in progress (2026-07-31)

- [verified] Official Codex/ChatGPT `26.727.40816` is running with this Draft
  PR #324 engine (`1.5.9`, head `61d65e3`) and renderer injection succeeds.
- [reproduced] The real home view remains partially white despite successful
  injection. Screenshot: `/tmp/dreamskin-pr324-mac-26.727.png`.
- [root cause] The live renderer has zero matches for legacy
  `main.main-surface` and `header.app-header-tint`; it exposes
  `main[data-app-shell-main-surface="default"]` plus new app-shell header data
  attributes. The generic identity/part fallback added by #324 cannot replace
  the canonical CSS selector contract, so it only themes part of the page.
- [in progress] Add exact legacy-plus-current selectors in `tools/selectors.json`
  and canonical runtime CSS, regenerate both macOS/Windows assets, add dual-
  platform assertions, rerun all applicable tests, then reinstall/reinject and
  capture real macOS visual evidence. Do not merge or release.

## Codex 26.727 selector and top-fade fix — verified locally (2026-07-31)

- [fixed] Shared selector contract now recognizes legacy anchors plus the
  Codex 26.727 stable attributes and constrained CSS Module prefixes:
  `main[data-app-shell-main-surface]` / `_MainContentSurface_`,
  `header[data-app-shell-header-edge-scroll]` / `_Header_`, and the new
  `data-app-shell-main-content-top-fade` / `_MainContentTopFade_` overlay.
- [generated] `tools/sync-runtime-assets.mjs` regenerated macOS and Windows
  selectors, renderer payloads, and canonical CSS. The three shared payload
  files are byte-identical across platforms; `--check` passes.
- [verified] Real official Codex `26.727.40816` with DreamSkin `1.5.9` now
  reports renderer scope `home/L1` with `missingL1=[]`; `<main>` and `<header>`
  receive `data-ds-part="main|header"`; the native top fade computes to
  `display:none`; header remains `position:fixed; z-index:30`. Clean visual
  evidence: `/tmp/dreamskin-pr324-mac-26.727-clean.png`.
- [verified] `node --test macos/tests/*.test.mjs windows/tests/*.test.mjs`
  passes 74/74. Focused selector/renderer/CSS tests and runtime sync check pass.
  The macOS shell suite passes its applicable checks with signed-runtime,
  runtime-state, and Doctor branches explicitly skipped by environment flags;
  native Swift/XCTest remains unavailable on this host.
- [verified] A final live CDP read at 2026-07-31 16:44 HKT still reports
  `home/L1`, `missingL1=[]`, themed outer main, fixed header at z-index 30,
  hidden native top-fade, and no operation overlay. The Windows handoff now
  calls out these exact acceptance checks for Codex 26.727+.
- [committed] Selector/top-fade follow-up is committed as `9098060`
  (`fix: support Codex 26.727 shell surfaces`) on branch
  `codex/fix-318-320-322`.
- [pushed] `9098060cd256ca4ed0aa268283d72a0481188aaa` is pushed to the remote
  head of Draft PR #324, and the PR body documents the root cause, Mac evidence,
  Windows checklist, and remaining real-Windows acceptance boundary.
- [pending] Wait for fresh CI and real Windows Codex visual acceptance. Do not
  merge, release, comment on, or close #326/#322 yet.

Updated: 2026-07-31 14:29 HKT (Asia/Hong_Kong)

## Privacy gate and legacy re-import regression — in progress (2026-07-31 14:49 HKT)

- [fixed] Both platform injectors now use the registered Codex structural marker
  `data-testid="app-shell-header-context-menu-surface"` for generic `app://`
  identity. They no longer read page title, body text, or URL; the strict
  `app:` protocol and generic main/input requirements remain in place.
- [added] macOS and Windows bootstrap fixtures now cover an unbranded generic
  `app:` rejection, a branded structural-marker acceptance, and source guards
  against title/body/URL reads.
- [added] macOS and Windows ZIP import suites explicitly cover an existing
  canonical theme plus an exact `-2` legacy duplicate. Re-import must return
  `Imported`, retain only canonical, and leave no transaction directories.
- [added] Windows ZIP import suite statically verifies published semantic
  fingerprint validation and mismatch handling precede canonical backup
  deletion; no runtime failure-injection backdoor was introduced.
- [verified] Both bootstrap fixtures pass under Node 22 and Node 24; the macOS
  legacy re-import suite, injector syntax, runtime sync, renderer fixture,
  static privacy/PowerShell-policy scan, and `git diff --check` pass.
- [verified] Full portable suite: 74/74 passed. The complete macOS suite passed
  with only the documented full-Xcode and installed-app Doctor branches
  skipped; the current host does not provide those prerequisites.
- [blocked] PowerShell 5.1/7 and real Windows renderer validation remain
  unavailable on this macOS host and must be run by CI/user Windows machine.

## Pre-push verification — PR #324 (2026-07-31)

- [fixed] Import replacement rollback is fail-closed on both platforms. A
  post-publish failure first quarantines the new directory, restores legacy
  cleanup backups and the original canonical directory, and verifies every
  move. Backup and quarantine cleanup errors are surfaced instead of being
  silently ignored; the old theme is never discarded before the replacement
  fingerprint is verified.
- [added] `docs/pr-324-windows-validation.md` is the Windows AI handoff. It
  covers #318/#320/#322, all-theme (not only colors-only) renderer checks,
  legacy suffix safety, rollback expectations, exact commands, and the
  `RemoteSigned`/no-`ExecutionPolicy Bypass` requirement.
- [verified] Portable client regressions: `node --test macos/tests/*.test.mjs
  windows/tests/*.test.mjs` — 74 passed; `NODE=$(command -v node)
  CODEX_DREAM_SKIN_SKIP_DOCTOR=1 bash macos/tests/run-tests.sh` passed with
  only the documented full-Xcode/Doctor skips; runtime asset sync, Node syntax,
  renderer runtime, and `git diff --check` also pass.
- [verified] Focused import, package-validator, injector, readiness, and
  generic-renderer fixture checks pass after the rollback hardening.
- [blocked] This macOS host has no `powershell.exe` or `pwsh`; Windows
  PowerShell 5.1/7, Setup.exe compilation, and a real Windows Codex renderer
  still require the user's Windows host or PR CI.
- [pending] Commit and push the final client branch, update draft PR #324, and
  wait for fresh CI on the new head. Do not merge, publish a Release, close an
  issue, or post a user-facing fix comment.

## Final review correction — legacy import cleanup (2026-07-31)

- [fixed] Both platform importers now consolidate a legacy suffix directory
  only when its stored identity matches the suffix and its semantic fingerprint
  exactly matches the incoming package. Display-name equality is no longer
  treated as lineage evidence, so an independent `family-2` with the same name
  is preserved and ambiguous replacement remains fail-closed.
- [fixed] Legacy suffix detection mirrors the old 80-character ID truncation,
  including max-length IDs, and rejects numeric overflow rather than throwing.
- [fixed] macOS and Windows import notifications distinguish an in-place saved
  theme update from a first import; platform README/docs now describe the same
  behavior and the exact-fingerprint cleanup boundary.
- [pending] Rerun all portable/macOS suites, inspect staged diffs, commit and
  push only after local checks pass. Windows PowerShell 5.1 remains a required
  user/CI validation because this host has no PowerShell runtime.

## Read-only deep review checkpoint — PR #324 / site PR #13 (2026-07-31)

- [reviewed] Client draft PR #324 remains at `ee3b64f`; its four GitHub CI jobs
  pass. Root reran shared-asset sync, the focused macOS/Windows import,
  bootstrap and readiness tests, plus `git diff --check`; all passed.
- [blocked] The generic `app://` gate is broader than the PR description:
  `(main && input)` passes with no Codex/ChatGPT identity marker. A minimal
  negative fixture independently executed the early payload on both platforms.
- [blocked] Generic renderer parts do not complete #320/#322: canonical
  `dream-skin.css` still has no `[data-ds-part]` fallback for the core
  main/sidebar/composer rules, generic part selection is over-broad, and a
  home `[role=main]` can keep the earlier `main` part instead of `home`.
- [blocked] The #318 import change repairs only a clean future library. An
  already-created `theme-id-2` exact duplicate returns early as `duplicate`,
  leaving both old directories. Replacement is also selected by destination
  directory existence rather than confirmed stored identity, and the Windows
  post-publish mismatch path deletes the old backup before final verification.
- [blocked] Site PR #13 has a validated-package CAS regression and no backfill
  for the already-reset live count; see the site repository progress file.
- [fact] No PR code, commit, push, merge, Release, issue comment, or issue
  closure was performed during this review.

## In Progress — Issues #318/#320/#322 community client/site fixes (2026-07-31)

- [complete] Work is isolated in clean temporary worktrees:
  client branch `codex/fix-318-320-322` at `/tmp/dreamskin-client-fix.O9D3Vw`
  and site branch `codex/fix-318-download-inheritance` at
  `/tmp/dreamskin-site-fix.pHtykF`. Main worktrees were left untouched.
- [complete] Client implements same-id theme ZIP imports as in-place version
  replacement on both macOS and Windows instead of suffixing `-2`, while exact
  duplicate content remains `duplicate` and different-id same-name imports still
  report `nameCollision`.
- [complete] Client keeps dual-platform renderer behavior aligned: generic
  `main`/sidebar/composer part fallbacks are generated from shared runtime
  source and synced byte-for-byte into macOS and Windows assets.
- [complete] Client injector verification now accepts newer `app://` Codex
  renderer shells with generic visible main/input structure and Codex/ChatGPT
  branding, while preserving exact payload/theme/revision checks and loopback
  CDP target rejection.
- [complete] Site moderation service now inherits the maximum prior same-theme
  approved/downloaded version counter into a pending version before approval,
  so newly approved community versions do not reset visible downloads to zero.
- [verified] Site backend checks in `/tmp/dreamskin-site-fix.pHtykF/server`:
  `go test ./internal/moderation ./internal/upload ./internal/httpapi`,
  `go vet ./...`, `go build ./...`, and repo `git diff --check` all pass.
- [verified] Client checks in `/tmp/dreamskin-client-fix.O9D3Vw`:
  `node tools/sync-runtime-assets.mjs --check`,
  `node macos/tests/theme-import-publish.test.mjs`,
  `node macos/tests/theme-package-validator.test.mjs`,
  `node macos/tests/injector-bootstrap.test.mjs`,
  `node windows/tests/injector-bootstrap.test.mjs`,
  `node macos/tests/window-readiness.test.mjs`,
  `node windows/tests/injector-window-readiness.test.mjs`,
  `NODE=$(command -v node) bash macos/tests/run-tests.sh`, and
  `git diff --check` all pass. Native SwiftPM/XCTest was the existing local
  environment skip; no local `pwsh` is installed for Windows PowerShell tests.
- [pending] Commit, push, and open draft PRs. No merge, Release publication,
  issue closure, or user-facing "fixed/retry" comment has been made.

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
## Codex 26.727.4816 Message Bridge (2026-07-31)

- [complete] Read-only inspection of the real Windows Codex 26.727.4816 task
  renderer found zero `[data-message-author-role]` nodes. The current semantic
  boundaries are four `[data-local-conversation-user-anchor]` nodes and four
  `[data-local-conversation-final-assistant]` nodes; all eight are inside the
  thread surface and none is in the sidebar.
- [complete] The shared selector contract now retains the legacy message role
  attribute and adds those two current semantic attributes. Core styling uses
  the existing public `data-ds-part="message"` bridge, and generated macOS and
  Windows selector/renderer/CSS assets are synchronized.
- [verified] Selector doctor, both renderer runtime suites, both payload
  integrity suites, runtime asset sync, JavaScript syntax, focused
  `git diff --check`, and a second real-DOM read-only cardinality check pass.
  No installed runtime, Codex process, active theme, PR, issue, commit, or push
  was changed by this focused task.
