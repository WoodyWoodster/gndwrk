import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  shape: "square" | "circle" | "rectangle";
}

const COLORS = [
  "#3080D8", // Primary blue
  "#22C772", // Secondary green
  "#F59315", // Accent orange
  "#38BDF8", // Bucket save
  "#A78BFA", // Bucket give
  "#84CC16", // Bucket invest
  "#F06050", // Bucket spend
];

const SHAPES = ["square", "circle", "rectangle"] as const;

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

export function Confetti({
  isActive,
  duration = 3000,
  particleCount = 50,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!isActive) {
      setPieces([]);
      return;
    }

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }).map(
      (_, i) => ({
        id: i,
        x: new Animated.Value(Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(-50),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 12 + 6,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      })
    );

    setPieces(newPieces);

    // Animate each piece
    const animations = newPieces.map((piece) => {
      const xOffset = (Math.random() - 0.5) * 200;
      const rotations = Math.floor(Math.random() * 5) + 3;
      const fallDelay = Math.random() * 500;

      return Animated.parallel([
        // Fall down with slight horizontal drift
        Animated.sequence([
          Animated.delay(fallDelay),
          Animated.timing(piece.y, {
            toValue: SCREEN_HEIGHT + 50,
            duration: duration - fallDelay,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ]),
        // Horizontal swing
        Animated.sequence([
          Animated.delay(fallDelay),
          Animated.timing(piece.x, {
            toValue: (piece.x as any).__getValue() + xOffset,
            duration: duration - fallDelay,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          }),
        ]),
        // Rotation
        Animated.sequence([
          Animated.delay(fallDelay),
          Animated.timing(piece.rotation, {
            toValue: rotations * 360,
            duration: duration - fallDelay,
            useNativeDriver: true,
          }),
        ]),
        // Fade out at the end
        Animated.sequence([
          Animated.delay(duration - 500),
          Animated.timing(piece.scale, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      setPieces([]);
      onComplete?.();
    });
  }, [isActive, duration, particleCount, onComplete]);

  if (!isActive && pieces.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => {
        const rotateZ = piece.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
        });

        const getShapeStyle = () => {
          switch (piece.shape) {
            case "circle":
              return { borderRadius: piece.size / 2 };
            case "rectangle":
              return { width: piece.size * 0.4 };
            default:
              return {};
          }
        };

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.piece,
              {
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate: rotateZ },
                  { scale: piece.scale },
                ],
              },
              getShapeStyle(),
            ]}
          />
        );
      })}
    </View>
  );
}

// Mini confetti burst for smaller celebrations
export function ConfettiBurst({
  isActive,
  originX = SCREEN_WIDTH / 2,
  originY = SCREEN_HEIGHT / 2,
  onComplete,
}: {
  isActive: boolean;
  originX?: number;
  originY?: number;
  onComplete?: () => void;
}) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: Animated.Value;
      y: Animated.Value;
      scale: Animated.Value;
      opacity: Animated.Value;
      color: string;
    }>
  >([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    setParticles(newParticles);

    const animations = newParticles.map((particle) => {
      const angle = (i: number) => (i / 20) * Math.PI * 2;
      const radius = 80 + Math.random() * 40;
      const targetX = Math.cos(angle(particle.id)) * radius;
      const targetY = Math.sin(angle(particle.id)) * radius;

      return Animated.parallel([
        Animated.timing(particle.x, {
          toValue: targetX,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: targetY,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      setParticles([]);
      onComplete?.();
    });
  }, [isActive, onComplete]);

  if (!isActive && particles.length === 0) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { left: originX, top: originY }]}
      pointerEvents="none"
    >
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.burstParticle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
  },
  burstParticle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
