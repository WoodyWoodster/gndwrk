import React from "react";
import { View, StyleSheet, ViewProps, TouchableOpacity, Animated } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  onPress?: () => void;
  children: React.ReactNode;
}

const paddingValues = {
  none: 0,
  sm: 12,
  md: 20,
  lg: 24,
};

export function Card({
  variant = "default",
  padding = "md",
  onPress,
  children,
  style,
  ...props
}: CardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const cardStyle = [
    styles.base,
    variant === "elevated" && styles.elevated,
    variant === "outlined" && styles.outlined,
    variant === "default" && styles.default,
    { padding: paddingValues[padding] },
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={cardStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          {...props}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  default: {
    // Elevation 2
    shadowColor: "#0C1117",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ECEEF0",
  },
  elevated: {
    // Elevation 3
    shadowColor: "#0C1117",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 3,
    borderRadius: 16,
  },
  outlined: {
    borderWidth: 1,
    borderColor: "#D8DDE2",
  },
});
