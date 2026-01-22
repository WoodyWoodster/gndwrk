import { View, Text } from "react-native";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  showLabel?: boolean;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels,
  showLabel = true,
}: OnboardingProgressProps) {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <View className="px-6 pt-4">
      {/* Progress Bar */}
      <View className="h-2 overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Step Indicator */}
      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-medium text-primary">
            Step {currentStep}
          </Text>
          <Text className="text-sm text-gray-400">of {totalSteps}</Text>
        </View>
        {showLabel && stepLabels && stepLabels[currentStep - 1] && (
          <Text className="text-sm font-medium text-gray-600">
            {stepLabels[currentStep - 1]}
          </Text>
        )}
      </View>

      {/* Step Dots */}
      <View className="mt-3 flex-row justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full transition-all ${
              index < currentStep
                ? "w-2 bg-primary"
                : index === currentStep
                  ? "w-4 bg-primary-300"
                  : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </View>
    </View>
  );
}

// Time estimate component
export function OnboardingTimeEstimate() {
  return (
    <View className="flex-row items-center justify-center gap-2 py-2">
      <View className="h-5 w-5 items-center justify-center rounded-full bg-secondary-100">
        <Text className="text-xs text-secondary">3</Text>
      </View>
      <Text className="text-sm text-gray-500">Takes about 3 minutes</Text>
    </View>
  );
}
