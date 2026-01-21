import React from "react";
import { View, Text, StyleSheet } from "react-native";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "primary" | "spend" | "save" | "give" | "invest";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

// Foundation Design System Colors
const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "#ECEEF0", text: "#384452" },       // Slate
  success: { bg: "#DCFAE9", text: "#15854B" },       // Growth Green
  warning: { bg: "#FEF0D9", text: "#AC5F0B" },       // Amber Reward
  error: { bg: "#FEE7E5", text: "#B53028" },         // Coral Action
  info: { bg: "#E0EEFC", text: "#1E4F8E" },          // Groundwork Blue
  primary: { bg: "#E0EEFC", text: "#3080D8" },       // Groundwork Blue
  spend: { bg: "#FEE7E5", text: "#F06050" },         // Coral Action
  save: { bg: "#E0F5FF", text: "#0EA5E9" },          // Sky Possibility
  give: { bg: "#F3EFFF", text: "#A78BFA" },          // Lavender Heart
  invest: { bg: "#ECFCCB", text: "#65A30D" },        // Sage Wisdom
};

export function Badge({ variant = "default", children }: BadgeProps) {
  const { bg, text } = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4, // sm radius
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontFamily: "Outfit_500Medium",
    fontWeight: "500",
  },
});
