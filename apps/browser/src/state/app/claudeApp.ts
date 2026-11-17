// (fork) Bro ships as two apps built from this source: Bro-wser, for Erbin, and Bro-claude (app id ending in .claude),
// where Claude's agents browse. Bro-claude marks itself with a Claude-orange address bar.
import { systemInfo } from "../../platform/app";

export const CLAUDE_ORANGE = "#D97757";
export const CLAUDE_ORANGE_HOVER = "#E08A6D";

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
