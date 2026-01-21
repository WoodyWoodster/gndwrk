import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        {/* Logo/Icon */}
        <View className="mb-8 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-primary">
            <Ionicons name="wallet" size={48} color="white" />
          </View>
        </View>

        {/* Welcome Text */}
        <View className="mb-8">
          <Text className="text-center text-3xl font-bold text-text">
            Welcome to Gndwrk
          </Text>
          <Text className="mt-4 text-center text-lg text-text-muted">
            Build financial habits that last a lifetime. Teach your kids about
            money through real experience.
          </Text>
        </View>

        {/* Features */}
        <View className="mb-8 space-y-4">
          <View className="flex-row items-center rounded-xl bg-surface p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Ionicons name="wallet" size={24} color="#4F46E5" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="font-semibold text-text">4 Bucket System</Text>
              <Text className="text-sm text-text-muted">
                Spend, Save, Give, Invest
              </Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-xl bg-surface p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-100">
              <Ionicons name="star" size={24} color="#10B981" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="font-semibold text-text">Trust Score</Text>
              <Text className="text-sm text-text-muted">
                Build financial reputation early
              </Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-xl bg-surface p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-100">
              <Ionicons name="sparkles" size={24} color="#F59E0B" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="font-semibold text-text">AI Money Coach</Text>
              <Text className="text-sm text-text-muted">
                Personal guidance for every question
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          className="rounded-xl bg-primary py-4"
          onPress={() => router.push("/(onboarding)/role-select")}
        >
          <Text className="text-center text-lg font-semibold text-white">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
