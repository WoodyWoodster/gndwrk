import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <View className="mb-6 mt-4">
          <Text className="text-2xl font-bold text-text">Settings</Text>
        </View>

        {/* Profile Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-text-muted">
            Account
          </Text>

          <TouchableOpacity className="mb-2 flex-row items-center rounded-xl bg-surface p-4 shadow-sm">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Text className="text-lg font-bold text-primary">
                {user?.firstName?.[0] ?? "U"}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-text">
                {user?.fullName ?? "User"}
              </Text>
              <Text className="text-text-muted">
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Banking Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-text-muted">
            Banking
          </Text>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="card" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="document-text" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Statements</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-text-muted">
            Notifications
          </Text>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Push Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="mail" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Email Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-medium uppercase text-text-muted">
            Support
          </Text>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="chatbubble" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          className="mb-8 flex-row items-center justify-center rounded-xl bg-red-50 p-4"
          onPress={handleSignOut}
        >
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text className="ml-2 font-medium text-red-500">Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View className="mb-8 items-center">
          <Text className="text-sm text-text-muted">Gndwrk v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
