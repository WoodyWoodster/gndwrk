import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const currentUser = useQuery(api.users.getCurrentUser);
  const trustScore = useQuery(api.trustScore.getMyCurrent);
  const savingsGoals = useQuery(api.savingsGoals.getMySavingsGoals);

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
        {/* Profile Header */}
        <View className="mb-6 mt-4 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-100">
            <Text className="text-3xl font-bold text-primary">
              {user?.firstName?.[0] ?? "U"}
            </Text>
          </View>
          <Text className="mt-4 text-2xl font-bold text-text">
            {user?.fullName ?? "User"}
          </Text>
          <View className="mt-2 flex-row items-center">
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text className="ml-1 text-text-muted">
              Trust Score: {trustScore?.score ?? 500}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="mb-6 flex-row space-x-3">
          <View className="flex-1 items-center rounded-xl bg-surface p-4 shadow-sm">
            <Text className="text-2xl font-bold text-secondary">
              {currentUser?.choresCompleted ?? 0}
            </Text>
            <Text className="text-sm text-text-muted">Chores Done</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-surface p-4 shadow-sm">
            <Text className="text-2xl font-bold text-primary">
              {currentUser?.savingStreak ?? 0}
            </Text>
            <Text className="text-sm text-text-muted">Saving Streak</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-surface p-4 shadow-sm">
            <Text className="text-2xl font-bold text-accent">
              {currentUser?.loansRepaid ?? 0}
            </Text>
            <Text className="text-sm text-text-muted">Loans Repaid</Text>
          </View>
        </View>

        {/* Goals */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-text">
            Savings Goals
          </Text>
          <View className="rounded-xl bg-surface p-4 shadow-sm">
            {savingsGoals && savingsGoals.length > 0 ? (
              savingsGoals.map((goal) => (
                <View key={goal._id} className="mb-4 last:mb-0">
                  <View className="flex-row justify-between">
                    <Text className="font-medium text-text">{goal.name}</Text>
                    <Text className="text-text-muted">
                      ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View className="mt-2 h-2 rounded-full bg-gray-200">
                    <View
                      className="h-2 rounded-full bg-secondary"
                      style={{
                        width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                      }}
                    />
                  </View>
                </View>
              ))
            ) : (
              <TouchableOpacity className="flex-row items-center justify-center py-4">
                <Ionicons name="add-circle" size={20} color="#4F46E5" />
                <Text className="ml-2 text-primary">Set a Savings Goal</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-text">Settings</Text>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="lock-closed" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Help</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
