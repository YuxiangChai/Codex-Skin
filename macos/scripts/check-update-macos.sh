#!/bin/bash

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
. "$ROOT/scripts/localization-macos.sh"
VERSION_PATH="$ROOT/VERSION"
REPOSITORY="YuxiangChai/Codex-Skin"
RELEASE_URL="https://github.com/$REPOSITORY/releases/latest"
JSON="false"
INTERACTIVE="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --json) JSON="true"; shift ;;
    --interactive) INTERACTIVE="true"; shift ;;
    *) printf 'Unknown update argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done

fail() {
  printf 'Codex Dream Skin update check: %s\n' "$*" >&2
  exit 1
}

normalize_version() {
  local value="$1"
  value="${value#v}"
  value="${value#V}"
  printf '%s' "$value" | /usr/bin/grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?$' \
    || return 1
  printf '%s\n' "$value"
}

version_is_newer() {
  local latest="$1"
  local current="$2"
  local latest_major latest_minor latest_patch latest_revision
  local current_major current_minor current_patch current_revision
  IFS=. read -r latest_major latest_minor latest_patch latest_revision <<< "$latest"
  IFS=. read -r current_major current_minor current_patch current_revision <<< "$current"
  latest_revision="${latest_revision:-0}"
  current_revision="${current_revision:-0}"
  if [ "$latest_major" -ne "$current_major" ]; then
    [ "$latest_major" -gt "$current_major" ]
  elif [ "$latest_minor" -ne "$current_minor" ]; then
    [ "$latest_minor" -gt "$current_minor" ]
  elif [ "$latest_patch" -ne "$current_patch" ]; then
    [ "$latest_patch" -gt "$current_patch" ]
  else
    [ "$latest_revision" -gt "$current_revision" ]
  fi
}

[ -f "$VERSION_PATH" ] || fail "Installed VERSION file is missing: $VERSION_PATH"
CURRENT_RAW="$(/usr/bin/tr -d '[:space:]' < "$VERSION_PATH")"
CURRENT_VERSION="$(normalize_version "$CURRENT_RAW")" \
  || fail "Installed version is invalid: $CURRENT_RAW"

TMP="$(/usr/bin/mktemp -d /tmp/codex-dream-skin-update.XXXXXX)"
trap '/bin/rm -rf "$TMP"' EXIT
RESPONSE="$TMP/release.json"
if [ -n "${CODEX_DREAM_SKIN_TEST_RESPONSE_FILE:-}" ]; then
  [ -f "$CODEX_DREAM_SKIN_TEST_RESPONSE_FILE" ] \
    || fail "Test response does not exist."
  /bin/cp "$CODEX_DREAM_SKIN_TEST_RESPONSE_FILE" "$RESPONSE"
else
  /usr/bin/curl --proto '=https' --tlsv1.2 --fail --silent --show-error \
    --connect-timeout 8 --max-time 45 \
    --retry 3 --retry-all-errors --retry-delay 1 --retry-max-time 45 \
    --max-filesize 1048576 \
    --header 'Accept: application/vnd.github+json' \
    --header 'X-GitHub-Api-Version: 2022-11-28' \
    --user-agent 'CodexDreamSkin-UpdateCheck' \
    "https://api.github.com/repos/$REPOSITORY/releases/latest" \
    --output "$RESPONSE" \
    || fail "Could not connect to GitHub."
fi

RESPONSE_BYTES="$(/usr/bin/stat -f '%z' "$RESPONSE")"
[ "$RESPONSE_BYTES" -gt 0 ] && [ "$RESPONSE_BYTES" -le 1048576 ] \
  || fail "GitHub returned an invalid response size."
LATEST_TAG="$(/usr/bin/plutil -extract tag_name raw -o - "$RESPONSE" 2>/dev/null || true)"
[ -n "$LATEST_TAG" ] || fail "GitHub response does not contain a release tag."
LATEST_VERSION="$(normalize_version "$LATEST_TAG")" \
  || fail "GitHub returned an unsupported release tag: $LATEST_TAG"
ASSET_NAME="CodexDreamSkin-v${LATEST_VERSION}.dmg"
ASSET_URL_EXPECTED="https://github.com/${REPOSITORY}/releases/download/v${LATEST_VERSION}/${ASSET_NAME}"
ASSET_URL=""
ASSET_BYTES=""
ASSET_SHA256=""
ASSET_INDEX=0
while [ "$ASSET_INDEX" -lt 64 ]; do
  CANDIDATE_NAME="$(/usr/bin/plutil -extract "assets.${ASSET_INDEX}.name" raw -o - "$RESPONSE" 2>/dev/null || true)"
  if [ "$CANDIDATE_NAME" = "$ASSET_NAME" ]; then
    ASSET_URL="$(/usr/bin/plutil -extract "assets.${ASSET_INDEX}.browser_download_url" raw -o - "$RESPONSE" 2>/dev/null || true)"
    ASSET_BYTES="$(/usr/bin/plutil -extract "assets.${ASSET_INDEX}.size" raw -o - "$RESPONSE" 2>/dev/null || true)"
    ASSET_DIGEST="$(/usr/bin/plutil -extract "assets.${ASSET_INDEX}.digest" raw -o - "$RESPONSE" 2>/dev/null || true)"
    ASSET_SHA256="${ASSET_DIGEST#sha256:}"
    break
  fi
  ASSET_INDEX=$((ASSET_INDEX + 1))
done
[ "$ASSET_URL" = "$ASSET_URL_EXPECTED" ] \
  || fail "GitHub release does not contain the expected macOS installer."
case "$ASSET_BYTES" in ''|*[!0-9]*) fail "GitHub returned an invalid installer size." ;; esac
[ "$ASSET_BYTES" -gt 0 ] && [ "$ASSET_BYTES" -le 134217728 ] \
  || fail "GitHub returned an unsupported installer size."
printf '%s' "$ASSET_SHA256" | /usr/bin/grep -Eq '^[0-9a-f]{64}$' \
  || fail "GitHub release does not contain a valid installer digest."

UPDATE_AVAILABLE="false"
if version_is_newer "$LATEST_VERSION" "$CURRENT_VERSION"; then
  UPDATE_AVAILABLE="true"
fi

if [ "$JSON" = "true" ]; then
  printf '{"currentVersion":"v%s","latestVersion":"v%s","updateAvailable":%s,"releaseUrl":"%s","assetName":"%s","assetUrl":"%s","assetBytes":%s,"assetSha256":"%s"}\n' \
    "$CURRENT_VERSION" "$LATEST_VERSION" "$UPDATE_AVAILABLE" "$RELEASE_URL" \
    "$ASSET_NAME" "$ASSET_URL" "$ASSET_BYTES" "$ASSET_SHA256"
fi

if [ "$INTERACTIVE" = "true" ]; then
  if [ "$UPDATE_AVAILABLE" = "true" ]; then
    if [ "$(dreamskin_language)" = "zh" ]; then
      UPDATE_MESSAGE="发现新版本 v${LATEST_VERSION}

当前版本为 v${CURRENT_VERSION}。"
      DOWNLOAD_LABEL="前往下载"
      LATER_LABEL="稍后"
    else
      UPDATE_MESSAGE="New version v${LATEST_VERSION} is available.

You are running v${CURRENT_VERSION}."
      DOWNLOAD_LABEL="Download"
      LATER_LABEL="Later"
    fi
    if /usr/bin/osascript - "$UPDATE_MESSAGE" "$LATER_LABEL" "$DOWNLOAD_LABEL" <<'APPLESCRIPT' >/dev/null
on run argv
  set promptText to item 1 of argv
  set laterLabel to item 2 of argv
  set downloadLabel to item 3 of argv
  display dialog promptText buttons {laterLabel, downloadLabel} default button downloadLabel cancel button laterLabel with title "Codex Dream Skin"
end run
APPLESCRIPT
    then
      "$ROOT/scripts/download-update-macos.sh"
    fi
  else
    if [ "$(dreamskin_language)" = "zh" ]; then
      CURRENT_MESSAGE="当前已是最新版本 v${CURRENT_VERSION}"
    else
      CURRENT_MESSAGE="Codex Dream Skin v${CURRENT_VERSION} is up to date."
    fi
    /usr/bin/osascript - "$CURRENT_MESSAGE" "$(dreamskin_text ok 2>/dev/null || /usr/bin/printf OK)" <<'APPLESCRIPT' >/dev/null
on run argv
  display alert "Codex Dream Skin" message (item 1 of argv) buttons {(item 2 of argv)}
end run
APPLESCRIPT
  fi
fi

if [ "$JSON" != "true" ] && [ "$INTERACTIVE" != "true" ]; then
  printf 'v%s -> v%s; update=%s\n' "$CURRENT_VERSION" "$LATEST_VERSION" "$UPDATE_AVAILABLE"
fi
