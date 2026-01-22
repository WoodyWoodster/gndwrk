import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description?: string;
  isUnlocked: boolean;
  unlockedAt?: number;
  points?: number;
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
  style?: ViewStyle;
}

export function AchievementBadge({
  icon,
  name,
  description,
  isUnlocked,
  unlockedAt,
  points,
  size = "md",
  onPress,
  style,
}: AchievementBadgeProps) {
  const sizeStyles = {
    sm: {
      container: styles.containerSm,
      iconSize: styles.iconSm,
      name: styles.nameSm,
      description: styles.descriptionSm,
    },
    md: {
      container: styles.containerMd,
      iconSize: styles.iconMd,
      name: styles.nameMd,
      description: styles.descriptionMd,
    },
    lg: {
      container: styles.containerLg,
      iconSize: styles.iconLg,
      name: styles.nameLg,
      description: styles.descriptionLg,
    },
  };

  const currentSize = sizeStyles[size];

  const content = (
    <View
      style={[
        styles.container,
        currentSize.container,
        isUnlocked ? styles.unlocked : styles.locked,
        style,
      ]}
    >
      {/* Icon Container */}
      <View
        style={[
          styles.iconContainer,
          currentSize.iconSize,
          isUnlocked ? styles.iconUnlocked : styles.iconLocked,
        ]}
      >
        <Text style={[styles.icon, !isUnlocked && styles.iconGray]}>
          {icon}
        </Text>
        {!isUnlocked && <View style={styles.lockOverlay} />}
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.name,
            currentSize.name,
            !isUnlocked && styles.textLocked,
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {description && (
          <Text
            style={[
              styles.description,
              currentSize.description,
              !isUnlocked && styles.textLocked,
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}
        {isUnlocked && unlockedAt && (
          <Text style={styles.unlockedDate}>
            Unlocked {formatRelativeDate(unlockedAt)}
          </Text>
        )}
      </View>

      {/* Points Badge */}
      {points && (
        <View style={[styles.pointsBadge, !isUnlocked && styles.pointsLocked]}>
          <Text style={styles.pointsText}>+{points}</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Compact badge for lists
export function AchievementBadgeCompact({
  icon,
  name,
  isUnlocked,
  onPress,
}: Pick<AchievementBadgeProps, "icon" | "name" | "isUnlocked" | "onPress">) {
  const content = (
    <View style={[styles.compactContainer, !isUnlocked && styles.compactLocked]}>
      <Text style={[styles.compactIcon, !isUnlocked && styles.iconGray]}>
        {icon}
      </Text>
      <Text
        style={[styles.compactName, !isUnlocked && styles.textLocked]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// Achievement unlock notification
export function AchievementUnlockNotification({
  icon,
  name,
  points,
  onDismiss,
}: {
  icon: string;
  name: string;
  points?: number;
  onDismiss?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.notification}
      activeOpacity={0.9}
      onPress={onDismiss}
    >
      <View style={styles.notificationGlow} />
      <Text style={styles.notificationLabel}>Achievement Unlocked!</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationIcon}>{icon}</Text>
        <Text style={styles.notificationName}>{name}</Text>
      </View>
      {points && (
        <View style={styles.notificationPoints}>
          <Text style={styles.notificationPointsText}>+{points} points</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(timestamp).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
  },
  containerSm: {
    padding: 8,
    borderRadius: 12,
  },
  containerMd: {
    padding: 12,
    borderRadius: 16,
  },
  containerLg: {
    padding: 16,
    borderRadius: 20,
  },
  unlocked: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#F59315",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#FEF3C7",
  },
  locked: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
  iconSm: {
    width: 40,
    height: 40,
  },
  iconMd: {
    width: 56,
    height: 56,
  },
  iconLg: {
    width: 72,
    height: 72,
  },
  iconUnlocked: {
    backgroundColor: "#FEF3C7",
  },
  iconLocked: {
    backgroundColor: "#F3F4F6",
  },
  icon: {
    fontSize: 28,
  },
  iconGray: {
    opacity: 0.4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 9999,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: "600",
    color: "#1F2937",
  },
  nameSm: {
    fontSize: 14,
  },
  nameMd: {
    fontSize: 16,
  },
  nameLg: {
    fontSize: 18,
  },
  description: {
    color: "#6B7280",
    marginTop: 2,
  },
  descriptionSm: {
    fontSize: 11,
  },
  descriptionMd: {
    fontSize: 13,
  },
  descriptionLg: {
    fontSize: 14,
  },
  textLocked: {
    color: "#9CA3AF",
  },
  unlockedDate: {
    fontSize: 11,
    color: "#F59315",
    marginTop: 4,
    fontWeight: "500",
  },
  pointsBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  pointsLocked: {
    backgroundColor: "#F3F4F6",
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59315",
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  compactLocked: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  compactName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  // Notification styles
  notification: {
    backgroundColor: "#1F2937",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  notificationGlow: {
    position: "absolute",
    top: -50,
    left: "50%",
    marginLeft: -100,
    width: 200,
    height: 100,
    backgroundColor: "#F59315",
    opacity: 0.3,
    borderRadius: 100,
  },
  notificationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59315",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  notificationContent: {
    alignItems: "center",
  },
  notificationIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  notificationName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  notificationPoints: {
    marginTop: 16,
    backgroundColor: "rgba(245, 147, 21, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  notificationPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59315",
  },
});
