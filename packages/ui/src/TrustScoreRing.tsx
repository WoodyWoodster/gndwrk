import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export type TrustTier = "excellent" | "strong" | "growing" | "building";

// Trust Score Tiers
const tierConfig: Record<TrustTier, {
  label: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  minScore: number;
  maxScore: number;
}> = {
  excellent: {
    label: "Excellent",
    color: "#F59315",      // Amber Reward
    gradientStart: "#F7AC47",
    gradientEnd: "#F59315",
    minScore: 750,
    maxScore: 850,
  },
  strong: {
    label: "Strong",
    color: "#22C772",      // Growth Green
    gradientStart: "#4DD98F",
    gradientEnd: "#22C772",
    minScore: 650,
    maxScore: 749,
  },
  growing: {
    label: "Growing",
    color: "#38BDF8",      // Sky Blue
    gradientStart: "#7CD8FC",
    gradientEnd: "#38BDF8",
    minScore: 550,
    maxScore: 649,
  },
  building: {
    label: "Building",
    color: "#6F7E8A",      // Slate
    gradientStart: "#94A0AB",
    gradientEnd: "#6F7E8A",
    minScore: 300,
    maxScore: 549,
  },
};

function getTierFromScore(score: number): TrustTier {
  if (score >= 750) return "excellent";
  if (score >= 650) return "strong";
  if (score >= 550) return "growing";
  return "building";
}

interface TrustScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  showLabel?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function TrustScoreRing({
  score,
  size = "lg",
  animated = true,
  showLabel = true,
}: TrustScoreRingProps) {
  const tier = getTierFromScore(score);
  const config = tierConfig[tier];

  // Size configurations
  const sizeConfig = {
    sm: { diameter: 120, strokeWidth: 8, fontSize: 32, labelSize: 12 },
    md: { diameter: 180, strokeWidth: 10, fontSize: 48, labelSize: 14 },
    lg: { diameter: 240, strokeWidth: 12, fontSize: 64, labelSize: 16 },
  };

  const { diameter, strokeWidth, fontSize, labelSize } = sizeConfig[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (300-850 range normalized to 0-1)
  const minScore = 300;
  const maxScore = 850;
  const normalizedScore = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));
  const strokeDashoffset = circumference * (1 - normalizedScore);

  // Animations
  const progressAnim = useRef(new Animated.Value(circumference)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = React.useState(0);

  useEffect(() => {
    if (animated) {
      // Scale in
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Progress ring animation
      Animated.timing(progressAnim, {
        toValue: strokeDashoffset,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Score counter animation
      Animated.timing(scoreAnim, {
        toValue: score,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Update display score
      const listener = scoreAnim.addListener(({ value }) => {
        setDisplayScore(Math.round(value));
      });

      return () => {
        scoreAnim.removeListener(listener);
      };
    } else {
      progressAnim.setValue(strokeDashoffset);
      setDisplayScore(score);
    }
  }, [score, animated]);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: diameter, height: diameter },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Svg width={diameter} height={diameter}>
        <Defs>
          <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={config.gradientStart} />
            <Stop offset="100%" stopColor={config.gradientEnd} />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="#ECEEF0"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressAnim}
          transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={[styles.score, { fontSize, color: config.color }]}>
          {displayScore}
        </Text>
        {showLabel && (
          <Text style={[styles.label, { fontSize: labelSize, color: config.color }]}>
            {config.label}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// Compact badge version for dashboard
interface TrustScoreBadgeProps {
  score: number;
  onPress?: () => void;
}

export function TrustScoreBadge({ score, onPress }: TrustScoreBadgeProps) {
  const tier = getTierFromScore(score);
  const config = tierConfig[tier];

  const Content = () => (
    <View style={[styles.badge, { backgroundColor: config.color + "15" }]}>
      <View style={[styles.badgeIcon, { backgroundColor: config.color }]}>
        <Text style={styles.badgeIconText}>🏆</Text>
      </View>
      <Text style={[styles.badgeScore, { color: config.color }]}>{score}</Text>
    </View>
  );

  if (onPress) {
    return (
      <View style={{ padding: 4 }}>
        <Content />
      </View>
    );
  }

  return <Content />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontFamily: "JetBrainsMono_700Bold",
    fontWeight: "700",
  },
  label: {
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    gap: 8,
  },
  badgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconText: {
    fontSize: 12,
  },
  badgeScore: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontWeight: "600",
    fontSize: 16,
  },
});

export { tierConfig, getTierFromScore };
