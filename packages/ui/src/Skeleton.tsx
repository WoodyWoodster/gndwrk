import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewProps, Dimensions, DimensionValue } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SkeletonProps extends ViewProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius,
  variant = "rectangular",
  style,
  ...props
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const getVariantStyle = () => {
    switch (variant) {
      case "text":
        return { borderRadius: borderRadius ?? 4 };
      case "circular":
        return { borderRadius: typeof width === "number" ? width / 2 : 50 };
      case "rectangular":
      default:
        return { borderRadius: borderRadius ?? 8 };
    }
  };

  return (
    <View
      style={[
        styles.skeleton,
        getVariantStyle(),
        {
          width,
          height,
        },
        style,
      ]}
      {...props}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

// Pre-built skeleton components for common patterns
export function SkeletonText({
  lines = 1,
  lastLineWidth = "60%",
}: {
  lines?: number;
  lastLineWidth?: DimensionValue;
}) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={14}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : "100%"}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </View>
      </View>
      <View style={{ marginTop: 16 }}>
        <SkeletonText lines={3} />
      </View>
    </View>
  );
}

// Dashboard-specific skeletons
export function SkeletonBucketCard() {
  return (
    <View style={styles.bucketCard}>
      <View style={styles.bucketHeader}>
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width={60} height={14} style={{ marginLeft: 8 }} />
      </View>
      <Skeleton variant="text" width={80} height={28} style={{ marginTop: 12 }} />
    </View>
  );
}

export function SkeletonBalanceCard() {
  return (
    <View style={styles.balanceCard}>
      <Skeleton variant="text" width={100} height={12} />
      <Skeleton variant="text" width={150} height={36} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
        <Skeleton borderRadius={20} width={100} height={40} />
        <Skeleton borderRadius={20} width={80} height={40} />
      </View>
    </View>
  );
}

export function SkeletonTransaction() {
  return (
    <View style={styles.transaction}>
      <SkeletonAvatar size={40} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="text" width="40%" height={12} style={{ marginTop: 4 }} />
      </View>
      <Skeleton variant="text" width={60} height={16} />
    </View>
  );
}

export function SkeletonTransactionList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.transactionList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>
          <SkeletonTransaction />
          {index < count - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

// Full dashboard skeleton
export function DashboardSkeleton() {
  return (
    <View style={styles.dashboard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View>
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="text" width={120} height={24} style={{ marginTop: 4 }} />
        </View>
        <Skeleton variant="circular" width={48} height={48} />
      </View>

      {/* Balance Card */}
      <SkeletonBalanceCard />

      {/* Buckets */}
      <View style={{ marginTop: 24 }}>
        <Skeleton variant="text" width={100} height={20} />
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <SkeletonBucketCard />
          </View>
          <View style={{ flex: 1 }}>
            <SkeletonBucketCard />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <SkeletonBucketCard />
          </View>
          <View style={{ flex: 1 }}>
            <SkeletonBucketCard />
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Skeleton variant="text" width={120} height={20} />
          <Skeleton variant="text" width={60} height={16} />
        </View>
        <View style={{ marginTop: 16 }}>
          <SkeletonTransactionList count={3} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: "40%",
    transform: [{ skewX: "-20deg" }],
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0C1117",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  bucketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0C1117",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  bucketHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceCard: {
    backgroundColor: "#3080D8",
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  transactionList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0C1117",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  dashboard: {
    flex: 1,
    padding: 16,
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
});
