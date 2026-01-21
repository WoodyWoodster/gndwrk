import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { TrustScoreRing, getTierFromScore, tierConfig } from "@gndwrk/ui";

type TrustScoreEvent = {
  id: string;
  event: string;
  points: number;
  date: number;
};

function ScoreEvent({ event }: { event: TrustScoreEvent }) {
  const isPositive = event.points > 0;

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center flex-1">
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${
            isPositive ? "bg-secondary-100" : "bg-bucket-spend-100"
          }`}
        >
          <Ionicons
            name={isPositive ? "trending-up" : "trending-down"}
            size={18}
            color={isPositive ? "#22C772" : "#F06050"}
          />
        </View>
        <Text className="ml-3 text-body text-slate-900 flex-1">
          {event.event}
        </Text>
      </View>
      <Text
        className={`font-mono font-semibold text-body ${
          isPositive ? "text-secondary" : "text-bucket-spend"
        }`}
      >
        {isPositive ? "+" : ""}
        {event.points}
      </Text>
    </View>
  );
}

function FactorBar({
  label,
  value,
  maxValue,
  weight,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  weight: string;
  color?: string;
}) {
  const percent = Math.min((value / maxValue) * 100, 100);
  const barColor = color || "#3080D8";

  // Create filled/empty blocks for visual representation
  const totalBlocks = 10;
  const filledBlocks = Math.round((percent / 100) * totalBlocks);

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-2">
        <Text className="text-body text-slate-900">{label}</Text>
        <Text className="text-caption text-slate-500">{weight}</Text>
      </View>
      <View className="flex-row gap-1">
        {Array.from({ length: totalBlocks }).map((_, i) => (
          <View
            key={i}
            className="flex-1 h-2 rounded-full"
            style={{
              backgroundColor:
                i < filledBlocks ? barColor : "#ECEEF0",
            }}
          />
        ))}
      </View>
      <Text className="text-caption text-slate-500 mt-1">
        {Math.round(percent)}%
      </Text>
    </View>
  );
}

export default function TrustScoreScreen() {
  const trustScore = useQuery(api.trustScore.getMyCurrent);
  const recentEvents = useQuery(api.trustScore.getRecentEvents, { limit: 10 });
  const factors = useQuery(api.trustScore.getMyFactors);

  const score = trustScore?.score ?? 500;
  const tier = getTierFromScore(score);
  const tierInfo = tierConfig[tier];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="mb-6 mt-4 items-center">
          <Text className="text-h1 text-slate-900">Your Trust Score</Text>
          <Text className="text-body text-slate-500 mt-1">
            Build your financial reputation
          </Text>
        </View>

        {/* Score Ring */}
        <View className="mb-8 items-center">
          <TrustScoreRing score={score} size="lg" animated showLabel />
        </View>

        {/* Score Tier Info */}
        <View
          className="mb-6 rounded-2xl p-5"
          style={{ backgroundColor: tierInfo.color + "10" }}
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: tierInfo.color }}
            />
            <Text
              className="text-h3"
              style={{ color: tierInfo.color }}
            >
              {tierInfo.label} Status
            </Text>
          </View>
          <Text className="text-body text-slate-600">
            {tier === "excellent" &&
              "Outstanding! You're in the top tier. Keep up the great work!"}
            {tier === "strong" &&
              "Great job! You're building a solid financial reputation."}
            {tier === "growing" &&
              "You're on the right track! Keep saving and completing chores."}
            {tier === "building" &&
              "Everyone starts somewhere. Complete tasks to build your score!"}
          </Text>
        </View>

        {/* Score Factors */}
        <View className="mb-6 rounded-2xl bg-white p-5 shadow-elevation-2">
          <Text className="text-h3 mb-5 text-slate-900">
            What's helping your score
          </Text>

          <FactorBar
            label="Loan Payments"
            value={factors?.loanRepayment ?? 0}
            maxValue={100}
            weight="25%"
            color="#3080D8"
          />
          <FactorBar
            label="Savings"
            value={factors?.savingsConsistency ?? 0}
            maxValue={100}
            weight="20%"
            color="#38BDF8"
          />
          <FactorBar
            label="Chores"
            value={factors?.choreCompletion ?? 0}
            maxValue={100}
            weight="15%"
            color="#22C772"
          />
          <FactorBar
            label="Budget"
            value={factors?.budgetAdherence ?? 0}
            maxValue={100}
            weight="15%"
            color="#A78BFA"
          />
          <FactorBar
            label="Giving"
            value={factors?.givingBehavior ?? 0}
            maxValue={100}
            weight="10%"
            color="#84CC16"
          />
          <FactorBar
            label="Account Age"
            value={factors?.accountAge ?? 0}
            maxValue={100}
            weight="10%"
            color="#6F7E8A"
          />
          <FactorBar
            label="Parent Trust"
            value={factors?.parentEndorsements ?? 0}
            maxValue={100}
            weight="5%"
            color="#F59315"
          />
        </View>

        {/* Tip Card */}
        <View className="mb-6 rounded-2xl bg-secondary-50 p-5 border border-secondary-200">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center">
              <Ionicons name="bulb" size={20} color="#22C772" />
            </View>
            <Text className="ml-3 text-h3 text-secondary-700">
              Tip
            </Text>
          </View>
          <Text className="text-body text-secondary-700">
            {factors?.tips?.[0] ?? "Keep saving consistently to reach Excellent!"}
          </Text>
        </View>

        {/* Recent Activity */}
        <View className="mb-6">
          <Text className="text-h3 mb-4 text-slate-900">
            Recent Score Changes
          </Text>
          <View className="rounded-2xl bg-white p-4 shadow-elevation-2">
            {recentEvents?.map((event, index) => (
              <View key={event.id}>
                <ScoreEvent event={event} />
                {index < (recentEvents?.length ?? 0) - 1 && (
                  <View className="border-b border-slate-100" />
                )}
              </View>
            ))}
            {!recentEvents?.length && (
              <Text className="text-body py-6 text-center text-slate-500">
                No recent score changes
              </Text>
            )}
          </View>
        </View>

        {/* Future Benefits */}
        <View className="mb-8 rounded-2xl bg-primary-50 p-5 border border-primary-200">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Ionicons name="gift" size={20} color="#3080D8" />
            </View>
            <Text className="ml-3 text-h3 text-primary-700">
              When You Turn 18
            </Text>
          </View>
          <Text className="text-body text-primary-600">
            Your Trust Score will unlock real benefits like lower loan rates,
            higher cash back, and priority support. Keep building now!
          </Text>

          {/* Benefits preview */}
          <View className="mt-4 pt-4 border-t border-primary-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={18} color="#3080D8" />
              <Text className="ml-2 text-body-sm text-primary-700">
                Up to 2% lower loan rates
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={18} color="#3080D8" />
              <Text className="ml-2 text-body-sm text-primary-700">
                0.5% extra cash back
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={18} color="#3080D8" />
              <Text className="ml-2 text-body-sm text-primary-700">
                Priority customer support
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
