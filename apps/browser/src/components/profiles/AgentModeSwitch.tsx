// (fork) The Human / Agent switch at the very bottom of the sidebar. Agent mode is the agents' profile (see
// state/profiles/agentMode.ts); Human mode goes back to the last human profile used.
import { Pressable, View } from "react-native";
import { useBrowser } from "../../state/browser/store";
import { switchProfile } from "../../state/browser/actions";
import { agentProfileIdOf, humanProfileIdOf } from "../../state/profiles/agentMode";
import { useIsIncognito, useWindowProfileId } from "../../state/browser/hooks";
import { radius, Symbol, Text, useHover, useTheme } from "../ui";

export const AGENT_SWITCH_HEIGHT = 40;
const TRACK = 28;
const INSET = 2;

export function useAgentSwitchShown(): boolean {
  const incognito = useIsIncognito();
  const ready = useBrowser((s) => !!agentProfileIdOf(s) && !!humanProfileIdOf(s));
  return !incognito && ready;
}

export function AgentModeSwitch({ windowId, edge }: { windowId: string; edge: number }) {
  const theme = useTheme();
  const current = useWindowProfileId();
  const agentId = useBrowser((s) => agentProfileIdOf(s));
  const humanId = useBrowser((s) => humanProfileIdOf(s));
  const agent = !!agentId && current === agentId;
  const go = (toAgent: boolean) => {
    const target = toAgent ? agentId : humanId;
    if (target && target !== current) switchProfile(windowId, target, true);
  };
  return (
    <View style={{ height: AGENT_SWITCH_HEIGHT, paddingHorizontal: edge, justifyContent: "center" }}>
      <View style={{ height: TRACK, borderRadius: radius.chrome, flexDirection: "row", padding: INSET, backgroundColor: theme.tabHover }}>
        <Half on={!agent} icon="person.fill" title="Human" onPress={() => go(false)} />
        <Half on={agent} icon="sparkles" title="Agent" onPress={() => go(true)} />
      </View>
    </View>
  );
}

function Half({ on, icon, title, onPress }: { on: boolean; icon: string; title: string; onPress: () => void }) {
  const theme = useTheme();
  const { hovered, hoverProps } = useHover();
  const ink = on ? theme.rowSelectedText : theme.textSecondary;
  return (
    <Pressable {...hoverProps} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${title} mode`} accessibilityState={{ selected: on }} onPress={onPress}>
      <View
        style={{
          flex: 1,
          borderRadius: radius.chrome - INSET,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          backgroundColor: on ? theme.tabSelected : hovered ? theme.tabHover : undefined,
        }}
      >
        <Symbol name={icon} size={11} weight="semibold" color={ink} style={{ width: 14, height: 14 }} />
        <Text size="small" weight={on ? "semibold" : "regular"} style={{ color: ink }}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}
