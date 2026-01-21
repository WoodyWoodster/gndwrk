import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function FamilySetupScreen() {
  const router = useRouter();
  const createFamily = useMutation(api.families.create);

  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!familyName.trim()) {
      setError("Please enter a family name");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await createFamily({ name: familyName.trim() });
      router.replace("/(parent)/dashboard");
    } catch (err) {
      setError("Failed to create family. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-8">
          {/* Progress */}
          <View className="mb-6 flex-row space-x-2">
            <View className="h-1 flex-1 rounded-full bg-primary" />
            <View className="h-1 flex-1 rounded-full bg-gray-200" />
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-text">
              Create your family
            </Text>
            <Text className="mt-2 text-text-muted">
              This will be your family's banking hub
            </Text>
          </View>

          {/* Family Icon */}
          <View className="mb-8 items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-100">
              <Ionicons name="people" size={48} color="#4F46E5" />
            </View>
          </View>

          {/* Form */}
          <View className="flex-1">
            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-3">
                <Text className="text-red-600">{error}</Text>
              </View>
            ) : null}

            <View>
              <Text className="mb-2 text-sm font-medium text-text">
                Family Name
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 bg-surface px-4 py-3 text-text"
                placeholder="e.g., The Smiths"
                placeholderTextColor="#6B7280"
                value={familyName}
                onChangeText={setFamilyName}
                autoFocus
              />
            </View>

            <View className="mt-6 rounded-xl bg-primary-50 p-4">
              <Text className="font-medium text-primary-700">
                What happens next?
              </Text>
              <View className="mt-3 space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                  <Text className="ml-2 text-primary-600">
                    You'll get a family code to share
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                  <Text className="ml-2 text-primary-600">
                    Add your kids to the family
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                  <Text className="ml-2 text-primary-600">
                    Set up their banking accounts
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* CTA */}
          <View className="mb-6">
            <TouchableOpacity
              className="rounded-xl bg-primary py-4"
              onPress={handleCreate}
              disabled={loading}
            >
              <Text className="text-center text-lg font-semibold text-white">
                {loading ? "Creating..." : "Create Family"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
