import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { BucketCard, TrustScoreBadge } from "@gndwrk/ui";

function TransactionItem({
  transaction,
}: {
  transaction: {
    id: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    category: string;
    date: number;
  };
}) {
  const isCredit = transaction.type === "credit";

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center">
        <View
          className={`h-10 w-10 items-center justify-center rounded-full ${
            isCredit ? "bg-secondary-100" : "bg-slate-100"
          }`}
        >
          <Ionicons
            name={isCredit ? "arrow-down" : "arrow-up"}
            size={18}
            color={isCredit ? "#22C772" : "#6F7E8A"}
          />
        </View>
        <View className="ml-3">
          <Text className="text-body font-medium text-slate-900">
            {transaction.description}
          </Text>
          <Text className="text-body-sm text-slate-500">
            {transaction.category}
          </Text>
        </View>
      </View>
      <Text
        className={`font-mono font-semibold ${
          isCredit ? "text-secondary" : "text-slate-900"
        }`}
      >
        {isCredit ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
      </Text>
    </View>
  );
}

export default function KidDashboard() {
  const { user } = useUser();
  const accounts = useQuery(api.accounts.getMyAccounts);
  const transactions = useQuery(api.transactions.getRecent, { limit: 5 });
  const trustScore = useQuery(api.trustScore.getMyCurrent);

  const totalBalance =
    accounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;

  const spendAccount = accounts?.find((a) => a.type === "spend");
  const saveAccount = accounts?.find((a) => a.type === "save");
  const giveAccount = accounts?.find((a) => a.type === "give");
  const investAccount = accounts?.find((a) => a.type === "invest");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="mb-6 mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-body-sm text-slate-500">Good morning,</Text>
            <Text className="text-h2 text-slate-900">
              {user?.firstName ?? "Champ"}!
            </Text>
          </View>
          <Link href="/(kid)/trust-score" asChild>
            <TouchableOpacity>
              <TrustScoreBadge score={trustScore?.score ?? 500} />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Total Balance Card */}
        <View className="mb-6 overflow-hidden rounded-2xl bg-primary shadow-elevation-3">
          <View className="p-6">
            <Text className="text-overline text-primary-200">Total Balance</Text>
            <Text className="text-money-lg mt-1 text-white">
              {formatCurrency(totalBalance)}
            </Text>
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity className="flex-row items-center rounded-full bg-white/20 px-5 py-2.5">
                <Ionicons name="paper-plane" size={16} color="white" />
                <Text className="ml-2 text-body font-semibold text-white">
                  Send
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center rounded-full bg-white/20 px-5 py-2.5">
                <Ionicons name="card" size={16} color="white" />
                <Text className="ml-2 text-body font-semibold text-white">
                  Card
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Four Buckets - 2x2 Grid */}
        <View className="mb-6">
          <Text className="text-h3 mb-4 text-slate-900">Your Buckets</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <BucketCard
                type="spend"
                balance={spendAccount?.balance ?? 0}
                onPress={() => {}}
              />
            </View>
            <View className="flex-1">
              <BucketCard
                type="save"
                balance={saveAccount?.balance ?? 0}
                onPress={() => {}}
              />
            </View>
          </View>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <BucketCard
                type="give"
                balance={giveAccount?.balance ?? 0}
                onPress={() => {}}
              />
            </View>
            <View className="flex-1">
              <BucketCard
                type="invest"
                balance={investAccount?.balance ?? 0}
                onPress={() => {}}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-6 flex-row gap-3">
          <Link href="/(kid)/earn" asChild>
            <TouchableOpacity className="flex-1 items-center rounded-xl bg-white p-4 shadow-elevation-2">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-100">
                <Ionicons name="briefcase" size={24} color="#22C772" />
              </View>
              <Text className="text-body mt-2 font-semibold text-slate-900">
                Earn
              </Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity className="flex-1 items-center rounded-xl bg-white p-4 shadow-elevation-2">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Ionicons name="send" size={24} color="#3080D8" />
            </View>
            <Text className="text-body mt-2 font-semibold text-slate-900">
              Send
            </Text>
          </TouchableOpacity>
          <Link href="/(kid)/coach" asChild>
            <TouchableOpacity className="flex-1 items-center rounded-xl bg-white p-4 shadow-elevation-2">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-100">
                <Ionicons name="sparkles" size={24} color="#F59315" />
              </View>
              <Text className="text-body mt-2 font-semibold text-slate-900">
                Coach
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Recent Transactions */}
        <View className="mb-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-h3 text-slate-900">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-body font-semibold text-primary">
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="rounded-xl bg-white p-4 shadow-elevation-2">
            {transactions?.map((tx, index) => (
              <View key={tx.id}>
                <TransactionItem transaction={tx} />
                {index < (transactions?.length ?? 0) - 1 && (
                  <View className="border-b border-slate-100" />
                )}
              </View>
            ))}
            {!transactions?.length && (
              <Text className="text-body py-6 text-center text-slate-500">
                No transactions yet
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
