import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";

const { width } = Dimensions.get("window");

type TutorialStep = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  illustration: React.ReactNode;
};

const steps: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to Your Money Dashboard!",
    subtitle: "Let's learn how to manage your money like a pro",
    description:
      "This is your home for everything money-related. You can see your balance, send money, earn rewards, and talk to your AI coach.",
    icon: "home",
    iconBgColor: "bg-primary-100",
    iconColor: "#3080D8",
    illustration: (
      <View className="items-center">
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-primary-100">
          <Ionicons name="home" size={48} color="#3080D8" />
        </View>
        <View className="flex-row gap-2">
          <View className="h-3 w-3 rounded-full bg-primary" />
          <View className="h-3 w-3 rounded-full bg-secondary" />
          <View className="h-3 w-3 rounded-full bg-accent" />
          <View className="h-3 w-3 rounded-full bg-bucket-give" />
        </View>
      </View>
    ),
  },
  {
    id: 2,
    title: "Your 4 Money Buckets",
    subtitle: "Spend, Save, Give, Invest",
    description:
      "Every dollar you get is split into 4 buckets. SPEND is for fun stuff now. SAVE is for bigger goals. GIVE is for helping others. INVEST is for growing your money over time!",
    icon: "grid",
    iconBgColor: "bg-secondary-100",
    iconColor: "#22C772",
    illustration: (
      <View className="flex-row flex-wrap justify-center gap-3">
        <View className="items-center rounded-2xl bg-bucket-spend-100 p-4">
          <Text className="text-2xl">💸</Text>
          <Text className="mt-1 font-semibold text-bucket-spend">Spend</Text>
        </View>
        <View className="items-center rounded-2xl bg-bucket-save-100 p-4">
          <Text className="text-2xl">🏦</Text>
          <Text className="mt-1 font-semibold text-bucket-save">Save</Text>
        </View>
        <View className="items-center rounded-2xl bg-bucket-give-100 p-4">
          <Text className="text-2xl">💝</Text>
          <Text className="mt-1 font-semibold text-bucket-give">Give</Text>
        </View>
        <View className="items-center rounded-2xl bg-bucket-invest-100 p-4">
          <Text className="text-2xl">📈</Text>
          <Text className="mt-1 font-semibold text-bucket-invest">Invest</Text>
        </View>
      </View>
    ),
  },
  {
    id: 3,
    title: "Build Your Trust Score",
    subtitle: "Your financial reputation (300-850)",
    description:
      "Just like a video game level, your Trust Score goes up when you do good things with money! Complete chores, save regularly, pay back loans on time, and watch your score grow.",
    icon: "star",
    iconBgColor: "bg-accent-100",
    iconColor: "#F59315",
    illustration: (
      <View className="items-center">
        <View className="relative mb-4">
          <View className="h-32 w-32 items-center justify-center rounded-full border-8 border-accent-200 bg-accent-50">
            <Text className="text-4xl font-bold text-accent">500</Text>
            <Text className="text-sm text-accent-600">Starting</Text>
          </View>
          <View className="absolute -right-2 -top-2 h-10 w-10 items-center justify-center rounded-full bg-secondary shadow-lg">
            <Ionicons name="trending-up" size={20} color="white" />
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="rounded-full bg-gray-200 px-3 py-1">
            <Text className="text-xs text-gray-600">300 Poor</Text>
          </View>
          <View className="rounded-full bg-accent-100 px-3 py-1">
            <Text className="text-xs text-accent">500 Fair</Text>
          </View>
          <View className="rounded-full bg-secondary-100 px-3 py-1">
            <Text className="text-xs text-secondary">850 Excellent</Text>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: 4,
    title: "Earn Money with Chores",
    subtitle: "Work hard, get paid!",
    description:
      "Your parents will post chores you can claim. Complete them, upload a photo, and get paid directly to your buckets. The more you do, the more you earn!",
    icon: "briefcase",
    iconBgColor: "bg-secondary-100",
    iconColor: "#22C772",
    illustration: (
      <View className="w-full rounded-2xl bg-white p-4 shadow-lg">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary-100">
              <Text className="text-lg">🧹</Text>
            </View>
            <View className="ml-3">
              <Text className="font-semibold text-gray-900">Clean your room</Text>
              <Text className="text-sm text-gray-500">Due today</Text>
            </View>
          </View>
          <Text className="font-bold text-secondary">$5.00</Text>
        </View>
        <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-100">
              <Text className="text-lg">🐕</Text>
            </View>
            <View className="ml-3">
              <Text className="font-semibold text-gray-900">Walk the dog</Text>
              <Text className="text-sm text-gray-500">Daily</Text>
            </View>
          </View>
          <Text className="font-bold text-secondary">$3.00</Text>
        </View>
      </View>
    ),
  },
  {
    id: 5,
    title: "Meet Your AI Money Coach",
    subtitle: "Always here to help!",
    description:
      "Have a question about money? Not sure if you should spend or save? Just ask your coach! They'll give you smart advice in a way that's easy to understand.",
    icon: "chatbubble-ellipses",
    iconBgColor: "bg-primary-100",
    iconColor: "#3080D8",
    illustration: (
      <View className="w-full">
        <View className="flex-row justify-start">
          <View className="max-w-[80%] rounded-2xl rounded-tl-none bg-primary-100 p-4">
            <Text className="text-gray-700">
              Should I save for a new bike or spend on games?
            </Text>
          </View>
        </View>
        <View className="mt-3 flex-row justify-end">
          <View className="max-w-[80%] rounded-2xl rounded-tr-none bg-white p-4 shadow-md">
            <View className="mb-2 flex-row items-center">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Ionicons name="sparkles" size={12} color="white" />
              </View>
              <Text className="ml-2 font-semibold text-primary">AI Coach</Text>
            </View>
            <Text className="text-gray-700">
              Great question! A bike lasts longer and helps you get around. Maybe save 80% for
              the bike and keep 20% for some game fun? 🚴‍♂️
            </Text>
          </View>
        </View>
      </View>
    ),
  },
];

function ProgressDots({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View className="flex-row justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full transition-all ${
            index === currentStep
              ? "w-6 bg-primary"
              : index < currentStep
                ? "w-2 bg-primary-300"
                : "w-2 bg-gray-200"
          }`}
        />
      ))}
    </View>
  );
}

export default function TutorialScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const completeTutorial = useMutation(api.users.completeTutorial);

  const animateTransition = (direction: "next" | "prev", callback: () => void) => {
    const slideDirection = direction === "next" ? -width : width;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideDirection * 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === "next" ? width * 0.3 : -width * 0.3);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      animateTransition("next", () => setCurrentStep((prev) => prev + 1));
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      animateTransition("prev", () => setCurrentStep((prev) => prev - 1));
    }
  };

  const handleSkip = async () => {
    try {
      await completeTutorial({});
      router.replace("/(kid)/dashboard");
    } catch (e) {
      // Continue anyway
      router.replace("/(kid)/dashboard");
    }
  };

  const handleComplete = async () => {
    try {
      await completeTutorial({});
      router.replace("/(kid)/dashboard");
    } catch (e) {
      // Continue anyway
      router.replace("/(kid)/dashboard");
    }
  };

  const step = steps[currentStep];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header with Skip */}
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text className="text-sm font-medium text-gray-500">
          {currentStep + 1} of {steps.length}
        </Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text className="font-semibold text-primary">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Dots */}
      <View className="mt-4 px-6">
        <ProgressDots currentStep={currentStep} totalSteps={steps.length} />
      </View>

      {/* Content */}
      <Animated.View
        className="flex-1 justify-center px-6"
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        {/* Illustration */}
        <View className="mb-8 items-center">{step.illustration}</View>

        {/* Text Content */}
        <View className="items-center">
          <View
            className={`mb-4 h-16 w-16 items-center justify-center rounded-full ${step.iconBgColor}`}
          >
            <Ionicons name={step.icon} size={32} color={step.iconColor} />
          </View>
          <Text className="text-center text-2xl font-bold text-gray-900">
            {step.title}
          </Text>
          <Text className="mt-2 text-center text-lg font-medium text-primary">
            {step.subtitle}
          </Text>
          <Text className="mt-4 text-center text-base leading-6 text-gray-600">
            {step.description}
          </Text>
        </View>
      </Animated.View>

      {/* Navigation Buttons */}
      <View className="flex-row gap-3 px-6 pb-6">
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={handlePrev}
            className="flex-1 flex-row items-center justify-center rounded-2xl border-2 border-gray-200 py-4"
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text className="ml-2 font-semibold text-gray-600">Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleNext}
          className={`flex-row items-center justify-center rounded-2xl bg-primary py-4 ${
            currentStep > 0 ? "flex-1" : "flex-1"
          }`}
        >
          <Text className="font-semibold text-white">
            {currentStep === steps.length - 1 ? "Get Started!" : "Next"}
          </Text>
          {currentStep < steps.length - 1 && (
            <Ionicons
              name="arrow-forward"
              size={20}
              color="white"
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
