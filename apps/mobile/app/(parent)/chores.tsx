import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

type ChoreStatus = "open" | "claimed" | "pending_approval" | "completed" | "paid";

function ChoreCard({
  chore,
  onApprove,
  onReject,
}: {
  chore: {
    _id: string;
    title: string;
    description: string;
    payout: number;
    status: ChoreStatus;
    assignedToName?: string;
    dueDate?: number;
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const getStatusColor = (status: ChoreStatus) => {
    switch (status) {
      case "open":
        return "bg-gray-100 text-gray-700";
      case "claimed":
        return "bg-blue-100 text-blue-700";
      case "pending_approval":
        return "bg-accent-100 text-accent-700";
      case "completed":
      case "paid":
        return "bg-secondary-100 text-secondary-700";
    }
  };

  const getStatusLabel = (status: ChoreStatus) => {
    switch (status) {
      case "open":
        return "Open";
      case "claimed":
        return "Claimed";
      case "pending_approval":
        return "Needs Approval";
      case "completed":
        return "Completed";
      case "paid":
        return "Paid";
    }
  };

  return (
    <View className="mb-3 rounded-xl bg-surface p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text">{chore.title}</Text>
          <Text className="mt-1 text-text-muted">{chore.description}</Text>
          {chore.assignedToName && (
            <Text className="mt-2 text-sm text-text-muted">
              Assigned to: {chore.assignedToName}
            </Text>
          )}
        </View>
        <View className="items-end">
          <Text className="text-xl font-bold text-secondary">
            ${chore.payout.toFixed(2)}
          </Text>
          <View className={`mt-1 rounded-full px-2 py-1 ${getStatusColor(chore.status)}`}>
            <Text className="text-xs font-medium">
              {getStatusLabel(chore.status)}
            </Text>
          </View>
        </View>
      </View>

      {chore.status === "pending_approval" && (
        <View className="mt-4 flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-secondary py-2"
            onPress={() => onApprove(chore._id)}
          >
            <Ionicons name="checkmark" size={18} color="white" />
            <Text className="ml-1 font-medium text-white">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-red-500 py-2"
            onPress={() => onReject(chore._id)}
          >
            <Ionicons name="close" size={18} color="white" />
            <Text className="ml-1 font-medium text-white">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ChoresScreen() {
  const family = useQuery(api.families.getMyFamily);
  const chores = useQuery(api.chores.getFamilyChores, family ? { familyId: family._id } : "skip");

  const createChore = useMutation(api.chores.create);
  const approveChore = useMutation(api.chores.approve);
  const rejectChore = useMutation(api.chores.reject);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payout, setPayout] = useState("");

  const handleCreate = async () => {
    if (!family || !title || !payout) return;

    await createChore({
      familyId: family._id,
      title,
      description,
      payout: parseFloat(payout),
      frequency: "once",
    });

    setTitle("");
    setDescription("");
    setPayout("");
    setShowModal(false);
  };

  const handleApprove = async (choreId: string) => {
    await approveChore({ choreId: choreId as any });
  };

  const handleReject = async (choreId: string) => {
    await rejectChore({ choreId: choreId as any });
  };

  const pendingChores = chores?.filter((c) => c.status === "pending_approval") ?? [];
  const activeChores = chores?.filter((c) => c.status === "open" || c.status === "claimed") ?? [];
  const completedChores = chores?.filter((c) => c.status === "completed" || c.status === "paid") ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <View className="mb-6 mt-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text">Chores</Text>
          <TouchableOpacity
            className="flex-row items-center rounded-lg bg-primary px-4 py-2"
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="ml-1 font-medium text-white">New Chore</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Approval */}
        {pendingChores.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-accent">
              Needs Approval ({pendingChores.length})
            </Text>
            {pendingChores.map((chore) => (
              <ChoreCard
                key={chore._id}
                chore={chore}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </View>
        )}

        {/* Active Chores */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-text">
            Active Chores ({activeChores.length})
          </Text>
          {activeChores.map((chore) => (
            <ChoreCard
              key={chore._id}
              chore={chore}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
          {activeChores.length === 0 && (
            <View className="rounded-xl bg-surface p-6">
              <Text className="text-center text-text-muted">
                No active chores. Create one to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Completed Chores */}
        {completedChores.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-text-muted">
              Completed ({completedChores.length})
            </Text>
            {completedChores.slice(0, 5).map((chore) => (
              <ChoreCard
                key={chore._id}
                chore={chore}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Chore Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-surface p-6">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-text">New Chore</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-text">Title</Text>
              <TextInput
                className="rounded-lg border border-gray-300 px-4 py-3 text-text"
                placeholder="e.g., Clean your room"
                placeholderTextColor="#6B7280"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-text">
                Description
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 px-4 py-3 text-text"
                placeholder="What needs to be done?"
                placeholderTextColor="#6B7280"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-text">
                Payout ($)
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 px-4 py-3 text-text"
                placeholder="5.00"
                placeholderTextColor="#6B7280"
                value={payout}
                onChangeText={setPayout}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              className="rounded-lg bg-primary py-4"
              onPress={handleCreate}
            >
              <Text className="text-center text-lg font-semibold text-white">
                Create Chore
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
