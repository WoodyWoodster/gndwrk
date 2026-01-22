import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type EmptyStateVariant =
  | "transactions"
  | "chores"
  | "savings"
  | "achievements"
  | "notifications"
  | "search"
  | "generic";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

// Default content for each variant
const variantContent: Record<
  EmptyStateVariant,
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBgColor: string;
    title: string;
    description: string;
    actionLabel?: string;
  }
> = {
  transactions: {
    icon: "receipt-outline",
    iconColor: "#3080D8",
    iconBgColor: "#EFF6FF",
    title: "No transactions yet",
    description:
      "When you earn, spend, or save money, your transactions will appear here.",
    actionLabel: "Start earning",
  },
  chores: {
    icon: "briefcase-outline",
    iconColor: "#22C772",
    iconBgColor: "#ECFDF5",
    title: "No chores available",
    description:
      "Ask your parents to create some chores for you to earn money!",
    actionLabel: "Refresh",
  },
  savings: {
    icon: "flag-outline",
    iconColor: "#38BDF8",
    iconBgColor: "#F0F9FF",
    title: "No savings goals yet",
    description:
      "Set a goal for something you want to save up for, like a new toy or gadget!",
    actionLabel: "Create a goal",
  },
  achievements: {
    icon: "trophy-outline",
    iconColor: "#F59315",
    iconBgColor: "#FFF7ED",
    title: "No achievements yet",
    description:
      "Complete tasks, save money, and build your Trust Score to earn achievements!",
    actionLabel: "See how to earn",
  },
  notifications: {
    icon: "notifications-outline",
    iconColor: "#A78BFA",
    iconBgColor: "#F5F3FF",
    title: "All caught up!",
    description: "You have no new notifications. Check back later!",
  },
  search: {
    icon: "search-outline",
    iconColor: "#6B7280",
    iconBgColor: "#F9FAFB",
    title: "No results found",
    description: "Try adjusting your search or filters to find what you're looking for.",
    actionLabel: "Clear search",
  },
  generic: {
    icon: "folder-open-outline",
    iconColor: "#6B7280",
    iconBgColor: "#F9FAFB",
    title: "Nothing here yet",
    description: "Check back later for updates.",
  },
};

export function EmptyState({
  variant = "generic",
  title,
  description,
  icon,
  iconColor,
  iconBgColor,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  const defaultContent = variantContent[variant];

  const displayIcon = icon ?? defaultContent.icon;
  const displayIconColor = iconColor ?? defaultContent.iconColor;
  const displayIconBgColor = iconBgColor ?? defaultContent.iconBgColor;
  const displayTitle = title ?? defaultContent.title;
  const displayDescription = description ?? defaultContent.description;
  const displayActionLabel = actionLabel ?? defaultContent.actionLabel;

  return (
    <View style={[styles.container, style]}>
      {/* Illustration/Icon */}
      <View style={[styles.iconContainer, { backgroundColor: displayIconBgColor }]}>
        <Ionicons name={displayIcon} size={48} color={displayIconColor} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{displayTitle}</Text>

      {/* Description */}
      <Text style={styles.description}>{displayDescription}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        {displayActionLabel && onAction && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: displayIconColor }]}
            onPress={onAction}
          >
            <Text style={styles.primaryButtonText}>{displayActionLabel}</Text>
          </TouchableOpacity>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryAction}>
            <Text style={[styles.secondaryButtonText, { color: displayIconColor }]}>
              {secondaryActionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Specialized empty state with fun illustrations for kids
export function KidFriendlyEmptyState({
  variant = "generic",
  title,
  description,
  emoji,
  actionLabel,
  onAction,
  style,
}: Omit<EmptyStateProps, "icon" | "iconColor" | "iconBgColor"> & {
  emoji?: string;
}) {
  const emojis: Record<EmptyStateVariant, string> = {
    transactions: "🧾",
    chores: "✨",
    savings: "🎯",
    achievements: "🏆",
    notifications: "🔔",
    search: "🔍",
    generic: "📦",
  };

  const defaultContent = variantContent[variant];
  const displayEmoji = emoji ?? emojis[variant];
  const displayTitle = title ?? defaultContent.title;
  const displayDescription = description ?? defaultContent.description;
  const displayActionLabel = actionLabel ?? defaultContent.actionLabel;

  return (
    <View style={[styles.container, style]}>
      {/* Emoji */}
      <Text style={styles.emoji}>{displayEmoji}</Text>

      {/* Title */}
      <Text style={styles.kidTitle}>{displayTitle}</Text>

      {/* Description */}
      <Text style={styles.kidDescription}>{displayDescription}</Text>

      {/* Action */}
      {displayActionLabel && onAction && (
        <TouchableOpacity style={styles.kidButton} onPress={onAction}>
          <Text style={styles.kidButtonText}>{displayActionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Kid-friendly styles
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  kidTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  kidDescription: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  kidButton: {
    marginTop: 24,
    backgroundColor: "#3080D8",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  kidButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
