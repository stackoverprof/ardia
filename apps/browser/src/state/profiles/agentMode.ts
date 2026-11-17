// (fork) Agent mode: the human and the AI agents browse side by side, each in a profile of their own. A window in the
// agents' profile is in Agent mode; every other profile is Human mode. Each mode keeps its own sidebar side and
// auto-hide, swapped into the live settings when a window crosses from one mode to the other.
import type { BrowserState } from "../browser/store";
import type { Settings } from "../settings/settings";
import { isIncognitoProfile } from "../browser/model";

type Scope = Pick<BrowserState, "profiles" | "profileOrder" | "settings">;

const AGENT_PROFILE_NAME = "claude";

export function agentProfileIdOf(s: Scope): string | null {
  const chosen = s.settings.agentProfileId;
  if (chosen && s.profiles[chosen]) return chosen;
  return s.profileOrder.find((id) => s.profiles[id]?.name.trim().toLowerCase() === AGENT_PROFILE_NAME) ?? null;
}

export const isAgentProfile = (s: Scope, profileId: string | null | undefined): boolean => !!profileId && agentProfileIdOf(s) === profileId;

/** The profile Human mode goes back to: the last human one used, else the first that isn't the agents'. */
export function humanProfileIdOf(s: Scope): string | null {
  const agent = agentProfileIdOf(s);
  const usable = (id: string) => !!s.profiles[id] && id !== agent && !isIncognitoProfile(id);
  if (s.settings.humanProfileId && usable(s.settings.humanProfileId)) return s.settings.humanProfileId;
  return s.profileOrder.find(usable) ?? null;
}

/** The settings to apply when a window goes from one profile to another, or null when the mode stays the same. */
export function modeSwap(s: Scope, from: string, to: string): Partial<Settings> | null {
  const was = isAgentProfile(s, from);
  const now = isAgentProfile(s, to);
  if (was === now) return null;
  const { sidebarSide, autoHideTabs } = s.settings;
  return was
    ? { agentSidebarSide: sidebarSide, agentAutoHideTabs: autoHideTabs, sidebarSide: s.settings.humanSidebarSide, autoHideTabs: s.settings.humanAutoHideTabs }
    : { humanProfileId: from, humanSidebarSide: sidebarSide, humanAutoHideTabs: autoHideTabs, sidebarSide: s.settings.agentSidebarSide, autoHideTabs: s.settings.agentAutoHideTabs };
}
