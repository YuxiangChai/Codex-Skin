#!/bin/bash

# Reinstall the engine embedded in the menu bar app while preserving the user's
# theme library. The caller must obtain explicit confirmation before invoking
# this script because a running ChatGPT window is restarted once.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
. "$SCRIPT_DIR/common-macos.sh"

RESTART_IF_RUNNING="false"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --restart-if-running) RESTART_IF_RUNNING="true"; shift ;;
    *) fail "Unknown engine repair argument: $1" ;;
  esac
done

discover_codex_app
require_signed_node_runtime
WAS_RUNNING="false"
if codex_is_running; then
  WAS_RUNNING="true"
  [ "$RESTART_IF_RUNNING" = "true" ] \
    || fail "ChatGPT is running; repair requires explicit restart permission."
fi
if [ -f "$STATE_PATH" ]; then
  stop_recorded_injector || fail "Could not stop the existing skin injector."
fi
release_codex_launchd_job || true
if [ "$WAS_RUNNING" = "true" ]; then
  stop_codex true
fi

"$SCRIPT_DIR/install-dream-skin-macos.sh" --no-launchers --no-launch

if [ "$WAS_RUNNING" = "true" ]; then
  "$INSTALL_ROOT/scripts/start-dream-skin-macos.sh"
fi

printf 'Codex Dream Skin engine %s was verified and reinstalled; saved themes were preserved.\n' \
  "$SKIN_VERSION"
