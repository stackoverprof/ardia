#!/bin/bash
# Brings the newest stable Ardia release into Bro (branch erbin) without losing Bro's tweaks.
#   scripts/bro/update.sh           merge, check the tweaks, install dependencies, typecheck, build
#   scripts/bro/update.sh --check   only say whether a newer Ardia release exists
# It never installs (scripts/bro/install.sh does, after Erbin says yes) and never resolves a conflict by itself.
# Exit: 0 up to date or updated and built, 3 an update is available (--check), 2 stopped for a person (conflict,
# missing tweak, dirty tree), 1 a build step failed.
set -uo pipefail
export LANG=en_US.UTF-8
cd "$(dirname "$0")/../.." || exit 2

[ "$(git rev-parse --abbrev-ref HEAD)" = erbin ] || { echo "Not on branch erbin."; exit 2; }
git fetch -q upstream --tags || { echo "Couldn't fetch upstream."; exit 1; }
latest=$(git tag --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
[ -n "$latest" ] || { echo "No stable Ardia release tag found."; exit 1; }
if git merge-base --is-ancestor "$latest" HEAD; then
  echo "Bro already includes Ardia $latest (the newest stable release)."; exit 0
fi
echo "Ardia $latest is newer than what Bro includes."
[ "${1:-}" = --check ] && exit 3

[ -z "$(git status --porcelain)" ] || { echo "The working tree has uncommitted changes; commit or stash them first."; exit 2; }
backup="backup/erbin-before-$latest"
git branch -f "$backup" HEAD
echo "Saved the current Bro as branch $backup."

if ! git merge --no-ff --no-edit -m "Merge Ardia $latest into Bro" "$latest"; then
  echo
  echo "The merge stopped on conflicts in:"
  git diff --name-only --diff-filter=U | sed 's/^/  /'
  echo "Resolve each one keeping Bro's tweak (see FORK.md), adapted to the new upstream code, then commit and run"
  echo "this script again. To give up: git merge --abort   (branch $backup is the Bro from before)."
  exit 2
fi

scripts/bro/check-tweaks.sh || { echo "The merge went through but a tweak is gone. Restore it (FORK.md) before building."; exit 2; }
pnpm install >/dev/null 2>&1 || { echo "pnpm install failed."; exit 1; }
pnpm pods >/dev/null 2>&1 || { echo "pod install failed."; exit 1; }
pnpm --filter @ardia/browser typecheck >/dev/null 2>&1 || { echo "Typecheck failed: pnpm --filter @ardia/browser typecheck"; exit 1; }
scripts/bro/build.sh || exit 1
echo "Bro now includes Ardia $latest and is built. Try it (scripts/bro/try.sh), then ask Erbin before scripts/bro/install.sh."
