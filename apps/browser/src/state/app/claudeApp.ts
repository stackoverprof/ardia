// (fork) Bro ships as two apps built from this source: Bro, for Erbin, and Bro for Claude (app id ending in .claude),
// where Claude's agents browse. Bro for Claude marks itself so the two are never confused: caution-tape stripes on
// the toolbar and a Claude-orange window frame.
import { systemInfo } from "../../platform/app";

let cached: boolean | undefined;

export function isClaudeApp(): boolean {
  if (cached === undefined) {
    try {
      cached = (systemInfo().bundleId ?? "").endsWith(".claude");
    } catch {
      cached = false;
    }
  }
  return cached;
}
