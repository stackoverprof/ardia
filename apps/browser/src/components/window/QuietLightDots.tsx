// (fork) Quiet traffic lights, like the Zen mod: at rest the lights are plain dots in the surrounding ink, and the
// real coloured lights come back on hover. The native side hides the real buttons and shows them on hover; the dots
// are drawn here, as content of whatever holds the lights (the toolbar, or the sidebar), at the buttons' own frames.
// Several places can hold a window's lights over time, so each claims them under its own key and the window is
// quiet while any claim is on.
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { setTrafficLightsQuiet, trafficLightsFrames } from "../../platform/windows";

const claims = new Map<string, Map<string, boolean>>();

function claim(windowId: string, owner: string, on: boolean, lightInk: boolean) {
  const mine = claims.get(windowId) ?? new Map<string, boolean>();
  claims.set(windowId, mine);
  if (on) mine.set(owner, lightInk);
  else mine.delete(owner);
  const inks = [...mine.values()];
  void setTrafficLightsQuiet(windowId, inks.length > 0, inks.length ? inks[inks.length - 1]! : false);
}

export function QuietLightDots({ windowId, owner, on, color, lightInk, refresh }: { windowId: string; owner: string; on: boolean; color: string; lightInk: boolean; refresh?: unknown }) {
  useEffect(() => {
    claim(windowId, owner, on, lightInk);
  }, [windowId, owner, on, lightInk]);
  useEffect(() => () => claim(windowId, owner, false, false), [windowId, owner]);
  const box = useRef<View>(null);
  const [dots, setDots] = useState<number[][]>([]);
  useEffect(() => {
    if (!on) return setDots([]);
    let live = true;
    const place = () =>
      void trafficLightsFrames(windowId).then((frames) => {
        box.current?.measureInWindow((x, y) => {
          if (live) setDots(frames.map(([fx = 0, fy = 0, w = 0, h = 0]) => [fx - x, fy - y, Math.min(w, h), w, h]));
        });
      });
    const timers = [60, 400, 1200].map((ms) => setTimeout(place, ms));
    return () => {
      live = false;
      timers.forEach(clearTimeout);
    };
  }, [windowId, on, refresh]);
  return (
    <View ref={box} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map(([x = 0, y = 0, side = 0, w = 0, h = 0], i) => (
        <View key={i} style={{ position: "absolute", left: x + (w - side) / 2, top: y + (h - side) / 2, width: side, height: side, borderRadius: side / 2, backgroundColor: color, opacity: 0.22 }} />
      ))}
    </View>
  );
}
