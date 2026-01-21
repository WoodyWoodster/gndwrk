import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

function BucketCard({
  name,
  balance,
  color,
  icon,
}: {
  name: string;
  balance: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className={`flex-1 rounded-xl bg-${color}-50 p-4`}>
      <View className="flex-row items-center">
        <Ionicons name={icon} size={20} color={`var(--${color}-500)`} />
        <Text className={`ml-2 text-sm font-medium text-${color}-700`}>
          {name}
        </Text>
      </View>
      <Text className={`mt-2 text-xl font-bold text-${color}-900`}>
        ${balance.toFixed(2)}
      </Text>
    </View>
  );
}

function KidCard({
  kid,
}: {
  kid: {
    id: string;
    firstName: string;
    trustScore: number;
    totalBalance: number;
  };
}) {
  const getTrustScoreColor = (score: number) => {
    if (score >= 750) return "text-secondary";
    if (score >= 650) return "text-accent";
    return "text-text-muted";
  };

  return (
    <TouchableOpacity className="mb-3 rounded-xl bg-surface p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Text className="text-lg font-bold text-primary">
              {kid.firstName[0]}
            </Text>
          </View>
          <View className="ml-3">
            <Text className="text-lg font-semibold text-text">
              {kid.firstName}
            </Text>
            <Text className={`text-sm ${getTrustScoreColor(kid.trustScore)}`}>
              Trust Score: {kid.trustScore}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-text">
            ${kid.totalBalance.toFixed(2)}
          </Text>
          <Text className="text-sm text-text-muted">Total</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ParentDashboard() {
  const { user } = useUser();
  const family = useQuery(api.families.getMyFamily);
  const kids = useQuery(api.users.getFamilyKids, family ? { familyId: family._id } : "skip");

  const pendingChores = useQuery(api.chores.getPendingApproval, family ? { familyId: family._id } : "skip");
  const activeLoans = useQuery(api.loans.getActiveLoans, family ? { familyId: family._id } : "skip");

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="mb-6 mt-4">
          <Text className="text-text-muted">Good morning,</Text>
          <Text className="text-2xl font-bold text-text">
            {user?.firstName ?? "Parent"}
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="mb-6 flex-row space-x-3">
          <Link href="/(parent)/chores" asChild>
            <TouchableOpacity className="flex-1 items-center rounded-xl bg-primary p-4">
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="mt-1 text-sm font-medium text-white">
                Add Chore
              </Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity className="flex-1 items-center rounded-xl bg-secondary p-4">
            <Ionicons name="send" size={24} color="white" />
            <Text className="mt-1 text-sm font-medium text-white">
              Send Money
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 items-center rounded-xl bg-accent p-4">
            <Ionicons name="person-add" size={24} color="white" />
            <Text className="mt-1 text-sm font-medium text-white">Add Kid</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Approvals */}
        {pendingChores && pendingChores.length > 0 && (
          <View className="mb-6 rounded-xl bg-accent-50 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                <Text className="ml-2 font-semibold text-accent-700">
                  {pendingChores.length} chore{pendingChores.length > 1 ? "s" : ""}{" "}
                  pending approval
                </Text>
              </View>
              <Link href="/(parent)/chores" asChild>
                <TouchableOpacity>
                  <Text className="text-accent-700">Review</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        )}

        {/* Kids Overview */}
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-text">Your Kids</Text>
            <Link href="/(parent)/family" asChild>
              <TouchableOpacity>
                <Text className="text-primary">View All</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {kids?.map((kid) => (
            <KidCard key={kid.id} kid={kid} />
          ))}

          {!kids?.length && (
            <View className="rounded-xl bg-surface p-6">
              <Text className="text-center text-text-muted">
                No kids added yet. Add your first child to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Active Loans */}
        {activeLoans && activeLoans.length > 0 && (
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-text">
                Active Loans
              </Text>
              <Link href="/(parent)/loans" asChild>
                <TouchableOpacity>
                  <Text className="text-primary">View All</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {activeLoans.slice(0, 2).map((loan) => (
              <View
                key={loan._id}
                className="mb-2 rounded-xl bg-surface p-4 shadow-sm"
              >
                <View className="flex-row justify-between">
                  <Text className="font-medium text-text">{loan.purpose}</Text>
                  <Text className="font-bold text-text">
                    ${loan.remainingBalance.toFixed(2)}
                  </Text>
                </View>
                <View className="mt-2 h-2 rounded-full bg-gray-200">
                  <View
                    className="h-2 rounded-full bg-secondary"
                    style={{
                      width: `${((loan.principal - loan.remainingBalance) / loan.principal) * 100}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
