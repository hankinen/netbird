#!/usr/bin/env bash
# Sync the theme branch with upstream NetBird.
#
#   upstream (origin/main) <- i18n branch (i18n-zh-cn) <- theme branch (feature/theme-antd)
#
# Default is a DRY RUN: both rebases are replayed in a throw-away detached
# worktree, then check-selectors, build and the dark visual guard run there.
# No branch moves, nothing is pushed.
#
#   scripts/theme/sync-upstream.sh                 # dry run, full checks
#   scripts/theme/sync-upstream.sh --quick         # dry run, rebase + check-selectors only
#   scripts/theme/sync-upstream.sh --apply         # rebase the theme branch onto the i18n branch tip
#   scripts/theme/sync-upstream.sh --apply --rebase-i18n
#                                                  # also rebase the i18n branch onto upstream first
#
# Options: --remote <name> (origin) --upstream <branch> (main)
#          --i18n <branch> (i18n-zh-cn) --theme <branch> (feature/theme-antd)
#          --no-fetch --keep (keep the dry-run worktree)
#
# Safety: never pushes, never force-anything. The i18n branch is only touched
# with --rebase-i18n. --apply refuses to run with a dirty worktree or when a
# branch is checked out somewhere with local changes.
set -euo pipefail

REMOTE=origin UPSTREAM=main I18N=i18n-zh-cn THEME=feature/theme-antd
APPLY=0 REBASE_I18N=0 QUICK=0 FETCH=1 KEEP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --remote) REMOTE="$2"; shift ;;
    --upstream) UPSTREAM="$2"; shift ;;
    --i18n) I18N="$2"; shift ;;
    --theme) THEME="$2"; shift ;;
    --apply) APPLY=1 ;;
    --rebase-i18n) REBASE_I18N=1 ;;
    --quick) QUICK=1 ;;
    --no-fetch) FETCH=0 ;;
    --keep) KEEP=1 ;;
    -h|--help) sed -n '2,24p' "$0"; exit 0 ;;
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
git rev-parse -q --verify "$I18N^{commit}" >/dev/null || die "no branch $I18N"
git rev-parse -q --verify "$THEME^{commit}" >/dev/null || die "no branch $THEME"

I18N_BASE=$(git merge-base "$UP" "$I18N")
THEME_BASE=$(git merge-base "$I18N" "$THEME")
log "upstream $UP $(git rev-parse --short "$UP"); $I18N is based on $(git rev-parse --short "$I18N_BASE")"
log "$(git rev-list --count "$I18N_BASE..$UP") new upstream commit(s)"
log "$(git rev-list --count "$I18N_BASE..$I18N") $I18N commit(s), $(git rev-list --count "$THEME_BASE..$THEME") $THEME commit(s)"
[ "$THEME_BASE" = "$(git rev-parse "$I18N")" ] || log "note: $THEME is not on the tip of $I18N"

# Worktree (if any) where a branch is checked out.
wt_of() { git worktree list --porcelain | awk -v b="refs/heads/$1" '/^worktree /{w=$2} $0=="branch "b{print w}'; }
clean() { [ -z "$(git -C "$1" status --porcelain --untracked-files=no)" ]; }

checks() { # $1 = dir
  local d=$1
  log "check-selectors"; (cd "$d" && node scripts/theme/check-selectors.mjs)
  [ "$QUICK" = 1 ] && return 0
  log "build (log: $d/.sync-build.log)"
  (cd "$d" && npm run build > .sync-build.log 2>&1) || die "build failed, see $d/.sync-build.log"
  log "dark visual guard vs the upstream-side base"
  (cd "$d" && scripts/theme/visual-guard.sh --base "$2" --theme dark)
}

if [ "$APPLY" = 0 ]; then
  TMP=$(mktemp -d /tmp/theme-sync.XXXXXX)
  WT="$TMP/wt"
  cleanup() { [ "$KEEP" = 1 ] && { log "kept $WT"; return; }; git worktree remove --force "$WT" >/dev/null 2>&1 || true; rm -rf "$TMP"; }
  trap cleanup EXIT
  # Throw-away commits: a placeholder committer is fine if none is configured.
  git config user.email >/dev/null || export GIT_COMMITTER_NAME=theme-sync GIT_COMMITTER_EMAIL=theme-sync@localhost
  log "dry run in $WT (detached, no branch moves)"
  git worktree add --quiet --detach "$WT" "$I18N"
  if ! git -C "$WT" rebase --onto "$UP" "$I18N_BASE" >"$TMP/rebase-i18n.log" 2>&1; then
    tail -n 5 "$TMP/rebase-i18n.log" | sed 's/^/  /'
    git -C "$WT" diff --name-only --diff-filter=U | sed 's/^/  conflict: /'
    git -C "$WT" rebase --abort || true
    die "$I18N does not rebase cleanly onto $UP (resolve on $I18N first)"
  fi
  NEW_I18N=$(git -C "$WT" rev-parse HEAD)
  log "$I18N replayed onto $UP -> $(git rev-parse --short "$NEW_I18N")"
  git -C "$WT" checkout --quiet --detach "$THEME"
  if ! git -C "$WT" rebase --onto "$NEW_I18N" "$THEME_BASE" >"$TMP/rebase-theme.log" 2>&1; then
    tail -n 5 "$TMP/rebase-theme.log" | sed 's/^/  /'
    git -C "$WT" diff --name-only --diff-filter=U | sed 's/^/  conflict: /'
    git -C "$WT" rebase --abort || true
    die "$THEME does not rebase cleanly (expected hotspots: see src/styles/theme-antd/README.md)"
  fi
  log "$THEME replayed -> $(git -C "$WT" rev-parse --short HEAD)"
  [ -d "$ROOT/node_modules" ] && [ "$QUICK" = 0 ] && ln -s "$ROOT/node_modules" "$WT/node_modules"
  checks "$WT" "$NEW_I18N"
  log "dry run OK. Re-run with --apply to move branches (add --rebase-i18n to include $I18N)."
  exit 0
fi

# --apply
git config user.email >/dev/null || [ -n "${GIT_COMMITTER_EMAIL:-}" ] || die "set git user.email (or GIT_COMMITTER_EMAIL) before --apply"
if [ "$REBASE_I18N" = 1 ]; then
  W=$(wt_of "$I18N")
  if [ -n "$W" ]; then
    clean "$W" || die "$I18N is checked out at $W with local changes"
    log "rebasing $I18N in $W onto $UP"
    git -C "$W" rebase "$UP"
  else
    log "rebasing $I18N onto $UP"
    git rebase --onto "$UP" "$I18N_BASE" "$I18N"
  fi
else
  log "$I18N left untouched (pass --rebase-i18n to rebase it)"
fi

W=$(wt_of "$THEME")
[ -n "$W" ] || W=$ROOT
clean "$W" || die "$W has local changes"
log "rebasing $THEME in $W onto $I18N"
git -C "$W" checkout --quiet "$THEME"
git -C "$W" rebase --onto "$I18N" "$THEME_BASE"
checks "$W" "$I18N"
log "done. Nothing was pushed."
