// (fork) Agent mode's toolbar: diagonal caution-tape stripes, a shade darker or lighter than the site's own tint
// (the page's ink at low opacity), so a window in the agents' profile is never mistaken for a human one.
import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";

const STRIPE = { width: 18, pitch: 36, opacity: 0.1 } as const; // stripe and gap the same width

export const HazardStripes = memo(function HazardStripes({ color }: { color: string }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width, height } = size;
  const count = width && height ? Math.ceil((width + 2 * height) / STRIPE.pitch) : 0;
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: i * STRIPE.pitch - height,
            top: -height,
            width: STRIPE.width,
            height: height * 3,
            backgroundColor: color,
            opacity: STRIPE.opacity,
            transform: [{ rotate: "-45deg" }],
          }}
        />
      ))}
    </View>
  );
});
