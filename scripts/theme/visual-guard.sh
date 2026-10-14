#!/usr/bin/env bash
# Theme visual guard: screenshots every Storybook story at a baseline ref and at
# the working tree, then compares them pixel by pixel.
#
#   scripts/theme/visual-guard.sh --base <ref> --theme dark   # must be identical (upstream parity)
#   scripts/theme/visual-guard.sh --base <ref> --theme light  # AntD theme vs its own baseline
#
# Typical refs: dark -> the upstream branch this theme sits on (i18n-zh-cn /
# origin/main merge-base); light -> the last approved theme commit.
# Options: --tolerance N (default 8), --max-ratio R (default 0), --concurrency N
# Output: $OUT (default .theme-guard/<theme>) with baseline/, current/, report.json
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
BASE="" THEME=dark TOL=8 RATIO=0 CONC=()
while (($#)); do
  case "$1" in
    --base) BASE="$2"; shift ;;
    --theme) THEME="$2"; shift ;;
    --tolerance) TOL="$2"; shift ;;
    --max-ratio) RATIO="$2"; shift ;;
    --concurrency) CONC=(--concurrency "$2"); shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
  shift
done
[[ -n "$BASE" ]] || { echo "--base <ref> is required" >&2; exit 2; }

CACHE="${THEME_GUARD_CACHE:-$HOME/.cache/netbird-theme-guard}"
OUT="${OUT:-$REPO/.theme-guard/$THEME}"
WT="$CACHE/baseline-src"
CAPTURE="$REPO/.storybook/visual-regression/scripts/capture.mjs"
started=$SECONDS
step() { echo "› $* ($((SECONDS - started))s)"; }

rm -rf "$OUT"; mkdir -p "$OUT/baseline" "$OUT/current" "$CACHE"

step "baseline worktree at $(git -C "$REPO" log --oneline -1 "$BASE")"
if [[ -d "$WT" ]]; then
  git -C "$WT" checkout --quiet --detach --force "$BASE"
  git -C "$WT" clean -qfd -e node_modules
else
  git -C "$REPO" worktree add --quiet --detach "$WT" "$BASE"
fi
if ! cmp -s "$REPO/package-lock.json" "$WT/.guard-lock"; then
  step "copying node_modules into the baseline worktree"
  rm -rf "$WT/node_modules"
  cp -R --reflink=auto "$REPO/node_modules" "$WT/node_modules" 2>/dev/null ||
    cp -cR "$REPO/node_modules" "$WT/node_modules" 2>/dev/null ||
    cp -R "$REPO/node_modules" "$WT/node_modules"
  cp "$REPO/package-lock.json" "$WT/.guard-lock"
fi
# Same stories and Storybook config on both sides, so only the styles differ.
rsync -a --delete "$REPO/.storybook/" "$WT/.storybook/"
rsync -a --include='*/' --include='*.stories.tsx' --exclude='*' "$REPO/src/" "$WT/src/"

build() {
  (cd "$1" && npx storybook build --test --quiet --disable-telemetry -o "$CACHE/storybook-$2" \
    >"$CACHE/storybook-$2.log" 2>&1) || { echo "✗ $2 storybook build failed, see $CACHE/storybook-$2.log"; return 1; }
}
step "building storybooks"
build "$REPO" current & p1=$!
build "$WT" baseline & p2=$!
wait $p1; wait $p2

step "capturing baseline ($THEME)"
node "$CAPTURE" "$CACHE/storybook-baseline" "$OUT/baseline" --theme "$THEME" "${CONC[@]}" || true
step "capturing current ($THEME)"
node "$CAPTURE" "$CACHE/storybook-current" "$OUT/current" --theme "$THEME" "${CONC[@]}" || true

# A crashed browser leaves stories uncaptured; retry those once, gently.
retry_missing() {
  local from="$1" side="$2" other="$3"
  ls "$OUT/$other" | sed -n 's/\.png$//p' | sed -E 's/--(hover|focus)$//' | sort -u |
    while read -r id; do [[ -f "$OUT/$side/$id.png" ]] || echo "$id"; done >"$OUT/missing-$side.txt"
  if [[ -s "$OUT/missing-$side.txt" ]]; then
    step "re-capturing $(wc -l <"$OUT/missing-$side.txt" | tr -d ' ') missing $side stories"
    node "$CAPTURE" "$from" "$OUT/$side" --theme "$THEME" --ids "$OUT/missing-$side.txt" --concurrency 2 || true
  fi
}
retry_missing "$CACHE/storybook-current" current baseline
retry_missing "$CACHE/storybook-baseline" baseline current

step "comparing"
node "$REPO/scripts/theme/compare-shots.mjs" "$OUT/baseline" "$OUT/current" \
  --mask "$REPO/scripts/theme/visual-mask.txt" --tolerance "$TOL" --max-ratio "$RATIO" \
  --out "$OUT/report.json"
