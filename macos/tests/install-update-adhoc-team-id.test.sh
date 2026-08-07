#!/bin/bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
INSTALLER="$ROOT/scripts/install-update-macos.sh"
TEMP_ROOT="$(/usr/bin/mktemp -d "${TMPDIR:-/tmp}/dreamskin-adhoc-team.XXXXXX")"
trap '/bin/rm -rf "$TEMP_ROOT"' EXIT

# Exercise the production parser against a real ad-hoc signature. Recent
# codesign versions print `TeamIdentifier=not set`; that must select the
# assisted path, which is represented by an empty normalized identifier.
/bin/cp /usr/bin/true "$TEMP_ROOT/adhoc"
/usr/bin/codesign --force --sign - "$TEMP_ROOT/adhoc" >/dev/null 2>&1

extract_function() {
  /usr/bin/awk -v function_name="$1" '
  $0 == function_name "() {" { capture = 1 }
  capture { print }
  capture && /^}/ { exit }
' "$INSTALLER"
}

TEAM_FUNCTION_SOURCE="$(extract_function signing_team_id)"
SIGNATURE_FUNCTION_SOURCE="$(extract_function signature_type)"
QUARANTINE_FUNCTION_SOURCE="$(extract_function quarantine_is_reusable)"
ACK_FUNCTION_SOURCE="$(extract_function wait_for_update_acknowledgement)"
[ -n "$TEAM_FUNCTION_SOURCE" ] && [ -n "$SIGNATURE_FUNCTION_SOURCE" ] \
  && [ -n "$QUARANTINE_FUNCTION_SOURCE" ] && [ -n "$ACK_FUNCTION_SOURCE" ] || {
  printf 'Could not extract signing helpers from the installer.\n' >&2
  exit 1
}
eval "$TEAM_FUNCTION_SOURCE"
eval "$SIGNATURE_FUNCTION_SOURCE"
eval "$QUARANTINE_FUNCTION_SOURCE"
eval "$ACK_FUNCTION_SOURCE"

RAW_TEAM_ID="$(/usr/bin/codesign -dvv "$TEMP_ROOT/adhoc" 2>&1 \
  | /usr/bin/sed -n 's/^TeamIdentifier=//p' \
  | /usr/bin/head -1)"
[ "$RAW_TEAM_ID" = "not set" ] || {
  printf 'Expected the ad-hoc fixture to report TeamIdentifier=not set, got: %s\n' \
    "$RAW_TEAM_ID" >&2
  exit 1
}
[ -z "$(signing_team_id "$TEMP_ROOT/adhoc")" ] || {
  printf 'Ad-hoc TeamIdentifier=not set was not normalized to empty.\n' >&2
  exit 1
}
[ "$(signature_type "$TEMP_ROOT/adhoc")" = "adhoc" ] || {
  printf 'The ad-hoc signature type was not parsed exactly.\n' >&2
  exit 1
}
quarantine_is_reusable \
  '03c1;6a6c4d18;Chrome;CE1E0128-1904-44B3-804E-C530E0BE7A24' || {
  printf 'A valid Chrome quarantine record was rejected.\n' >&2
  exit 1
}
if quarantine_is_reusable $'03c1;6a6c4d18;Chrome\nInjected;CE1E0128'; then
  printf 'A quarantine record containing a control character was accepted.\n' >&2
  exit 1
fi
if quarantine_is_reusable '03c1;6a6c4d18;Chrome;Injected;CE1E0128'; then
  printf 'A quarantine record containing an extra field was accepted.\n' >&2
  exit 1
fi

# A successful ad-hoc replacement can take more than the old fixed one-second
# delay to launch and install its bundled engine. The helper must wait for the
# new App's acknowledgement, while remaining bounded when startup is blocked.
ACK_MARKER="$TEMP_ROOT/pending-self-update.plist"
: > "$ACK_MARKER"
(
  /bin/sleep 0.3
  /bin/rm -f "$ACK_MARKER"
) &
ACK_REMOVER_PID="$!"
wait_for_update_acknowledgement "$ACK_MARKER" 20 || {
  printf 'A delayed but successful update acknowledgement was rejected.\n' >&2
  exit 1
}
wait "$ACK_REMOVER_PID"
: > "$ACK_MARKER"
if wait_for_update_acknowledgement "$ACK_MARKER" 2; then
  printf 'The update acknowledgement wait was not bounded.\n' >&2
  exit 1
fi
/bin/rm -f "$ACK_MARKER"

printf 'Ad-hoc identity and acknowledgement waiting passed.\n'
