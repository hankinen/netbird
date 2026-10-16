#!/bin/bash
# Exercises nb-dashboard-deploy against a fake docker, no server needed:
# asset publishing, the config gate, rollback, and the prune window.
# Usage: deploy/server/test-deploy-script.sh [out-dir (default: out)]
# shellcheck disable=SC2015 # ok/bad never fail
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../.." && pwd)
OUT=$(cd "${1:-$REPO/out}" && pwd)
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
FAIL=0
ok() { echo "ok   - $*"; }
bad() { echo "FAIL - $*"; FAIL=1; }

# Fake docker: records calls; `run` fails when FAKE_GATE_FAIL=1.
mkdir -p "$T/bin"
cat >"$T/bin/docker" <<'FAKE'
#!/bin/bash
echo "$*" >>"$FAKE_LOG"
case "$1" in
  run) [[ "${FAKE_GATE_FAIL:-0}" == 1 ]] && exit 1; exit 0 ;;
  inspect) [[ "$*" == *State.Status* ]] && echo running || echo "netbird-dashboard-zh:current"; exit 0 ;;
  *) exit 0 ;;
esac
FAKE
chmod +x "$T/bin/docker"
export NB_DOCKER="$T/bin/docker" FAKE_LOG="$T/docker.log" NB_LOCK="$T/lock"
export NB_DASHBOARD_BASE="$T/base" NB_COMPOSE_FILE="$T/compose.yml" NB_DASHBOARD_ENV="$T/dashboard.env"
mkdir -p "$T/base/releases"
: >"$T/dashboard.env"

package() { tar -czf "$T/pkg.tgz" -C "$1" out docker; }
mkdir -p "$T/pkg1"
cp -a "$OUT" "$T/pkg1/out"
cp -a "$REPO/docker" "$T/pkg1/docker"
package "$T/pkg1"

DEPLOY="$HERE/nb-dashboard-deploy"
"$DEPLOY" deploy <"$T/pkg.tgz" && ok "first deploy" || bad "first deploy"
R1=$(cat "$T/base/CURRENT")
n_chunks=$(find "$OUT/_next/static" -type f | wc -l)
n_pool=$(find "$T/base/static-pool/_next/static" -type f | wc -l)
[[ "$n_chunks" == "$n_pool" ]] && ok "pool has all $n_pool _next/static files" || bad "pool $n_pool != $n_chunks"
find "$T/base/static-pool/assets" -type f | grep -qE '/chunk\.[0-9a-f]{8}\.js$' && ok "inline chunks in pool" || bad "inline chunks missing"
find "$T/base/static-pool/assets" -type f ! -name 'chunk.*' | grep -q . && bad "non-chunk asset in pool" || ok "only chunks under pool/assets"
grep -q -- "build -q -t netbird-dashboard-zh:$R1" "$FAKE_LOG" && ok "image built" || bad "no build"
grep -q -- "run --rm --network none --env-file" "$FAKE_LOG" && ok "gate ran" || bad "no gate"
grep -q -- "up -d --no-deps --force-recreate dashboard" "$FAKE_LOG" && ok "compose up" || bad "no compose up"

# Second release with one changed chunk: old chunk must stay in the pool.
sleep 1
mkdir -p "$T/pkg2" && cp -a "$T/pkg1/out" "$T/pkg2/out" && cp -a "$T/pkg1/docker" "$T/pkg2/docker"
echo "new" >"$T/pkg2/out/_next/static/chunks/zzzznewchunk1.js"
old=$(find "$T/pkg1/out/_next/static/chunks" -name '*.js' -print -quit)
rm "$T/pkg2/out/_next/static/chunks/$(basename "$old")"
( cd "$T/pkg2/out" && node "$REPO/scripts/build/verify-immutable.mjs" . >/dev/null )
package "$T/pkg2"
"$DEPLOY" deploy <"$T/pkg.tgz" && ok "second deploy" || bad "second deploy"
R2=$(cat "$T/base/CURRENT")
[[ -f "$T/base/static-pool/_next/static/chunks/$(basename "$old")" ]] && ok "previous release chunk still served" || bad "old chunk pruned"
[[ -f "$T/base/static-pool/_next/static/chunks/zzzznewchunk1.js" ]] && ok "new chunk published" || bad "new chunk missing"

# Gate failure leaves CURRENT unchanged.
sleep 1
FAKE_GATE_FAIL=1 "$DEPLOY" deploy <"$T/pkg.tgz" 2>/dev/null && bad "bad config accepted" || ok "bad config rejected"
[[ "$(cat "$T/base/CURRENT")" == "$R2" ]] && ok "CURRENT unchanged after rejected release" || bad "CURRENT changed"

"$DEPLOY" rollback && [[ "$(cat "$T/base/CURRENT")" == "$R1" ]] && ok "rollback to $R1" || bad "rollback"
"$DEPLOY" "rollback $R2" && [[ "$(cat "$T/base/CURRENT")" == "$R2" ]] && ok "rollback by id (forced-command form)" || bad "rollback by id"
"$DEPLOY" "rollback ../../etc" 2>/dev/null && bad "accepted bad id" || ok "rejects bad release id"

# Prune window: an old, unreferenced file goes; a fresh unreferenced one stays.
touch -d "-20 days" "$T/base/static-pool/_next/static/chunks/zzzznewchunk1.js"
echo x >"$T/base/static-pool/_next/static/chunks/orphan-old.js"; touch -d "-20 days" "$T/base/static-pool/_next/static/chunks/orphan-old.js"
echo x >"$T/base/static-pool/_next/static/chunks/orphan-new.js"
"$DEPLOY" prune
[[ ! -f "$T/base/static-pool/_next/static/chunks/orphan-old.js" ]] && ok "prune: old unreferenced removed" || bad "old orphan kept"
[[ -f "$T/base/static-pool/_next/static/chunks/orphan-new.js" ]] && ok "prune: recent unreferenced kept (14 days)" || bad "recent orphan removed"
[[ -f "$T/base/static-pool/_next/static/chunks/zzzznewchunk1.js" ]] && ok "prune: old but referenced kept (last 5)" || bad "referenced removed"
STATUS=$("$DEPLOY" status)
grep -q "current: $R2" <<<"$STATUS" && ok "status" || bad "status"
[[ $(find "$T/base/releases" -mindepth 1 -maxdepth 1 | wc -l) == 2 ]] && ok "rejected release dir removed" || bad "release dirs: $(ls "$T/base/releases")"

[[ $FAIL == 0 ]] && echo "ALL DEPLOY SCRIPT TESTS PASSED" || { echo "DEPLOY SCRIPT TESTS FAILED"; exit 1; }
