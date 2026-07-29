#!/bin/bash

set -euo pipefail
REPOSITORY_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
. "$REPOSITORY_ROOT/macos/scripts/common-macos.sh"

fail_local_install() {
  printf 'Codex Dream Skin local engine: %s\n' "$*" >&2
  exit 1
}

[ "$(/usr/bin/uname -s)" = "Darwin" ] \
  || fail_local_install "This helper only supports macOS."

discover_codex_app
require_macos_runtime
"$NODE" "$REPOSITORY_ROOT/tools/sync-runtime-assets.mjs" --check \
  || fail_local_install "Generated macOS and Windows assets are stale. Run node tools/sync-runtime-assets.mjs first."

if codex_is_running; then
  fail_local_install "Close ChatGPT / Codex, then run this command again. The installer will reopen it automatically."
fi

printf 'Installing the verified local source tree without creating Desktop launchers...\n'
exec "$REPOSITORY_ROOT/macos/scripts/install-dream-skin-macos.sh" --no-launchers
