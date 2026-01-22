import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Coin {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  size: number;
  delay: number;
  type: "gold" | "silver" | "bronze";
}

interface CoinRainProps {
  isActive: boolean;
  duration?: number;
  coinCount?: number;
  onComplete?: () => void;
}

const COIN_TYPES = {
  gold: {
    color: "#F59315",
    borderColor: "#D97706",
    symbol: "$",
  },
  silver: {
    color: "#9CA3AF",
    borderColor: "#6B7280",
    symbol: "¢",
  },
  bronze: {
    color: "#D97706",
    borderColor: "#92400E",
    symbol: "¢",
  },
};

export function CoinRain({
  isActive,
  duration = 2500,
  coinCount = 30,
  onComplete,
}: CoinRainProps) {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    if (!isActive) {
      setCoins([]);
      return;
    }

    // Generate coins with varied properties
    const types: Array<"gold" | "silver" | "bronze"> = ["gold", "silver", "bronze"];
    const newCoins: Coin[] = Array.from({ length: coinCount }).map((_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-100),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.4 + 0.6),
      opacity: new Animated.Value(1),
      size: Math.random() * 16 + 24,
      delay: Math.random() * 600,
      type: types[Math.floor(Math.random() * 3)],
    }));

    setCoins(newCoins);

    // Animate each coin
    const animations = newCoins.map((coin) => {
      const wobble = (Math.random() - 0.5) * 100;
      const rotations = Math.floor(Math.random() * 4) + 2;

      return Animated.sequence([
        Animated.delay(coin.delay),
        Animated.parallel([
          // Fall with physics-like easing
          Animated.timing(coin.y, {
            toValue: SCREEN_HEIGHT + 100,
            duration: duration - coin.delay,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
            useNativeDriver: true,
          }),
          // Slight horizontal drift
          Animated.timing(coin.x, {
            toValue: (coin.x as any).__getValue() + wobble,
            duration: duration - coin.delay,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          }),
          // Spinning rotation
          Animated.timing(coin.rotation, {
            toValue: rotations * 360,
            duration: duration - coin.delay,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          // Fade out near bottom
          Animated.sequence([
            Animated.delay(duration - coin.delay - 300),
            Animated.timing(coin.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      setCoins([]);
      onComplete?.();
    });
  }, [isActive, duration, coinCount, onComplete]);

  if (!isActive && coins.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {coins.map((coin) => {
        const rotateY = coin.rotation.interpolate({
          inputRange: [0, 180, 360],
          outputRange: ["0deg", "180deg", "360deg"],
        });

        const config = COIN_TYPES[coin.type];

        return (
          <Animated.View
            key={coin.id}
            style={[
              styles.coin,
              {
                width: coin.size,
                height: coin.size,
                backgroundColor: config.color,
                borderColor: config.borderColor,
                transform: [
                  { translateX: coin.x },
                  { translateY: coin.y },
                  { rotateY },
                  { scale: coin.scale },
                ],
                opacity: coin.opacity,
              },
            ]}
          >
            <Text
              style={[
                styles.coinSymbol,
                { fontSize: coin.size * 0.5, color: config.borderColor },
              ]}
            >
              {config.symbol}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// Single coin flip animation for smaller celebrations
export function CoinFlip({
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
  const y = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      y.setValue(0);
      rotation.setValue(0);
      scale.setValue(0);
      return;
    }

    Animated.sequence([
      // Pop up and flip
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: -80,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 720,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Fall back down
      Animated.parallel([
        Animated.timing(y, {
          toValue: 50,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, [isActive, y, rotation, scale, onComplete]);

  if (!isActive) return null;

  const rotateY = rotation.interpolate({
    inputRange: [0, 360, 720],
    outputRange: ["0deg", "360deg", "720deg"],
  });

  return (
    <Animated.View
      style={[
        styles.coinFlip,
        {
          left: originX - 24,
          top: originY - 24,
          transform: [{ translateY: y }, { rotateY }, { scale }],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.coinFlipSymbol}>$</Text>
    </Animated.View>
  );
}

// Money stack animation for savings milestones
export function MoneyStack({
  isActive,
  amount,
  onComplete,
}: {
  isActive: boolean;
  amount: number;
  onComplete?: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      scale.setValue(0);
      rotate.setValue(0);
      return;
    }

    Animated.sequence([
      // Pop in with bounce
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      // Slight celebration wiggle
      Animated.sequence([
        Animated.timing(rotate, { toValue: 5, duration: 100, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -5, duration: 100, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 3, duration: 100, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
      // Hold
      Animated.delay(1000),
      // Fade out
      Animated.timing(scale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, [isActive, scale, rotate, onComplete]);

  if (!isActive) return null;

  const rotateZ = rotate.interpolate({
    inputRange: [-5, 5],
    outputRange: ["-5deg", "5deg"],
  });

  return (
    <Animated.View
      style={[
        styles.moneyStack,
        {
          transform: [{ scale }, { rotate: rotateZ }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.moneyStackBills}>
        <View style={[styles.bill, styles.billBack]} />
        <View style={[styles.bill, styles.billMiddle]} />
        <View style={[styles.bill, styles.billFront]}>
          <Text style={styles.billSymbol}>$</Text>
        </View>
      </View>
      <Text style={styles.moneyAmount}>
        +${amount.toFixed(2)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  coin: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  coinSymbol: {
    fontWeight: "bold",
  },
  coinFlip: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F59315",
    borderWidth: 3,
    borderColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  coinFlipSymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#92400E",
  },
  moneyStack: {
    position: "absolute",
    top: "40%",
    left: "50%",
    marginLeft: -60,
    alignItems: "center",
  },
  moneyStackBills: {
    width: 120,
    height: 80,
    position: "relative",
  },
  bill: {
    position: "absolute",
    width: 100,
    height: 50,
    borderRadius: 4,
    borderWidth: 2,
  },
  billBack: {
    backgroundColor: "#86EFAC",
    borderColor: "#22C55E",
    top: 0,
    left: 10,
    transform: [{ rotate: "-3deg" }],
  },
  billMiddle: {
    backgroundColor: "#4ADE80",
    borderColor: "#16A34A",
    top: 5,
    left: 5,
    transform: [{ rotate: "2deg" }],
  },
  billFront: {
    backgroundColor: "#22C55E",
    borderColor: "#15803D",
    top: 10,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  billSymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#15803D",
  },
  moneyAmount: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "bold",
    color: "#22C55E",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
