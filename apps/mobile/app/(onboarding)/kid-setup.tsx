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

export default function KidSetupScreen() {
  const router = useRouter();
  const joinFamily = useMutation(api.families.join);

  const [familyCode, setFamilyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!familyCode.trim()) {
      setError("Please enter the family code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await joinFamily({ code: familyCode.trim().toUpperCase() });
      router.replace("/(kid)/dashboard");
    } catch (err) {
      setError("Invalid code. Ask your parent for the correct family code.");
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
            <View className="h-1 flex-1 rounded-full bg-secondary" />
            <View className="h-1 flex-1 rounded-full bg-gray-200" />
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-text">
              Join your family
            </Text>
            <Text className="mt-2 text-text-muted">
              Ask your parent for the family code
            </Text>
          </View>

          {/* Icon */}
          <View className="mb-8 items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-secondary-100">
              <Ionicons name="key" size={48} color="#10B981" />
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
                Family Code
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 bg-surface px-4 py-3 text-center text-2xl tracking-widest text-text"
                placeholder="ABC123"
                placeholderTextColor="#6B7280"
                value={familyCode}
                onChangeText={(text) => setFamilyCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
            </View>

            <View className="mt-6 rounded-xl bg-secondary-50 p-4">
              <Text className="font-medium text-secondary-700">
                How to get your family code
              </Text>
              <View className="mt-3 space-y-2">
                <View className="flex-row items-start">
                  <Text className="mr-2 font-bold text-secondary-600">1.</Text>
                  <Text className="flex-1 text-secondary-600">
                    Ask your parent to open the Gndwrk app
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="mr-2 font-bold text-secondary-600">2.</Text>
                  <Text className="flex-1 text-secondary-600">
                    They'll find the code in Settings → Family
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="mr-2 font-bold text-secondary-600">3.</Text>
                  <Text className="flex-1 text-secondary-600">
                    Enter the 6-character code above
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-6 rounded-xl bg-accent-50 p-4">
              <View className="flex-row items-center">
                <Ionicons name="gift" size={20} color="#F59E0B" />
                <Text className="ml-2 font-medium text-accent-700">
                  What you'll get
                </Text>
              </View>
              <Text className="mt-2 text-accent-600">
                Your own debit card, 4 money buckets, Trust Score tracking, and
                an AI money coach!
              </Text>
            </View>
          </View>

          {/* CTA */}
          <View className="mb-6">
            <TouchableOpacity
              className="rounded-xl bg-secondary py-4"
              onPress={handleJoin}
              disabled={loading}
            >
              <Text className="text-center text-lg font-semibold text-white">
                {loading ? "Joining..." : "Join Family"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
