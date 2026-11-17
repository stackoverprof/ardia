// (fork) The Human / Agent switch at the very bottom of the sidebar. Agent mode is the agents' profile (see
// state/profiles/agentMode.ts); Human mode goes back to the last human profile used.
import { Pressable, View } from "react-native";
import { useBrowser } from "../../state/browser/store";
import { switchProfile } from "../../state/browser/actions";
import { agentProfileIdOf, humanProfileIdOf } from "../../state/profiles/agentMode";
import { useIsIncognito, useWindowProfileId } from "../../state/browser/hooks";
import { radius, Symbol, Text, useHover, useTheme } from "../ui";

export const AGENT_SWITCH_HEIGHT = 40;
const ROW = 32;
const PAD = 9;

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
  const { hovered, hoverProps } = useHover();
  const title = agent ? "Agent mode" : "Human mode";
  const other = agent ? "Human mode" : "Agent mode";
  const ink = hovered ? theme.textPrimary : theme.textSecondary;
  const go = () => {
    const target = agent ? humanId : agentId;
    if (target && target !== current) switchProfile(windowId, target, true);
  };
  // one row, "(icon) Human mode  ->": it shows the mode you're in, and a press switches to the other
  return (
    <View style={{ height: AGENT_SWITCH_HEIGHT, paddingHorizontal: edge, justifyContent: "center" }}>
      <Pressable {...hoverProps} tooltip={`Switch to ${other}`} accessibilityRole="button" accessibilityLabel={`${title}, switch to ${other}`} onPress={go}>
        {({ pressed }) => (
          <View
            style={{
              height: ROW,
              borderRadius: radius.chrome,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: PAD,
              gap: 7,
              backgroundColor: pressed ? theme.tabPressed : hovered ? theme.tabHover : undefined,
            }}
          >
            <Symbol name={agent ? "sparkles" : "person.fill"} size={12} weight="semibold" color={ink} style={{ width: 16, height: 16 }} />
            <Text numberOfLines={1} weight="semibold" style={{ flex: 1, color: ink }}>
              {title}
            </Text>
            <Symbol name="arrow.right" size={11} weight="semibold" color={ink} style={{ width: 14, height: 14, opacity: hovered ? 1 : 0.7 }} />
          </View>
        )}
      </Pressable>
    </View>
  );
}
