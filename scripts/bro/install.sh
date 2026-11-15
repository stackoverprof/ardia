#!/bin/bash
# Installs the built app as /Applications/Bro.app: quits Bro, swaps the app, reopens it. Bro's data is not touched.
# Erbin browses in Bro, so ask him before running this unless he just asked for the change.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 2
app="$PWD/apps/browser/build/Build/Products/Release/Ardia.app"
[ -d "$app" ] || { echo "No build yet: run scripts/bro/build.sh"; exit 1; }
codesign -v "$app" || { echo "The built app's signature doesn't verify; not installing."; exit 1; }
scripts/bro/check-tweaks.sh || { echo "A tweak is missing; not installing."; exit 1; }
osascript -e 'tell application id "is.erbin.ardia" to quit' >/dev/null 2>&1
for _ in $(seq 1 60); do pgrep -f "/Applications/Bro.app/Contents/MacOS/" >/dev/null || break; sleep 0.5; done
pgrep -f "/Applications/Bro.app/Contents/MacOS/" >/dev/null && { echo "Bro is still running; not installing."; exit 1; }
if [ -d /Applications/Bro.app ]; then
  osascript -e 'tell application "Finder" to delete (POSIX file "/Applications/Bro.app")' >/dev/null 2>&1
fi
[ -e /Applications/Bro.app ] && { echo "Couldn't move the old Bro.app to the Trash; not installing."; exit 1; }
ditto "$app" /Applications/Bro.app && codesign -v /Applications/Bro.app || { echo "Install failed."; exit 1; }
# The build product has the same app id as the installed Bro; left registered, macOS can show its icon (an older
# one, from the icon cache) for Bro in the Dock. Unregister it and register only the installed app.
lsregister=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister
$lsregister -u "$app" >/dev/null 2>&1
$lsregister -f /Applications/Bro.app
open -a /Applications/Bro.app
echo "Installed and reopened Bro ($(git log --oneline -1 | cut -c1-60))."
