import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  Animated,
} from "react-native";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

// Foundation Design System Colors
const variantStyles: Record<ButtonVariant, {
  bg: string;
  bgPressed: string;
  text: string;
  border?: string;
}> = {
  primary: {
    bg: "#3080D8",      // Groundwork Blue 500
    bgPressed: "#1E4F8E", // Groundwork Blue 700
    text: "#FFFFFF"
  },
  secondary: {
    bg: "#22C772",      // Growth Green 500
    bgPressed: "#15854B", // Growth Green 700
    text: "#FFFFFF"
  },
  outline: {
    bg: "transparent",
    bgPressed: "#F0F7FE", // Primary 50
    text: "#3080D8",    // Groundwork Blue 500
    border: "#3080D8"
  },
  ghost: {
    bg: "transparent",
    bgPressed: "#ECEEF0", // Slate 100
    text: "#6F7E8A"     // Slate 500
  },
  danger: {
    bg: "#F06050",      // Bucket Spend (Coral)
    bgPressed: "#B53028", // Bucket Spend 700
    text: "#FFFFFF"
  },
};

// Foundation Design System Sizes
const sizeStyles: Record<ButtonSize, {
  height: number;
  paddingHorizontal: number;
  fontSize: number;
  borderRadius: number;
}> = {
  sm: { height: 36, paddingHorizontal: 16, fontSize: 14, borderRadius: 8 },
  md: { height: 48, paddingHorizontal: 24, fontSize: 16, borderRadius: 12 },
  lg: { height: 56, paddingHorizontal: 32, fontSize: 18, borderRadius: 12 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.base,
          {
            backgroundColor: variantStyle.bg,
            height: sizeStyle.height,
            paddingHorizontal: sizeStyle.paddingHorizontal,
            borderColor: variantStyle.border,
            borderWidth: variantStyle.border ? 2 : 0,
            borderRadius: sizeStyle.borderRadius,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variantStyle.text} />
        ) : (
          <Text
            style={[
              styles.text,
              { color: variantStyle.text, fontSize: sizeStyle.fontSize },
            ]}
          >
            {children}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    // Elevation 1 shadow
    shadowColor: "#0C1117",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "600",
  },
});
