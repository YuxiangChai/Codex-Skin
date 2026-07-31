#!/bin/bash

# Installs a previously verified Codex Dream Skin app bundle without privileges.
# The current app, replacement, and rollback copy must all live on the same
# writable volume so the final swaps are rename-based and reversible.

set -euo pipefail

EXPECTED_BUNDLE_ID="cc.dreamskin.menubar"
EXPECTED_APP_NAME="Codex Dream Skin.app"
STATE_ROOT="$HOME/Library/Application Support/CodexDreamSkinStudio"
PENDING_PATH="$STATE_ROOT/updates/pending-self-update.plist"
CURRENT_APP=""
STAGED_APP=""
PARENT_PID=""
TARGET_VERSION=""
EXECUTE="false"
READY_FILE=""
ALLOW_ADHOC_ASSISTED="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --execute) EXECUTE="true"; shift ;;
    --current-app) CURRENT_APP="${2:-}"; shift 2 ;;
    --staged-app) STAGED_APP="${2:-}"; shift 2 ;;
    --parent-pid) PARENT_PID="${2:-}"; shift 2 ;;
    --target-version) TARGET_VERSION="${2:-}"; shift 2 ;;
    --ready-file) READY_FILE="${2:-}"; shift 2 ;;
    --allow-ad-hoc-assisted) ALLOW_ADHOC_ASSISTED="true"; shift ;;
    *) printf 'Unknown self-update argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

fail_update() {
  printf 'Codex Dream Skin self-update: %s\n' "$*" >&2
  exit 1
}

version_is_valid() {
  printf '%s' "$1" | /usr/bin/grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?$'
}

bundle_field() {
  /usr/bin/plutil -extract "$2" raw -o - "$1/Contents/Info.plist" 2>/dev/null
}

validate_app() {
  local app="$1"
  local expected_version="$2"
  local bundle_id=""
  local app_version=""
  local engine_version=""
  [ -d "$app" ] && [ ! -L "$app" ] \
    || fail_update "App bundle is missing or linked: $app"
  [ "$(/usr/bin/basename "$app")" = "$EXPECTED_APP_NAME" ] \
    || fail_update "Unexpected app bundle name."
  [ -f "$app/Contents/Info.plist" ] && [ ! -L "$app/Contents/Info.plist" ] \
    || fail_update "App metadata is missing or linked."
  bundle_id="$(bundle_field "$app" CFBundleIdentifier || true)"
  [ "$bundle_id" = "$EXPECTED_BUNDLE_ID" ] \
    || fail_update "App bundle identifier does not match."
  app_version="$(bundle_field "$app" CFBundleShortVersionString || true)"
  version_is_valid "$app_version" || fail_update "App version is invalid."
  [ -z "$expected_version" ] || [ "$app_version" = "$expected_version" ] \
    || fail_update "App version does not match the requested update."
  [ -f "$app/Contents/Resources/engine/VERSION" ] \
    && [ ! -L "$app/Contents/Resources/engine/VERSION" ] \
    || fail_update "Bundled engine version is missing or linked."
  engine_version="$(/usr/bin/tr -d '[:space:]' < "$app/Contents/Resources/engine/VERSION")"
  [ "$engine_version" = "$app_version" ] \
    || fail_update "App and bundled engine versions do not match."
  /usr/bin/codesign --verify --deep --strict "$app" \
    || fail_update "App code signature validation failed."
}

signing_team_id() {
  /usr/bin/codesign -dvv "$1" 2>&1 \
    | /usr/bin/sed -n 's/^TeamIdentifier=//p' \
    | /usr/bin/head -1
}

case "$CURRENT_APP" in /*) ;; *) fail_update "Current app path must be absolute." ;; esac
case "$STAGED_APP" in /*) ;; *) fail_update "Staged app path must be absolute." ;; esac
case "$PARENT_PID" in ''|*[!0-9]*) fail_update "Parent process ID is invalid." ;; esac
version_is_valid "$TARGET_VERSION" || fail_update "Target version is invalid."
[ "$PARENT_PID" -gt 1 ] || fail_update "Parent process ID is invalid."
if [ "$EXECUTE" = "true" ]; then
  case "$READY_FILE" in
    "$STATE_ROOT/updates/.self-update-ready."*) ;;
    *) fail_update "Update readiness path is invalid." ;;
  esac
  [ ! -L "$READY_FILE" ] || fail_update "Update readiness path cannot be linked."
fi

CURRENT_APP="$(cd "$(/usr/bin/dirname "$CURRENT_APP")" && pwd -P)/$EXPECTED_APP_NAME"
STAGED_APP="$(cd "$(/usr/bin/dirname "$STAGED_APP")" && pwd -P)/$EXPECTED_APP_NAME"
validate_app "$CURRENT_APP" ""
validate_app "$STAGED_APP" "$TARGET_VERSION"
CURRENT_TEAM_ID="$(signing_team_id "$CURRENT_APP")"
STAGED_TEAM_ID="$(signing_team_id "$STAGED_APP")"
UPDATE_MODE=""
QUARANTINE_VALUE=""
if [ -n "$CURRENT_TEAM_ID" ]; then
  [ "$STAGED_TEAM_ID" = "$CURRENT_TEAM_ID" ] \
    || fail_update "The update was not signed by the same Apple Developer team."
  /usr/sbin/spctl --assess --type execute "$STAGED_APP" \
    || fail_update "Gatekeeper did not accept the staged update."
  UPDATE_MODE="signed"
else
  [ "$ALLOW_ADHOC_ASSISTED" = "true" ] \
    || fail_update "This ad-hoc app requires an assisted update with Gatekeeper approval."
  [ -z "$STAGED_TEAM_ID" ] \
    || fail_update "An ad-hoc current app cannot automatically trust a differently signed update."
  /usr/bin/codesign -dvv "$CURRENT_APP" 2>&1 | /usr/bin/grep -F -q 'Signature=adhoc' \
    || fail_update "The current app has an unsupported signing state."
  /usr/bin/codesign -dvv "$STAGED_APP" 2>&1 | /usr/bin/grep -F -q 'Signature=adhoc' \
    || fail_update "The staged app has an unsupported signing state."
  QUARANTINE_VALUE="$(/usr/bin/xattr -p com.apple.quarantine "$CURRENT_APP" 2>/dev/null || true)"
  printf '%s' "$QUARANTINE_VALUE" \
    | /usr/bin/grep -Eq '^[0-9A-Fa-f]{4};[0-9A-Fa-f]+;[^;\r\n]{1,64};[0-9A-Fa-f-]{0,64}$' \
    || fail_update "The current app has no reusable Gatekeeper quarantine record; use the DMG once for this update."
  UPDATE_MODE="ad-hoc-assisted"
fi

CURRENT_VERSION="$(bundle_field "$CURRENT_APP" CFBundleShortVersionString)"
[ "$CURRENT_VERSION" != "$TARGET_VERSION" ] \
  || fail_update "Current and target versions are identical."

CURRENT_EXECUTABLE="$CURRENT_APP/Contents/MacOS/CodexDreamSkinMenuBar"
PARENT_COMMAND="$(/bin/ps -p "$PARENT_PID" -o command= 2>/dev/null || true)"
case "$PARENT_COMMAND" in
  "$CURRENT_EXECUTABLE"|"$CURRENT_EXECUTABLE "* ) ;;
  *) fail_update "Parent process does not belong to the current app." ;;
esac

DESTINATION_PARENT="$(/usr/bin/dirname "$CURRENT_APP")"
[ -d "$DESTINATION_PARENT" ] && [ ! -L "$DESTINATION_PARENT" ] \
  || fail_update "Application destination is missing or linked."
[ -w "$DESTINATION_PARENT" ] \
  || fail_update "The application folder is not writable by the current user."

if [ "$EXECUTE" != "true" ]; then
  printf 'Self-update preflight passed for v%s.\n' "$TARGET_VERSION"
  exit 0
fi

# The GUI exits only after this helper has passed all preflight checks.
/usr/bin/printf '%s\n' "$$" > "$READY_FILE"
/bin/chmod 600 "$READY_FILE"
cleanup_ready() {
  [ -z "$READY_FILE" ] || /bin/rm -f "$READY_FILE"
}
trap cleanup_ready EXIT
attempts=0
while /bin/kill -0 "$PARENT_PID" 2>/dev/null; do
  attempts=$((attempts + 1))
  [ "$attempts" -le 300 ] || fail_update "The running app did not exit in time."
  /bin/sleep 0.1
done
/bin/rm -f "$READY_FILE"

DESTINATION_STAGE_ROOT="$DESTINATION_PARENT/.dreamskin-update.$$"
DESTINATION_STAGE="$DESTINATION_STAGE_ROOT/$EXPECTED_APP_NAME"
BACKUP_APP="$DESTINATION_PARENT/.Codex Dream Skin.backup.$$"
FAILED_APP="$DESTINATION_PARENT/.Codex Dream Skin.failed.$$"

cleanup_stage() {
  [ ! -e "$DESTINATION_STAGE_ROOT" ] || /bin/rm -rf "$DESTINATION_STAGE_ROOT"
  cleanup_ready
}
trap cleanup_stage EXIT

/bin/mkdir "$DESTINATION_STAGE_ROOT" \
  || fail_update "Could not create an update staging directory."
/usr/bin/ditto "$STAGED_APP" "$DESTINATION_STAGE" \
  || fail_update "Could not copy the verified update beside the current app."
validate_app "$DESTINATION_STAGE" "$TARGET_VERSION"

/bin/mkdir -p "$STATE_ROOT/updates"
/bin/chmod 700 "$STATE_ROOT" "$STATE_ROOT/updates"
TEMP_PENDING="$PENDING_PATH.$$.tmp"
/bin/rm -f "$TEMP_PENDING"
/usr/bin/plutil -create xml1 "$TEMP_PENDING"
/usr/bin/plutil -insert targetVersion -string "$TARGET_VERSION" "$TEMP_PENDING"
/usr/bin/plutil -insert currentAppPath -string "$CURRENT_APP" "$TEMP_PENDING"
/usr/bin/plutil -insert backupAppPath -string "$BACKUP_APP" "$TEMP_PENDING"
/bin/chmod 600 "$TEMP_PENDING"
/bin/mv "$TEMP_PENDING" "$PENDING_PATH"

rollback() {
  local reason="$1"
  /bin/rm -rf "$FAILED_APP" 2>/dev/null || true
  if [ -e "$CURRENT_APP" ]; then
    /bin/mv "$CURRENT_APP" "$FAILED_APP" 2>/dev/null || true
  fi
  if [ -e "$BACKUP_APP" ]; then
    /bin/mv "$BACKUP_APP" "$CURRENT_APP" \
      || fail_update "$reason; rollback also failed."
  fi
  /bin/rm -f "$PENDING_PATH"
  /usr/bin/open "$CURRENT_APP" >/dev/null 2>&1 || true
  fail_update "$reason; the previous app was restored."
}

/bin/mv "$CURRENT_APP" "$BACKUP_APP" \
  || fail_update "Could not preserve the current app for rollback."
if ! /bin/mv "$DESTINATION_STAGE" "$CURRENT_APP"; then
  /bin/mv "$BACKUP_APP" "$CURRENT_APP" 2>/dev/null || true
  /bin/rm -f "$PENDING_PATH"
  fail_update "Could not install the staged app; the previous app was restored."
fi
/bin/rmdir "$DESTINATION_STAGE_ROOT" 2>/dev/null || true

if [ "$UPDATE_MODE" = "ad-hoc-assisted" ]; then
  # Preserve the existing download provenance on the replacement. This does
  # not remove or bypass quarantine: it deliberately forces macOS to assess
  # the new ad-hoc bundle and expose “仍要打开” in Privacy & Security.
  /usr/bin/xattr -w com.apple.quarantine "$QUARANTINE_VALUE" "$CURRENT_APP" \
    || rollback "The Gatekeeper quarantine record could not be preserved"
  /usr/bin/open "$CURRENT_APP" >/dev/null 2>&1 || true
  /bin/sleep 1
  if [ -e "$PENDING_PATH" ]; then
    /usr/bin/open \
      'x-apple.systempreferences:com.apple.preference.security?General' \
      >/dev/null 2>&1 || true
    printf 'Codex Dream Skin v%s is installed and waiting for Gatekeeper approval.\n' \
      "$TARGET_VERSION"
  else
    printf 'Codex Dream Skin v%s launched without an additional approval step.\n' \
      "$TARGET_VERSION"
  fi
  exit 0
fi

/usr/bin/open "$CURRENT_APP" >/dev/null 2>&1 \
  || rollback "The updated app could not be opened"

# The new app removes the pending marker only after it verifies that it is
# running from the expected destination and version. No acknowledgement means
# startup failed, so restore the previous bundle.
attempts=0
while [ -e "$PENDING_PATH" ] && [ "$attempts" -lt 300 ]; do
  attempts=$((attempts + 1))
  /bin/sleep 0.1
done
[ ! -e "$PENDING_PATH" ] || rollback "The updated app did not acknowledge startup"

/bin/rm -rf "$BACKUP_APP" "$FAILED_APP" 2>/dev/null || true
printf 'Codex Dream Skin updated to v%s.\n' "$TARGET_VERSION"
