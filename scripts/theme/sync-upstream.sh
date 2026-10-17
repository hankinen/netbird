#!/usr/bin/env bash
# Sync dev (our single main branch: zh-CN translations + the AntD theme) with
# upstream NetBird.
#
#   upstream (origin/main) <- dev
#
# Default is a DRY RUN: dev is replayed onto upstream in a throw-away detached
# worktree, then check-selectors, build, the dark visual guard (vs dev before
# the sync: only upstream's own visual changes may show up; review the report)
# and the phone overflow guard (mobile-guard.mjs) run there.
# No branch moves, nothing is pushed.
#
#   scripts/theme/sync-upstream.sh                 # dry run, full checks
#   scripts/theme/sync-upstream.sh --quick         # dry run, rebase + check-selectors only
#   scripts/theme/sync-upstream.sh --apply         # rebase dev onto the upstream tip
#
# Options: --remote <name> (origin) --upstream <branch> (main)
#          --branch <branch> (dev; --theme is an alias)
#          --no-fetch --keep (keep the dry-run worktree)
#
# Safety: never pushes, never force-anything. --apply refuses to run with a
# dirty worktree or when dev is checked out somewhere with local changes.
set -euo pipefail

REMOTE=origin UPSTREAM=main BRANCH=dev
APPLY=0 QUICK=0 FETCH=1 KEEP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --remote) REMOTE="$2"; shift ;;
    --upstream) UPSTREAM="$2"; shift ;;
    --branch|--theme) BRANCH="$2"; shift ;;
    --apply) APPLY=1 ;;
    --quick) QUICK=1 ;;
    --no-fetch) FETCH=0 ;;
    --keep) KEEP=1 ;;
    -h|--help) sed -n '2,23p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

log() { printf '› %s\n' "$*"; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
UP="$REMOTE/$UPSTREAM"

[ "$FETCH" = 1 ] && { log "git fetch $REMOTE $UPSTREAM"; git fetch --quiet "$REMOTE" "$UPSTREAM"; }
git rev-parse -q --verify "$UP^{commit}" >/dev/null || die "no $UP"
git rev-parse -q --verify "$BRANCH^{commit}" >/dev/null || die "no branch $BRANCH"

BASE=$(git merge-base "$UP" "$BRANCH")
ORIG=$(git rev-parse "$BRANCH")   # dark guard baseline: dev before the sync
log "upstream $UP $(git rev-parse --short "$UP"); $BRANCH is based on $(git rev-parse --short "$BASE")"
log "$(git rev-list --count "$BASE..$UP") new upstream commit(s), $(git rev-list --count "$BASE..$BRANCH") $BRANCH commit(s)"

# Worktree (if any) where a branch is checked out.
wt_of() { git worktree list --porcelain | awk -v b="refs/heads/$1" '/^worktree /{w=$2} $0=="branch "b{print w}'; }
clean() { [ -z "$(git -C "$1" status --porcelain --untracked-files=no)" ]; }

checks() { # $1 = dir, $2 = dark guard baseline (pre-sync dev)
  local d=$1
  log "check-selectors"; (cd "$d" && node scripts/theme/check-selectors.mjs)
  [ "$QUICK" = 1 ] && return 0
  log "build (log: $d/.sync-build.log)"
  (cd "$d" && npm run build > .sync-build.log 2>&1) || die "build failed, see $d/.sync-build.log"
  log "dark visual guard vs pre-sync $BRANCH $(git rev-parse --short "$2") (changes only where upstream changed)"
  (cd "$d" && scripts/theme/visual-guard.sh --base "$2" --theme dark) ||
    die "dark changed vs pre-sync $BRANCH: review $d/.theme-guard/dark (only upstream's own changes are OK)"
  log "phone overflow guard (375/390/768, allowlist scripts/theme/mobile-allow.json)"
  (cd "$d" && node scripts/theme/mobile-guard.mjs)
}

if [ "$APPLY" = 0 ]; then
  TMP=$(mktemp -d /tmp/theme-sync.XXXXXX)
  WT="$TMP/wt"
  cleanup() { [ "$KEEP" = 1 ] && { log "kept $WT"; return; }; git worktree remove --force "$WT" >/dev/null 2>&1 || true; rm -rf "$TMP"; }
  trap cleanup EXIT
  # Throw-away commits: a placeholder committer is fine if none is configured.
  git config user.email >/dev/null || export GIT_COMMITTER_NAME=theme-sync GIT_COMMITTER_EMAIL=theme-sync@localhost
  log "dry run in $WT (detached, no branch moves)"
  git worktree add --quiet --detach "$WT" "$BRANCH"
  if ! git -C "$WT" rebase --onto "$UP" "$BASE" >"$TMP/rebase.log" 2>&1; then
    tail -n 5 "$TMP/rebase.log" | sed 's/^/  /'
    git -C "$WT" diff --name-only --diff-filter=U | sed 's/^/  conflict: /'
    git -C "$WT" rebase --abort || true
    die "$BRANCH does not rebase cleanly onto $UP (expected hotspots: see src/theme/README.md)"
  fi
  log "$BRANCH replayed onto $UP -> $(git -C "$WT" rev-parse --short HEAD)"
  [ -d "$ROOT/node_modules" ] && [ "$QUICK" = 0 ] && ln -s "$ROOT/node_modules" "$WT/node_modules"
  checks "$WT" "$ORIG"
  log "dry run OK. Re-run with --apply to move $BRANCH."
  exit 0
fi

# --apply
git config user.email >/dev/null || [ -n "${GIT_COMMITTER_EMAIL:-}" ] || die "set git user.email (or GIT_COMMITTER_EMAIL) before --apply"
W=$(wt_of "$BRANCH")
[ -n "$W" ] || W=$ROOT
clean "$W" || die "$W has local changes"
log "rebasing $BRANCH in $W onto $UP"
git -C "$W" checkout --quiet "$BRANCH"
git -C "$W" rebase --onto "$UP" "$BASE"
checks "$W" "$ORIG"
log "done. Nothing was pushed."
