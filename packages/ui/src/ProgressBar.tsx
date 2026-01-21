import React from "react";
import { View, StyleSheet } from "react-native";

export type ProgressBarVariant = "primary" | "secondary" | "accent" | "spend" | "save" | "give" | "invest";

interface ProgressBarProps {
  progress: number; // 0-100
  variant?: ProgressBarVariant;
  height?: number;
  showBackground?: boolean;
}

// Foundation Design System Colors
const variantColors: Record<ProgressBarVariant, string> = {
  primary: "#3080D8",   // Groundwork Blue
  secondary: "#22C772", // Growth Green
  accent: "#F59315",    // Amber Reward
  spend: "#F06050",     // Coral Action
  save: "#38BDF8",      // Sky Possibility
  give: "#A78BFA",      // Lavender Heart
  invest: "#84CC16",    // Sage Wisdom
};

export function ProgressBar({
  progress,
  variant = "primary",
  height = 8,
  showBackground = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View
      style={[
        styles.background,
        {
          height,
          backgroundColor: showBackground ? "#ECEEF0" : "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: variantColors[variant],
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    borderRadius: 9999,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 9999,
  },
});
