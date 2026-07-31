#!/bin/bash

set -euo pipefail
export LC_ALL=C
export LANG=C
export LC_CTYPE=C
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
VERSION="$(/usr/bin/tr -d '[:space:]' < "$ROOT/VERSION")"
RELEASE_DIR="$ROOT/release"
DMG="$RELEASE_DIR/CodexDreamSkin-v$VERSION.dmg"
SKIP_TESTS="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --skip-tests) SKIP_TESTS="true"; shift ;;
    *) printf 'Unknown DMG build argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

if [ "$SKIP_TESTS" != "true" ]; then
  "$ROOT/tests/run-tests.sh"
fi

TMP="$(/usr/bin/mktemp -d /tmp/codex-dream-skin-dmg.XXXXXX)"
MOUNT=""
cleanup() {
  if [ -n "$MOUNT" ] && /sbin/mount | /usr/bin/grep -F -q " on $MOUNT "; then
    /usr/bin/hdiutil detach "$MOUNT" -quiet >/dev/null 2>&1 \
      || /usr/bin/hdiutil detach "$MOUNT" -force -quiet >/dev/null 2>&1 \
      || true
  fi
  /bin/rm -rf "$TMP"
}
trap cleanup EXIT
APP="$TMP/Codex Dream Skin.app"
STAGE="$TMP/stage"
/bin/mkdir -p "$STAGE" "$RELEASE_DIR"
"$ROOT/scripts/build-menubar-app.sh" --skip-tests --output "$APP"

if [ -n "${DREAMSKIN_NOTARY_PROFILE:-}" ]; then
  [ -n "${DREAMSKIN_CODESIGN_IDENTITY:-}" ] \
    || { printf 'DREAMSKIN_NOTARY_PROFILE requires DREAMSKIN_CODESIGN_IDENTITY.\n' >&2; exit 1; }
  APP_ARCHIVE="$TMP/CodexDreamSkin-app.zip"
  /usr/bin/ditto -c -k --keepParent "$APP" "$APP_ARCHIVE"
  NOTARY_KEYCHAIN_ARGS=()
  if [ -n "${DREAMSKIN_NOTARY_KEYCHAIN:-}" ]; then
    NOTARY_KEYCHAIN_ARGS=(--keychain "$DREAMSKIN_NOTARY_KEYCHAIN")
  fi
  /usr/bin/xcrun notarytool submit "$APP_ARCHIVE" \
    --keychain-profile "$DREAMSKIN_NOTARY_PROFILE" \
    "${NOTARY_KEYCHAIN_ARGS[@]}" --wait
  /usr/bin/xcrun stapler staple "$APP"
  /usr/bin/xcrun stapler validate "$APP"
  /usr/sbin/spctl --assess --type execute "$APP"
fi
/usr/bin/ditto "$APP" "$STAGE/Codex Dream Skin.app"
/bin/ln -s /Applications "$STAGE/Applications"

/bin/rm -f "$DMG" "$DMG.sha256"
LC_ALL=C LANG=C /usr/bin/hdiutil create -quiet -ov -format UDZO \
  -volname "Codex Dream Skin" -srcfolder "$STAGE" "$DMG"
[ -s "$DMG" ] || { printf 'DMG was not created: %s\n' "$DMG" >&2; exit 1; }

if [ -n "${DREAMSKIN_CODESIGN_IDENTITY:-}" ]; then
  CODESIGN_KEYCHAIN_ARGS=()
  if [ -n "${DREAMSKIN_BUILD_KEYCHAIN:-}" ]; then
    CODESIGN_KEYCHAIN_ARGS=(--keychain "$DREAMSKIN_BUILD_KEYCHAIN")
  fi
  /usr/bin/codesign --force \
    --sign "$DREAMSKIN_CODESIGN_IDENTITY" \
    --timestamp \
    "${CODESIGN_KEYCHAIN_ARGS[@]}" \
    "$DMG"
  /usr/bin/codesign --verify --strict "$DMG"
fi
if [ -n "${DREAMSKIN_NOTARY_PROFILE:-}" ]; then
  /usr/bin/xcrun notarytool submit "$DMG" \
    --keychain-profile "$DREAMSKIN_NOTARY_PROFILE" \
    "${NOTARY_KEYCHAIN_ARGS[@]}" --wait
  /usr/bin/xcrun stapler staple "$DMG"
  /usr/bin/xcrun stapler validate "$DMG"
  /usr/sbin/spctl --assess --type open --context context:primary-signature "$DMG"
fi

MOUNT="$TMP/mount"
/bin/mkdir -p "$MOUNT"
/usr/bin/hdiutil attach -readonly -nobrowse -mountpoint "$MOUNT" "$DMG" >/dev/null
MOUNTED_APP="$MOUNT/Codex Dream Skin.app"
[ -d "$MOUNTED_APP" ] || { printf 'DMG does not contain the app bundle.\n' >&2; exit 1; }
[ -L "$MOUNT/Applications" ] \
  && [ "$(/usr/bin/readlink "$MOUNT/Applications")" = "/Applications" ] \
  || { printf 'DMG does not contain the Applications link.\n' >&2; exit 1; }
/usr/bin/codesign --verify --deep --strict "$MOUNTED_APP"
[ "$(/usr/bin/plutil -extract CFBundleShortVersionString raw -o - "$MOUNTED_APP/Contents/Info.plist")" = "$VERSION" ] \
  || { printf 'Mounted app version does not match VERSION.\n' >&2; exit 1; }
[ "$(/usr/bin/plutil -extract CFBundleURLTypes.0.CFBundleURLSchemes.0 raw -o - "$MOUNTED_APP/Contents/Info.plist")" = "dreamskin" ] \
  || { printf 'Mounted app does not register the dreamskin URL scheme.\n' >&2; exit 1; }
[ "$(/usr/bin/tr -d '[:space:]' < "$MOUNTED_APP/Contents/Resources/engine/VERSION")" = "$VERSION" ] \
  || { printf 'Mounted engine version does not match VERSION.\n' >&2; exit 1; }
[ -f "$MOUNTED_APP/Contents/Resources/LICENSE.txt" ] \
  && [ -f "$MOUNTED_APP/Contents/Resources/NOTICE.md" ] \
  || { printf 'Mounted app is missing license notices.\n' >&2; exit 1; }
# The shipped DMG is the only artifact users ever see, so the icon contract is
# verified here as well as at generation time: a trap that swallowed the icon
# builder's exit code once shipped an iconless DMG (#220).
MOUNTED_ICON_NAME="$(/usr/bin/plutil -extract CFBundleIconFile raw -o - \
  "$MOUNTED_APP/Contents/Info.plist" 2>/dev/null)" \
  || { printf 'Mounted app does not declare CFBundleIconFile.\n' >&2; exit 1; }
[ -n "$MOUNTED_ICON_NAME" ] \
  || { printf 'Mounted app declares an empty CFBundleIconFile.\n' >&2; exit 1; }
MOUNTED_ICON="$MOUNTED_APP/Contents/Resources/${MOUNTED_ICON_NAME%.icns}.icns"
[ -s "$MOUNTED_ICON" ] \
  || { printf 'Mounted app icon is missing or empty: %s\n' "$MOUNTED_ICON" >&2; exit 1; }
[ -f "$MOUNTED_APP/Contents/Resources/engine/presets/preset-iron-man/theme.json" ] \
  && [ -f "$MOUNTED_APP/Contents/Resources/engine/presets/preset-iron-man/theme.css" ] \
  && [ -f "$MOUNTED_APP/Contents/Resources/engine/presets/preset-iron-man/background.jpg" ] \
  || { printf 'Mounted app is missing the complete Iron Man release preset.\n' >&2; exit 1; }
MOUNTED_PRESET_COUNT="$(/usr/bin/find "$MOUNTED_APP/Contents/Resources/engine/presets" \
  -mindepth 1 -maxdepth 1 -type d -name 'preset-*' | /usr/bin/wc -l | /usr/bin/tr -d ' ')"
[ "$MOUNTED_PRESET_COUNT" -eq 1 ] \
  || { printf 'Mounted app must contain exactly one public release preset.\n' >&2; exit 1; }
MOUNTED_ENGINE="$MOUNTED_APP/Contents/Resources/engine"
[ -f "$MOUNTED_ENGINE/assets/selectors.json" ] \
  || { printf 'Mounted app is missing the selector contract.\n' >&2; exit 1; }
for runtime_script in apply-community-theme-macos.sh download-update-macos.sh \
  install-update-macos.sh repair-engine-macos.sh \
  snapshot-active-theme-macos.sh theme-switch-lock-macos.sh; do
  [ -x "$MOUNTED_ENGINE/scripts/$runtime_script" ] \
    || { printf 'Mounted runtime script is missing or not executable: %s\n' "$runtime_script" >&2; exit 1; }
done
[ -f "$MOUNTED_ENGINE/scripts/theme-content-fingerprint.mjs" ] \
  && [ ! -x "$MOUNTED_ENGINE/scripts/theme-content-fingerprint.mjs" ] \
  || { printf 'Mounted fingerprint helper has unsafe or missing permissions.\n' >&2; exit 1; }
for excluded in build-client-release.sh build-dmg.sh build-menubar-app.sh build-release.sh \
  generate-app-icon.sh install-menubar-macos.sh prepare-standalone-docs.sh; do
  [ ! -e "$MOUNTED_APP/Contents/Resources/engine/scripts/$excluded" ] \
    || { printf 'Mounted runtime contains build-only script: %s\n' "$excluded" >&2; exit 1; }
done
MOUNTED_ARCHS="$(/usr/bin/lipo -archs "$MOUNTED_APP/Contents/MacOS/CodexDreamSkinMenuBar")"
read -r -a EXPECTED_ARCHS <<< "${DREAMSKIN_ARCHS:-arm64 x86_64}"
for arch in "${EXPECTED_ARCHS[@]}"; do
  case " $MOUNTED_ARCHS " in
    *" $arch "*) ;;
    *) printf 'Mounted app is missing architecture %s: %s\n' "$arch" "$MOUNTED_ARCHS" >&2; exit 1 ;;
  esac
done
/usr/bin/hdiutil detach "$MOUNT" -quiet
MOUNT=""

SHA256="$(/usr/bin/shasum -a 256 "$DMG" | /usr/bin/awk '{print $1}')"
/usr/bin/printf '%s  %s\n' "$SHA256" "$(basename "$DMG")" > "$DMG.sha256"
/usr/bin/printf 'Created %s\nSHA-256 %s\n' "$DMG" "$SHA256"
