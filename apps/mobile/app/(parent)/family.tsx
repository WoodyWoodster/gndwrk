import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

export default function FamilyScreen() {
  const family = useQuery(api.families.getMyFamily);
  const kids = useQuery(api.users.getFamilyKids, family ? { familyId: family._id } : "skip");

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <View className="mb-6 mt-4">
          <Text className="text-2xl font-bold text-text">Family</Text>
          <Text className="text-text-muted">
            {family?.name ?? "Your Family"}
          </Text>
        </View>

        {/* Kids Section */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-text">Kids</Text>
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="add" size={20} color="#4F46E5" />
              <Text className="ml-1 text-primary">Add Kid</Text>
            </TouchableOpacity>
          </View>

          {kids?.map((kid) => (
            <TouchableOpacity
              key={kid.id}
              className="mb-3 rounded-xl bg-surface p-4 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                  <Text className="text-xl font-bold text-primary">
                    {kid.firstName[0]}
                  </Text>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-lg font-semibold text-text">
                    {kid.firstName}
                  </Text>
                  <View className="mt-1 flex-row items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text className="ml-1 text-sm text-text-muted">
                        Trust Score: {kid.trustScore}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-text">
                    ${kid.totalBalance.toFixed(2)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {!kids?.length && (
            <TouchableOpacity className="items-center rounded-xl border-2 border-dashed border-gray-300 p-8">
              <Ionicons name="person-add" size={40} color="#6B7280" />
              <Text className="mt-2 font-medium text-text-muted">
                Add your first child
              </Text>
              <Text className="mt-1 text-center text-sm text-text-muted">
                Set up their account and start teaching financial literacy
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Family Settings */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-text">
            Family Settings
          </Text>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="wallet" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Default Allocation Rules</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="mb-2 flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Notification Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between rounded-xl bg-surface p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
              <Text className="ml-3 text-text">Spending Limits</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
