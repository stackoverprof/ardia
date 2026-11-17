// (fork) Agent mode: the agents' profile and each mode's own sidebar layout
import assert from "node:assert/strict";
import { test } from "node:test";
const { agentProfileIdOf, humanProfileIdOf, modeSwap } = await import("./agentMode.ts");

const scope = (settings = {}) => ({
  profiles: { me: { id: "me", name: "Erbin" }, bot: { id: "bot", name: "Claude" }, work: { id: "work", name: "Work" } },
  profileOrder: ["me", "bot", "work"],
  settings: { agentProfileId: "", humanProfileId: "", sidebarSide: "left", autoHideTabs: true, agentSidebarSide: "right", agentAutoHideTabs: false, humanSidebarSide: "left", humanAutoHideTabs: true, ...settings },
});

test("the agents' profile is the one named Claude unless another is chosen", () => {
  assert.equal(agentProfileIdOf(scope()), "bot");
  assert.equal(agentProfileIdOf(scope({ agentProfileId: "work" })), "work");
  assert.equal(agentProfileIdOf(scope({ agentProfileId: "gone" })), "bot");
});

test("Human mode goes back to the last human profile, else the first that isn't the agents'", () => {
  assert.equal(humanProfileIdOf(scope()), "me");
  assert.equal(humanProfileIdOf(scope({ humanProfileId: "work" })), "work");
  assert.equal(humanProfileIdOf(scope({ humanProfileId: "bot" })), "me");
});

test("crossing modes saves the leaving mode's layout and applies the other's; staying in a mode changes nothing", () => {
  assert.equal(modeSwap(scope(), "me", "work"), null);
  assert.deepEqual(modeSwap(scope(), "me", "bot"), { humanProfileId: "me", humanSidebarSide: "left", humanAutoHideTabs: true, sidebarSide: "right", autoHideTabs: false });
  const inAgent = scope({ sidebarSide: "left", autoHideTabs: false });
  assert.deepEqual(modeSwap(inAgent, "bot", "work"), { agentSidebarSide: "left", agentAutoHideTabs: false, sidebarSide: "left", autoHideTabs: true });
});
