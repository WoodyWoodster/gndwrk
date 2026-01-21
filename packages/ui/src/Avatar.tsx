import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  size?: AvatarSize;
  name?: string;
  imageUrl?: string;
  backgroundColor?: string;
}

const sizeValues: Record<AvatarSize, { container: number; text: number }> = {
  sm: { container: 32, text: 14 },
  md: { container: 40, text: 16 },
  lg: { container: 56, text: 22 },
  xl: { container: 80, text: 32 },
};

export function Avatar({
  size = "md",
  name,
  imageUrl,
  backgroundColor = "#E0E7FF",
}: AvatarProps) {
  const sizeStyle = sizeValues[size];
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeStyle.container,
          height: sizeStyle.container,
          borderRadius: sizeStyle.container / 2,
          backgroundColor: imageUrl ? "transparent" : backgroundColor,
        },
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: sizeStyle.container,
            height: sizeStyle.container,
            borderRadius: sizeStyle.container / 2,
          }}
        />
      ) : (
        <Text style={[styles.text, { fontSize: sizeStyle.text }]}>
          {initials || "?"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  text: {
    fontWeight: "600",
    color: "#4F46E5",
  },
});
