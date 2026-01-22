import { createContext, useContext, useState } from "react";
import { View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { OnboardingProgress, OnboardingTimeEstimate } from "@/components/OnboardingProgress";

// Step configuration
const ONBOARDING_STEPS = {
  welcome: { step: 1, label: "Welcome" },
  "role-select": { step: 2, label: "Your Role" },
  "family-setup": { step: 3, label: "Family Setup" },
  "kid-setup": { step: 3, label: "Join Family" },
} as const;

const TOTAL_STEPS = 3;
const STEP_LABELS = ["Welcome", "Your Role", "Setup"];

export default function OnboardingLayout() {
  const pathname = usePathname();

  // Extract current screen name from pathname
  const screenName = pathname.split("/").pop() || "welcome";
  const currentStepInfo = ONBOARDING_STEPS[screenName as keyof typeof ONBOARDING_STEPS];
  const currentStep = currentStepInfo?.step || 1;
  const showProgress = screenName !== "welcome";

  return (
    <View className="flex-1 bg-background">
      {/* Progress Bar - shown on all screens except welcome */}
      {showProgress && (
        <View className="pt-12">
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
          />
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="family-setup" />
        <Stack.Screen name="kid-setup" />
      </Stack>
    </View>
  );
}
