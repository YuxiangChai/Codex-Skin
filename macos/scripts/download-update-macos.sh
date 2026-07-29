#!/bin/bash

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
. "$SCRIPT_DIR/common-macos.sh"
OPEN_AFTER_DOWNLOAD="true"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --download-only) OPEN_AFTER_DOWNLOAD="false"; shift ;;
    *) printf 'Unknown update download argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

fail_update() {
  printf 'Codex Dream Skin update download: %s\n' "$*" >&2
  exit 1
}

ensure_state_root
[ ! -L "$STATE_ROOT" ] || fail_update "State directory cannot be a symbolic link."
UPDATE_ROOT="$STATE_ROOT/updates"
[ ! -L "$UPDATE_ROOT" ] || fail_update "Update directory cannot be a symbolic link."
/bin/mkdir -p "$UPDATE_ROOT"
/bin/chmod 700 "$UPDATE_ROOT"

STAGING_ROOT="$(/usr/bin/mktemp -d "$UPDATE_ROOT/.staging.XXXXXX")"
/bin/chmod 700 "$STAGING_ROOT"
cleanup() {
  /bin/rm -rf "$STAGING_ROOT"
}
trap cleanup EXIT

UPDATE_JSON="$("$SCRIPT_DIR/check-update-macos.sh" --json)"
UPDATE_RESPONSE="$STAGING_ROOT/update.json"
/usr/bin/printf '%s\n' "$UPDATE_JSON" > "$UPDATE_RESPONSE"
/usr/bin/plutil -convert binary1 -o /dev/null "$UPDATE_RESPONSE" \
  || fail_update "Update metadata is not valid JSON."

CURRENT_VERSION="$(/usr/bin/plutil -extract currentVersion raw -o - "$UPDATE_RESPONSE" 2>/dev/null || true)"
LATEST_VERSION="$(/usr/bin/plutil -extract latestVersion raw -o - "$UPDATE_RESPONSE" 2>/dev/null || true)"
UPDATE_AVAILABLE="$(/usr/bin/plutil -extract updateAvailable raw -o - "$UPDATE_RESPONSE" 2>/dev/null || true)"
ASSET_NAME="$(/usr/bin/plutil -extract assetName raw -o - "$UPDATE_RESPONSE" 2>/dev/null || true)"
ASSET_URL="$(/usr/bin/plutil -extract assetUrl raw -o - "$UPDATE_RESPONSE" 2>/dev/null || true)"
ASSET_BYTES="$(/usr/bin/plutil -extract assetBytes raw -o - "$UPDATE_RESPONSE" 2>/dev/null || true)"
ASSET_SHA256="$(/usr/bin/plutil -extract assetSha256 raw -o - "$UPDATE_RESPONSE" 2>/dev/null || true)"

[ "$UPDATE_AVAILABLE" = "true" ] \
  || fail_update "The installed version ${CURRENT_VERSION:-unknown} is already current."
LATEST_NORMALIZED="${LATEST_VERSION#v}"
printf '%s' "$LATEST_NORMALIZED" | /usr/bin/grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' \
  || fail_update "Update metadata contains an invalid version."
EXPECTED_NAME="CodexDreamSkin-v${LATEST_NORMALIZED}.dmg"
EXPECTED_URL="https://github.com/YuxiangChai/Codex-Skin/releases/download/v${LATEST_NORMALIZED}/${EXPECTED_NAME}"
[ "$ASSET_NAME" = "$EXPECTED_NAME" ] && [ "$ASSET_URL" = "$EXPECTED_URL" ] \
  || fail_update "Update metadata does not match the personal release channel."
case "$ASSET_BYTES" in ''|*[!0-9]*) fail_update "Update metadata contains an invalid size." ;; esac
[ "$ASSET_BYTES" -gt 0 ] && [ "$ASSET_BYTES" -le 134217728 ] \
  || fail_update "Update package is outside the allowed size."
printf '%s' "$ASSET_SHA256" | /usr/bin/grep -Eq '^[0-9a-f]{64}$' \
  || fail_update "Update metadata contains an invalid SHA-256."

STAGED_DMG="$STAGING_ROOT/$ASSET_NAME"
/usr/bin/curl \
  --proto '=https' \
  --proto-redir '=https' \
  --tlsv1.2 \
  --fail \
  --silent \
  --show-error \
  --location \
  --max-redirs 5 \
  --connect-timeout 10 \
  --max-time 900 \
  --max-filesize 134217728 \
  --user-agent "CodexDreamSkin/${CURRENT_VERSION#v}" \
  "$ASSET_URL" \
  --output "$STAGED_DMG" \
  || fail_update "Could not download the update package."

DOWNLOADED_BYTES="$(/usr/bin/stat -f '%z' "$STAGED_DMG" 2>/dev/null || true)"
[ "$DOWNLOADED_BYTES" = "$ASSET_BYTES" ] \
  || fail_update "Downloaded package size does not match the release metadata."
DOWNLOADED_SHA256="$(/usr/bin/shasum -a 256 "$STAGED_DMG" | /usr/bin/awk '{print $1}')"
[ "$DOWNLOADED_SHA256" = "$ASSET_SHA256" ] \
  || fail_update "Downloaded package SHA-256 does not match the release metadata."

FINAL_DMG="$UPDATE_ROOT/$ASSET_NAME"
[ ! -L "$FINAL_DMG" ] || fail_update "Refusing to replace a linked update package."
PREVIOUS_DMG=""
if [ -e "$FINAL_DMG" ]; then
  PREVIOUS_DMG="$UPDATE_ROOT/.previous.${ASSET_NAME}.$$"
  /bin/mv "$FINAL_DMG" "$PREVIOUS_DMG" \
    || fail_update "Could not stage the previous update package."
fi
if ! /bin/mv "$STAGED_DMG" "$FINAL_DMG"; then
  [ -z "$PREVIOUS_DMG" ] || /bin/mv "$PREVIOUS_DMG" "$FINAL_DMG" 2>/dev/null || true
  fail_update "Could not publish the verified update package."
fi
/bin/chmod 600 "$FINAL_DMG"
[ -z "$PREVIOUS_DMG" ] || /bin/rm -f "$PREVIOUS_DMG"

if [ "$OPEN_AFTER_DOWNLOAD" = "true" ]; then
  /usr/bin/open "$FINAL_DMG" \
    || fail_update "The package was verified but could not be opened."
fi
printf 'Verified update %s is ready at %s\n' "$LATEST_VERSION" "$FINAL_DMG"
