import { memo, useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
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
    Animated.timing(width, { toValue: to, duration: TOOLBAR_MOTION.show, /* (fork) upstream dropped TOOLBAR_MOTION.progress; same 150 ms */ easing: curve.enter, useNativeDriver: false }).start();
  }, [progress]);
  return <ProgressTrack value={width} height={PROGRESS.height} color={color} track={false} style={PLACE} />;
}

// (fork) Zen-style loading pill: a short rounded track centred where the domain sits, standing in for the domain
// while the tab loads. A brighter bar stretches out from the left, then its tail catches up and it leaves on the
// right, over and over (no real progress shown).
const PILL = { width: 40, height: 4, fill: 0.85, track: 0.2, cycle: 1100 } as const;

export const LoadingPill = memo(function LoadingPill({ color }: { color: string }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // left and width are layout props, so this runs on the JS driver; the pill is tiny
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: PILL.cycle, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View pointerEvents="none" style={{ width: PILL.width, height: PILL.height, borderRadius: PILL.height / 2, overflow: "hidden" }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: color, opacity: PILL.track }} />
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          height: PILL.height,
          borderRadius: PILL.height / 2,
          backgroundColor: color,
          opacity: PILL.fill,
          left: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, PILL.width] }),
          width: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, PILL.width, 0] }),
        }}
      />
    </View>
  );
});
