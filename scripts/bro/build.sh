#!/bin/bash
# Builds Bro (Release) from this checkout. Prints the built app's path. Never installs.
set -uo pipefail
export LANG=en_US.UTF-8
cd "$(dirname "$0")/../../apps/browser" || exit 2
log="$(cd ../.. && pwd)/build-release.log"
xcodebuild -workspace macos/Ardia.xcworkspace -scheme Ardia-macOS -derivedDataPath build \
  -destination 'platform=macOS,arch=arm64' -quiet -configuration Release -allowProvisioningUpdates > "$log" 2>&1
status=$?
if [ $status -ne 0 ]; then
  echo "Build failed. Errors:"; grep "error:" "$log" | sort -u | head -20; echo "(full log: $log)"; exit 1
fi
app="$PWD/build/Build/Products/Release/Ardia.app"
codesign -v "$app" || { echo "The built app's signature doesn't verify."; exit 1; }
echo "$app"
