import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

type ChoreStatus = "open" | "claimed" | "pending_approval" | "completed" | "paid";

function ChoreCard({
  chore,
  onClaim,
  onComplete,
}: {
  chore: {
    _id: string;
    title: string;
    description: string;
    payout: number;
    status: ChoreStatus;
    dueDate?: number;
    isMine: boolean;
  };
  onClaim: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const getStatusBadge = () => {
    switch (chore.status) {
      case "claimed":
        return (
          <View className="rounded-full bg-blue-100 px-2 py-1">
            <Text className="text-xs font-medium text-blue-700">In Progress</Text>
          </View>
        );
      case "pending_approval":
        return (
          <View className="rounded-full bg-accent-100 px-2 py-1">
            <Text className="text-xs font-medium text-accent-700">
              Waiting for Approval
            </Text>
          </View>
        );
      case "completed":
      case "paid":
        return (
          <View className="rounded-full bg-secondary-100 px-2 py-1">
            <Text className="text-xs font-medium text-secondary-700">Done!</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="mb-3 rounded-xl bg-surface p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-text">{chore.title}</Text>
            {chore.isMine && chore.status === "claimed" && (
              <View className="ml-2 rounded bg-primary-100 px-1.5 py-0.5">
                <Text className="text-xs text-primary-700">Yours</Text>
              </View>
            )}
          </View>
          <Text className="mt-1 text-text-muted">{chore.description}</Text>
          <View className="mt-2">{getStatusBadge()}</View>
        </View>
        <View className="items-end">
          <View className="rounded-lg bg-secondary-100 px-3 py-1">
            <Text className="text-lg font-bold text-secondary">
              ${chore.payout.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {chore.status === "open" && (
        <TouchableOpacity
          className="mt-4 rounded-lg bg-primary py-3"
          onPress={() => onClaim(chore._id)}
        >
          <Text className="text-center font-semibold text-white">
            Claim This Chore
          </Text>
        </TouchableOpacity>
      )}

      {chore.status === "claimed" && chore.isMine && (
        <TouchableOpacity
          className="mt-4 rounded-lg bg-secondary py-3"
          onPress={() => onComplete(chore._id)}
        >
          <Text className="text-center font-semibold text-white">
            Mark as Done
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function EarnScreen() {
  const family = useQuery(api.families.getMyFamily);
  const chores = useQuery(api.chores.getAvailableForKid, family ? { familyId: family._id } : "skip");

  const claimChore = useMutation(api.chores.claim);
  const completeChore = useMutation(api.chores.complete);

  const handleClaim = async (choreId: string) => {
    await claimChore({ choreId: choreId as any });
  };

  const handleComplete = async (choreId: string) => {
    await completeChore({ choreId: choreId as any });
  };

  const myChores = chores?.filter((c) => c.isMine) ?? [];
  const availableChores = chores?.filter((c) => c.status === "open") ?? [];

  const totalEarnable = availableChores.reduce((sum, c) => sum + c.payout, 0);
  const pendingEarnings = myChores
    .filter((c) => c.status === "claimed" || c.status === "pending_approval")
    .reduce((sum, c) => sum + c.payout, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <View className="mb-6 mt-4">
          <Text className="text-2xl font-bold text-text">Earn Money</Text>
          <Text className="text-text-muted">
            Complete chores to earn cash for your buckets!
          </Text>
        </View>

        {/* Earnings Summary */}
        <View className="mb-6 flex-row space-x-3">
          <View className="flex-1 rounded-xl bg-secondary p-4">
            <Ionicons name="cash" size={24} color="white" />
            <Text className="mt-2 text-white/80">Available to Earn</Text>
            <Text className="text-2xl font-bold text-white">
              ${totalEarnable.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-accent p-4">
            <Ionicons name="hourglass" size={24} color="white" />
            <Text className="mt-2 text-white/80">Pending</Text>
            <Text className="text-2xl font-bold text-white">
              ${pendingEarnings.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* My Chores */}
        {myChores.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-text">
              My Chores ({myChores.length})
            </Text>
            {myChores.map((chore) => (
              <ChoreCard
                key={chore._id}
                chore={chore}
                onClaim={handleClaim}
                onComplete={handleComplete}
              />
            ))}
          </View>
        )}

        {/* Available Chores */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-text">
            Available Chores ({availableChores.length})
          </Text>
          {availableChores.map((chore) => (
            <ChoreCard
              key={chore._id}
              chore={chore}
              onClaim={handleClaim}
              onComplete={handleComplete}
            />
          ))}
          {availableChores.length === 0 && (
            <View className="items-center rounded-xl bg-surface p-8">
              <Ionicons name="checkbox" size={48} color="#D1D5DB" />
              <Text className="mt-3 text-center font-medium text-text-muted">
                No chores available right now
              </Text>
              <Text className="mt-1 text-center text-sm text-text-muted">
                Check back later or ask your parent to add some!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
