import { memo, useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { usePageProgress } from "../../state/tabs/pageProgress";
import { curve, ProgressTrack } from "../ui";
import { TOOLBAR_MOTION } from "./tokens";

const PROGRESS = { height: 1.5, floor: 0.08, opacity: 0.85 } as const;
const PLACE = { position: "absolute", left: 0, right: 0, bottom: 0, opacity: PROGRESS.opacity } as const;

export const TabProgressBar = memo(function TabProgressBar({ tabId, color }: { tabId: string; color: string }) {
  return <ProgressBar progress={usePageProgress(tabId)} color={color} />;
});

export function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = useRef(new Animated.Value(Math.max(progress, PROGRESS.floor))).current;
  const shownFor = useRef(Math.max(progress, PROGRESS.floor));
  useEffect(() => {
    const to = Math.max(progress, PROGRESS.floor);
    if (shownFor.current === to) return;
    shownFor.current = to;
    Animated.timing(width, { toValue: to, duration: TOOLBAR_MOTION.progress, easing: curve.enter, useNativeDriver: false }).start();
  }, [progress]);
  return <ProgressTrack value={width} height={PROGRESS.height} color={color} track={false} style={PLACE} />;
}

// (fork) Zen-style loading pill: a short rounded bar centred where the domain sits, in the page ink, standing in
// for the domain while the tab loads (instead of a hairline along the toolbar's bottom edge)
const PILL = { width: 40, height: 4, fill: 0.45, track: 0.15 } as const;

export const LoadingPill = memo(function LoadingPill({ tabId, color }: { tabId: string; color: string }) {
  const progress = usePageProgress(tabId);
  const width = useRef(new Animated.Value(Math.max(progress, PROGRESS.floor))).current;
  const shownFor = useRef(Math.max(progress, PROGRESS.floor));
  useEffect(() => {
    const to = Math.max(progress, PROGRESS.floor);
    if (shownFor.current === to) return;
    shownFor.current = to;
    Animated.timing(width, { toValue: to, duration: TOOLBAR_MOTION.progress, easing: curve.enter, useNativeDriver: false }).start();
  }, [progress]);
  return (
    <View pointerEvents="none" style={{ width: PILL.width, height: PILL.height, borderRadius: PILL.height / 2, overflow: "hidden" }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: color, opacity: PILL.track }} />
      <Animated.View
        style={{
          height: PILL.height,
          borderRadius: PILL.height / 2,
          backgroundColor: color,
          opacity: PILL.fill,
          width: width.interpolate({ inputRange: [0, 1], outputRange: [0, PILL.width] }),
        }}
      />
    </View>
  );
});
