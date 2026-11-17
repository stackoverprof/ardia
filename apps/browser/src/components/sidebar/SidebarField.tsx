import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Button, concentric, type IconPalette } from "../ui";
import { useTheme } from "../ui/theme";
import { GlassFill, useGlass } from "../ui/Glass";
import { SIDEBAR_FIELD } from "./geometry";
import { CLAUDE_ORANGE, CLAUDE_ORANGE_HOVER, isClaudeApp } from "../../state/app/claudeApp";
import { useSidebarTokens } from "./tokens";

const FIELD_BORDER = StyleSheet.hairlineWidth;
const FIELD_BUTTON_BOX = 24;
const FIELD_BUTTON = {
  box: FIELD_BUTTON_BOX,
  inset: (SIDEBAR_FIELD.height - FIELD_BUTTON_BOX) / 2,
  radius: concentric(SIDEBAR_FIELD.radius, (SIDEBAR_FIELD.height - FIELD_BUTTON_BOX) / 2),
} as const;

export const SidebarFieldFill = memo(function SidebarFieldFill({
  hovered,
}: {
  hovered: boolean;
}) {
  const theme = useTheme();
  const glass = useGlass();
  // (fork) Bro-claude's address bar is Claude orange, so its window is never taken for Bro-wser
  if (isClaudeApp()) {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: SIDEBAR_FIELD.radius, backgroundColor: hovered ? CLAUDE_ORANGE_HOVER : CLAUDE_ORANGE }]} />;
  }
  if (glass) {
    return (
      <GlassFill state={hovered ? "lit" : "rest"} radius={SIDEBAR_FIELD.radius} />
    );
  }
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: SIDEBAR_FIELD.radius,
          borderWidth: FIELD_BORDER,
          borderColor: theme.pinnedRestingStroke,
          backgroundColor: hovered ? theme.tabHover : theme.pinnedResting,
        },
      ]}
    />
  );
});

export function FieldSiteButton({
  icon,
  color,
  tooltip,
  active,
  palette,
  onPress,
}: {
  icon: string;
  color?: string;
  tooltip: string;
  active: boolean;
  palette: IconPalette;
  onPress: () => void;
}) {
  const tokens = useSidebarTokens();
  return (
    <View
      style={{
        marginLeft: FIELD_BUTTON.inset,
        width: FIELD_BUTTON.box,
        height: FIELD_BUTTON.box,
        borderRadius: FIELD_BUTTON.radius,
        backgroundColor: tokens.fieldButtonPlate,
      }}
    >
      <Button
        variant="icon"
        toolbar
        palette={palette}
        icon={icon}
        color={color}
        look="field"
        active={active}
        onPress={onPress}
        tooltip={tooltip}
      />
    </View>
  );
}
