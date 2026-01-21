import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";

type LoanStatus = "pending" | "active" | "paid" | "defaulted";

function LoanCard({
  loan,
  onApprove,
  onReject,
}: {
  loan: {
    _id: string;
    borrowerName: string;
    principal: number;
    interestRate: number;
    termWeeks: number;
    purpose: string;
    status: LoanStatus;
    remainingBalance: number;
    weeklyPayment: number;
    nextPaymentDate?: number;
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case "pending":
        return "bg-accent-100 text-accent-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "paid":
        return "bg-secondary-100 text-secondary-700";
      case "defaulted":
        return "bg-red-100 text-red-700";
    }
  };

  const progressPercent = ((loan.principal - loan.remainingBalance) / loan.principal) * 100;

  return (
    <View className="mb-3 rounded-xl bg-surface p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-text">{loan.purpose}</Text>
          <Text className="mt-1 text-text-muted">From: {loan.borrowerName}</Text>
        </View>
        <View className={`rounded-full px-2 py-1 ${getStatusColor(loan.status)}`}>
          <Text className="text-xs font-medium capitalize">{loan.status}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row justify-between">
        <View>
          <Text className="text-sm text-text-muted">Principal</Text>
          <Text className="font-bold text-text">${loan.principal.toFixed(2)}</Text>
        </View>
        <View>
          <Text className="text-sm text-text-muted">Interest</Text>
          <Text className="font-bold text-text">{loan.interestRate}%</Text>
        </View>
        <View>
          <Text className="text-sm text-text-muted">Term</Text>
          <Text className="font-bold text-text">{loan.termWeeks} weeks</Text>
        </View>
        <View>
          <Text className="text-sm text-text-muted">Weekly</Text>
          <Text className="font-bold text-text">${loan.weeklyPayment.toFixed(2)}</Text>
        </View>
      </View>

      {loan.status === "active" && (
        <View className="mt-4">
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-muted">Progress</Text>
            <Text className="text-sm text-text-muted">
              ${(loan.principal - loan.remainingBalance).toFixed(2)} / $
              {loan.principal.toFixed(2)}
            </Text>
          </View>
          <View className="mt-2 h-2 rounded-full bg-gray-200">
            <View
              className="h-2 rounded-full bg-secondary"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      )}

      {loan.status === "pending" && (
        <View className="mt-4 flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-secondary py-2"
            onPress={() => onApprove(loan._id)}
          >
            <Ionicons name="checkmark" size={18} color="white" />
            <Text className="ml-1 font-medium text-white">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-lg bg-red-500 py-2"
            onPress={() => onReject(loan._id)}
          >
            <Ionicons name="close" size={18} color="white" />
            <Text className="ml-1 font-medium text-white">Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function LoansScreen() {
  const family = useQuery(api.families.getMyFamily);
  const loans = useQuery(api.loans.getFamilyLoans, family ? { familyId: family._id } : "skip");

  const approveLoan = useMutation(api.loans.approve);
  const rejectLoan = useMutation(api.loans.reject);

  const handleApprove = async (loanId: string) => {
    await approveLoan({ loanId: loanId as any });
  };

  const handleReject = async (loanId: string) => {
    await rejectLoan({ loanId: loanId as any });
  };

  const pendingLoans = loans?.filter((l) => l.status === "pending") ?? [];
  const activeLoans = loans?.filter((l) => l.status === "active") ?? [];
  const completedLoans = loans?.filter((l) => l.status === "paid" || l.status === "defaulted") ?? [];

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <View className="mb-6 mt-4">
          <Text className="text-2xl font-bold text-text">Loans</Text>
          <Text className="text-text-muted">Manage family loans</Text>
        </View>

        {/* Summary Card */}
        <View className="mb-6 rounded-xl bg-primary p-4">
          <Text className="text-white/80">Total Outstanding</Text>
          <Text className="text-3xl font-bold text-white">
            ${totalOutstanding.toFixed(2)}
          </Text>
          <View className="mt-2 flex-row">
            <View className="mr-6">
              <Text className="text-white/80">Active</Text>
              <Text className="text-lg font-semibold text-white">
                {activeLoans.length}
              </Text>
            </View>
            <View>
              <Text className="text-white/80">Pending</Text>
              <Text className="text-lg font-semibold text-white">
                {pendingLoans.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Pending Loans */}
        {pendingLoans.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-accent">
              Pending Requests ({pendingLoans.length})
            </Text>
            {pendingLoans.map((loan) => (
              <LoanCard
                key={loan._id}
                loan={loan}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </View>
        )}

        {/* Active Loans */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-text">
            Active Loans ({activeLoans.length})
          </Text>
          {activeLoans.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
          {activeLoans.length === 0 && (
            <View className="rounded-xl bg-surface p-6">
              <Text className="text-center text-text-muted">
                No active loans
              </Text>
            </View>
          )}
        </View>

        {/* Completed Loans */}
        {completedLoans.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-text-muted">
              History ({completedLoans.length})
            </Text>
            {completedLoans.slice(0, 5).map((loan) => (
              <LoanCard
                key={loan._id}
                loan={loan}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
