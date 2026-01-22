import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

interface StreakBadgeProps {
  count: number;
  type: "daily" | "savings" | "chores";
  isActive: boolean;
  longestStreak?: number;
  daysRemaining?: number;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

const STREAK_CONFIG = {
  daily: {
    icon: "🔥",
    label: "Day Streak",
    activeColor: "#EF4444",
    activeBg: "#FEE2E2",
  },
  savings: {
    icon: "💰",
    label: "Savings Streak",
    activeColor: "#22C772",
    activeBg: "#DCFCE7",
  },
  chores: {
    icon: "⭐",
    label: "Chore Streak",
    activeColor: "#F59315",
    activeBg: "#FEF3C7",
  },
};

export function StreakBadge({
  count,
  type,
  isActive,
  longestStreak,
  daysRemaining,
  size = "md",
  style,
}: StreakBadgeProps) {
  const config = STREAK_CONFIG[type];

  const sizeStyles = {
    sm: { container: styles.containerSm, count: styles.countSm, icon: 16 },
    md: { container: styles.containerMd, count: styles.countMd, icon: 24 },
    lg: { container: styles.containerLg, count: styles.countLg, icon: 32 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor: isActive ? config.activeBg : "#F3F4F6" },
        style,
      ]}
    >
      {/* Icon and Count */}
      <View style={styles.mainContent}>
        <Text style={{ fontSize: currentSize.icon }}>{config.icon}</Text>
        <Text
          style={[
            styles.count,
            currentSize.count,
            { color: isActive ? config.activeColor : "#9CA3AF" },
          ]}
        >
          {count}
        </Text>
      </View>

      {/* Label */}
      <Text style={[styles.label, !isActive && styles.inactiveLabel]}>
        {config.label}
      </Text>

      {/* Status indicators */}
      {isActive && daysRemaining && daysRemaining <= 2 && (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>
            {daysRemaining === 1 ? "1 day left!" : `${daysRemaining} days left`}
          </Text>
        </View>
      )}

      {!isActive && count > 0 && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Ended</Text>
        </View>
      )}

      {/* Longest streak indicator */}
      {longestStreak && longestStreak > count && (
        <Text style={styles.longestStreak}>Best: {longestStreak}</Text>
      )}
      {longestStreak && count >= longestStreak && count > 1 && (
        <View style={[styles.recordBadge, { backgroundColor: config.activeColor }]}>
          <Text style={styles.recordText}>New Record!</Text>
        </View>
      )}
    </View>
  );
}

// Compact streak display for headers
export function StreakBadgeCompact({
  count,
  type,
  isActive,
}: Pick<StreakBadgeProps, "count" | "type" | "isActive">) {
  const config = STREAK_CONFIG[type];

  return (
    <View
      style={[
        styles.compactContainer,
        { backgroundColor: isActive ? config.activeBg : "#F3F4F6" },
      ]}
    >
      <Text style={styles.compactIcon}>{config.icon}</Text>
      <Text
        style={[
          styles.compactCount,
          { color: isActive ? config.activeColor : "#9CA3AF" },
        ]}
      >
        {count}
      </Text>
    </View>
  );
}

// Streak progress ring
export function StreakProgress({
  current,
  target,
  type,
  label,
}: {
  current: number;
  target: number;
  type: "daily" | "savings" | "chores";
  label?: string;
}) {
  const config = STREAK_CONFIG[type];
  const progress = Math.min(current / target, 1);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressRing}>
        {/* Background Circle */}
        <View style={styles.progressBgCircle} />

        {/* Progress indicator (simplified - would need SVG for actual ring) */}
        <View
          style={[
            styles.progressIndicator,
            {
              backgroundColor: config.activeColor,
              transform: [{ rotate: `${progress * 360}deg` }],
            },
          ]}
        />

        {/* Center content */}
        <View style={styles.progressCenter}>
          <Text style={{ fontSize: 24 }}>{config.icon}</Text>
          <Text style={[styles.progressCount, { color: config.activeColor }]}>
            {current}/{target}
          </Text>
        </View>
      </View>

      {label && <Text style={styles.progressLabel}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  containerSm: {
    padding: 10,
    borderRadius: 12,
  },
  containerMd: {
    padding: 16,
    borderRadius: 16,
  },
  containerLg: {
    padding: 20,
    borderRadius: 20,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  count: {
    fontWeight: "800",
  },
  countSm: {
    fontSize: 20,
  },
  countMd: {
    fontSize: 28,
  },
  countLg: {
    fontSize: 36,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  inactiveLabel: {
    color: "#9CA3AF",
  },
  warningBadge: {
    marginTop: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D97706",
  },
  inactiveBadge: {
    marginTop: 8,
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  longestStreak: {
    marginTop: 8,
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  recordBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  compactIcon: {
    fontSize: 14,
  },
  compactCount: {
    fontSize: 14,
    fontWeight: "700",
  },
  // Progress styles
  progressContainer: {
    alignItems: "center",
  },
  progressRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  progressBgCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    borderWidth: 6,
    borderColor: "#E5E7EB",
  },
  progressIndicator: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 4,
    left: "50%",
    marginLeft: -6,
  },
  progressCenter: {
    alignItems: "center",
  },
  progressCount: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});
