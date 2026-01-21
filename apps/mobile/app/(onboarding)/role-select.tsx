import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function RoleSelectScreen() {
  const router = useRouter();
  const setUserRole = useMutation(api.users.setRole);

  const handleSelectParent = async () => {
    await setUserRole({ role: "parent" });
    router.push("/(onboarding)/family-setup");
  };

  const handleSelectKid = async () => {
    await setUserRole({ role: "kid" });
    router.push("/(onboarding)/kid-setup");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-text">Who are you?</Text>
          <Text className="mt-2 text-text-muted">
            Select your role to personalize your experience
          </Text>
        </View>

        {/* Options */}
        <View className="flex-1 space-y-4">
          {/* Parent Option */}
          <TouchableOpacity
            className="rounded-2xl border-2 border-primary bg-surface p-6"
            onPress={handleSelectParent}
          >
            <View className="flex-row items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <Ionicons name="people" size={32} color="#4F46E5" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xl font-semibold text-text">
                  I'm a Parent
                </Text>
                <Text className="mt-1 text-text-muted">
                  Set up your family, manage kids' accounts, create chores, and
                  approve loans
                </Text>
              </View>
            </View>

            <View className="mt-4 flex-row flex-wrap">
              <View className="mr-2 mt-2 rounded-full bg-primary-50 px-3 py-1">
                <Text className="text-sm text-primary-700">
                  Create family account
                </Text>
              </View>
              <View className="mr-2 mt-2 rounded-full bg-primary-50 px-3 py-1">
                <Text className="text-sm text-primary-700">Add kids</Text>
              </View>
              <View className="mr-2 mt-2 rounded-full bg-primary-50 px-3 py-1">
                <Text className="text-sm text-primary-700">Set up banking</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Kid Option */}
          <TouchableOpacity
            className="rounded-2xl border-2 border-secondary bg-surface p-6"
            onPress={handleSelectKid}
          >
            <View className="flex-row items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary-100">
                <Ionicons name="person" size={32} color="#10B981" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xl font-semibold text-text">
                  I'm a Kid
                </Text>
                <Text className="mt-1 text-text-muted">
                  Join your family, earn money, manage your buckets, and build
                  your Trust Score
                </Text>
              </View>
            </View>

            <View className="mt-4 flex-row flex-wrap">
              <View className="mr-2 mt-2 rounded-full bg-secondary-50 px-3 py-1">
                <Text className="text-sm text-secondary-700">
                  Need family code
                </Text>
              </View>
              <View className="mr-2 mt-2 rounded-full bg-secondary-50 px-3 py-1">
                <Text className="text-sm text-secondary-700">Earn & save</Text>
              </View>
              <View className="mr-2 mt-2 rounded-full bg-secondary-50 px-3 py-1">
                <Text className="text-sm text-secondary-700">
                  Build Trust Score
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View className="mb-6 rounded-xl bg-gray-100 p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text className="ml-2 flex-1 text-sm text-text-muted">
              Kids under 13 need a parent to set up their account. Kids 13+
              can sign up and join their family with a code.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
