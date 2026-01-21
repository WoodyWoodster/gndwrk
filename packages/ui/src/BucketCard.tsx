import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewProps,
} from "react-native";

export type BucketType = "spend" | "save" | "give" | "invest";

// Foundation Design System Bucket Colors
const bucketConfig: Record<BucketType, {
  name: string;
  icon: string;
  bg: string;
  bgLight: string;
  border: string;
  color: string;
}> = {
  spend: {
    name: "Spend",
    icon: "bolt", // Lightning bolt
    bg: "#F06050",
    bgLight: "#FEF5F4",
    border: "#FDCFCB",
    color: "#F06050",
  },
  save: {
    name: "Save",
    icon: "diamond", // Crystal
    bg: "#38BDF8",
    bgLight: "#F0FAFF",
    border: "#B8E9FE",
    color: "#0EA5E9",
  },
  give: {
    name: "Give",
    icon: "hands", // Open hands
    bg: "#A78BFA",
    bgLight: "#FAF8FF",
    border: "#E9E0FF",
    color: "#A78BFA",
  },
  invest: {
    name: "Invest",
    icon: "seedling", // Seed
    bg: "#84CC16",
    bgLight: "#F7FEE7",
    border: "#D9F99D",
    color: "#84CC16",
  },
};

// Kid-friendly bucket names for young children (6-12)
const kidFriendlyNames: Record<BucketType, string> = {
  spend: "Fun Money",
  save: "Dreams",
  give: "Sharing",
  invest: "Growing",
};

interface BucketCardProps extends ViewProps {
  type: BucketType;
  balance: number;
  onPress?: () => void;
  kidMode?: boolean;
  compact?: boolean;
}

export function BucketCard({
  type,
  balance,
  onPress,
  kidMode = false,
  compact = false,
  style,
  ...props
}: BucketCardProps) {
  const config = bucketConfig[type];
  const displayName = kidMode ? kidFriendlyNames[type] : config.name;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 1.02,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const CardContent = () => (
    <View
      style={[
        styles.card,
        compact ? styles.cardCompact : styles.cardFull,
        {
          backgroundColor: config.bgLight,
          borderColor: config.border,
        },
        style,
      ]}
      {...props}
    >
      {/* Icon Circle */}
      <View
        style={[
          styles.iconCircle,
          compact ? styles.iconCircleCompact : styles.iconCircleFull,
          { backgroundColor: config.bg + "20" },
        ]}
      >
        <BucketIcon type={type} size={compact ? 20 : 24} color={config.color} />
      </View>

      {/* Content */}
      <View style={compact ? styles.contentCompact : styles.contentFull}>
        <Text
          style={[
            styles.label,
            compact ? styles.labelCompact : styles.labelFull,
            { color: config.color },
          ]}
        >
          {displayName}
        </Text>
        <Text
          style={[
            styles.balance,
            compact ? styles.balanceCompact : styles.balanceFull,
          ]}
        >
          {formatCurrency(balance)}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <CardContent />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <CardContent />;
}

// Simple bucket icons using basic shapes
function BucketIcon({
  type,
  size,
  color,
}: {
  type: BucketType;
  size: number;
  color: string;
}) {
  const iconMap: Record<BucketType, string> = {
    spend: "⚡",
    save: "💎",
    give: "🤲",
    invest: "🌱",
  };

  return (
    <Text style={{ fontSize: size, textAlign: "center" }}>
      {iconMap[type]}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    // Elevation 2 shadow
    shadowColor: "#0C1117",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardFull: {
    padding: 20,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  cardCompact: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleFull: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  iconCircleCompact: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  contentFull: {
    flex: 1,
  },
  contentCompact: {
    flex: 1,
  },
  label: {
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelFull: {
    fontSize: 12,
    marginBottom: 4,
  },
  labelCompact: {
    fontSize: 11,
    marginBottom: 2,
  },
  balance: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontWeight: "600",
    color: "#151C24",
  },
  balanceFull: {
    fontSize: 28,
  },
  balanceCompact: {
    fontSize: 20,
  },
});

export { bucketConfig, kidFriendlyNames };
