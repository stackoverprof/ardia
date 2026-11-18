#!/bin/sh
# Puts Bro's CLI tweaks into the installed `ardia` command.
#
# Bro doesn't build the ardia command: it is upstream's release, downloaded into
# ~/Library/Application Support/Ardia/CLI/<version>. This copies every file the fork changed under apps/cli/ardia_cli
# (compared with upstream's tag for that version) over the installed copy, but only where the installed file is still
# upstream's (or already ours), so it never overwrites something else. Re-run it after the CLI updates.
# Running `ardia browse` daemons keep the old code until they next start (they stop when idle); they are not killed,
# since other sessions may be using them.
set -eu
repo=$(cd "$(dirname "$0")/../.." && pwd -P)
cli_home=${ARDIA_CLI_HOME:-$HOME/Library/Application Support/Ardia/CLI}
version=$(basename "$(readlink "$cli_home/current")")
site=$(find "$cli_home/$version/python/lib" -maxdepth 2 -type d -name site-packages | head -1)
[ -d "$site/ardia_cli" ] || { echo "No installed ardia_cli under $cli_home/$version"; exit 1; }
cd "$repo"
git rev-parse -q --verify "v$version^{commit}" >/dev/null || { echo "No upstream tag v$version here; run git fetch upstream --tags"; exit 1; }

changed=$(git diff --name-only "v$version" -- apps/cli/ardia_cli | sed 's|^apps/cli/ardia_cli/||')
[ -n "$changed" ] || { echo "The fork changes nothing in the CLI."; exit 0; }
patched=0
for f in $changed; do
  dest="$site/ardia_cli/$f"
  if cmp -s "apps/cli/ardia_cli/$f" "$dest"; then continue; fi
  # Overwrite upstream's copy, or an older copy of ours (any committed fork version of the file).
  ours_before=0
  for rev in $(git rev-list "v$version..HEAD" -- "apps/cli/ardia_cli/$f"); do
    if git show "$rev:apps/cli/ardia_cli/$f" 2>/dev/null | cmp -s - "$dest"; then ours_before=1; break; fi
  done
  if [ "$ours_before" = 1 ] || git show "v$version:apps/cli/ardia_cli/$f" 2>/dev/null | cmp -s - "$dest"; then
    cp "apps/cli/ardia_cli/$f" "$dest"
    rm -rf "$(dirname "$dest")/__pycache__"
    echo "patched $f"
    patched=$((patched + 1))
  else
    echo "skipped $f: the installed copy is neither upstream's v$version nor Bro's"
  fi
done
if [ "$patched" -gt 0 ]; then
  echo "CLI $version patched ($patched file(s)); browse daemons load it when they next start."
else
  echo "CLI $version already has Bro's tweaks."
fi
