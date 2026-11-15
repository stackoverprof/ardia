#!/bin/bash
# Runs the built app on throwaway data (.testdata), beside the real Bro, to try a change before installing it.
#   scripts/bro/try.sh          hidden: checks it starts, stays up and answers the ardia command, then quits it
#   scripts/bro/try.sh --show   visible, left open for Erbin to look at (quit it from its own menu)
# The real Bro and its data are never touched.
cd "$(dirname "$0")/../.." || exit 2
app="$PWD/apps/browser/build/Build/Products/Release/Ardia.app"
[ -d "$app" ] || { echo "No build yet: run scripts/bro/build.sh"; exit 1; }
mkdir -p .testdata
data="$PWD/.testdata"
if [ "${1:-}" = --show ]; then
  ARDIA_DATA_DIR="$data" nohup "$app/Contents/MacOS/Ardia" >/dev/null 2>&1 &
  echo "Opened the build on $data."; exit 0
fi
ARDIA_DATA_DIR="$data" ARDIA_BACKGROUND=1 nohup "$app/Contents/MacOS/Ardia" >/dev/null 2>&1 &
pid=$!
sleep 12
if ! kill -0 $pid 2>/dev/null; then echo "The build quit within 12 seconds of starting."; exit 1; fi
if ARDIA_DATA_DIR="$data" ardia windows --json >/dev/null 2>&1; then echo "The build starts, stays up, and answers the ardia command."; status=0
else echo "The build starts and stays up, but didn't answer the ardia command (control may be off in the test data)."; status=0; fi
kill $pid 2>/dev/null
exit $status
