#!/bin/bash
# Builds Bro (Release) from this checkout. Prints the built app's path. Never installs.
# `build.sh claude` builds Bro-claude instead: app id is.erbin.ardia.claude, its own name, inverted icon and data.
set -uo pipefail
export LANG=en_US.UTF-8
cd "$(dirname "$0")/../../apps/browser" || exit 2
flavor=${1:-bro}
case "$flavor" in
  bro) derived=build; extra=() ;;
  claude) derived=build-claude; extra=(PRODUCT_BUNDLE_IDENTIFIER=is.erbin.ardia.claude BRO_APP_NAME=Bro-claude ASSETCATALOG_COMPILER_APPICON_NAME=AppIconClaude) ;;
  *) echo "usage: build.sh [bro|claude]"; exit 2 ;;
esac
log="$(cd ../.. && pwd)/build-release-$flavor.log"
# Point Xcode's scripts at the real node binary: proto's `node` shim prints a notice line to stdout when it detects an
# AI agent, which breaks the React Native bundler step that parses `node … config` as JSON.
real_node=$(ls -d "$HOME"/.proto/tools/node/24.*/bin/node 2>/dev/null | tail -1)
[ -n "$real_node" ] && echo "export NODE_BINARY=\"$real_node\"" > macos/.xcode.env.local

# Each build gets its own build number (upstream's, then the time): macOS caches app icons by app id + build number,
# so builds sharing a number keep showing whichever icon it cached first.
upstream_build=$(grep -m1 'CURRENT_PROJECT_VERSION = ' macos/Ardia.xcodeproj/project.pbxproj | grep -o '[0-9]*')
build_number="${upstream_build}.$(date +%y%m%d%H%M)"
xcodebuild -workspace macos/Ardia.xcworkspace -scheme Ardia-macOS -derivedDataPath "$derived" \
  -destination 'platform=macOS,arch=arm64' -quiet -configuration Release -allowProvisioningUpdates \
  CURRENT_PROJECT_VERSION="$build_number" ${extra[@]+"${extra[@]}"} > "$log" 2>&1
status=$?
if [ $status -ne 0 ]; then
  echo "Build failed. Errors:"; grep "error:" "$log" | sort -u | head -20; echo "(full log: $log)"; exit 1
fi
app="$PWD/$derived/Build/Products/Release/Ardia.app"
codesign -v "$app" || { echo "The built app's signature doesn't verify."; exit 1; }
echo "$app"
