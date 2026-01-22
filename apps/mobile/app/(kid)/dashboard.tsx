import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { BucketCard, TrustScoreBadge } from "@gndwrk/ui";

type BucketType = "spend" | "save" | "give" | "invest";

type Account = {
  _id: string;
  type: BucketType;
  balance: number;
};

type FamilyMember = {
  id: string;
  firstName: string;
  lastName?: string;
  trustScore: number;
  totalBalance: number;
};

function SendMoneyModal({
  visible,
  onClose,
  accounts,
  familyMembers,
  currentUserId,
}: {
  visible: boolean;
  onClose: () => void;
  accounts: Account[] | null | undefined;
  familyMembers: FamilyMember[] | null | undefined;
  currentUserId: string | undefined;
}) {
  const [step, setStep] = useState<"type" | "recipient" | "amount" | "confirm" | "success">("type");
  const [transferType, setTransferType] = useState<"bucket" | "family" | null>(null);
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [recipient, setRecipient] = useState<FamilyMember | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const transfer = useMutation(api.accounts.transfer);
  const sendToFamily = useMutation(api.accounts.sendToFamilyMember);

  const reset = () => {
    setStep("type");
    setTransferType(null);
    setFromAccount(null);
    setToAccount(null);
    setRecipient(null);
    setAmount("");
    setNote("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const bucketLabels: Record<BucketType, string> = {
    spend: "Spend",
    save: "Save",
    give: "Give",
    invest: "Invest",
  };

  const bucketColors: Record<BucketType, string> = {
    spend: "bg-bucket-spend",
    save: "bg-bucket-save",
    give: "bg-bucket-give",
    invest: "bg-bucket-invest",
  };

  const handleTransfer = async () => {
    if (!fromAccount || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (amountNum > fromAccount.balance) {
      setError("Insufficient funds");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (transferType === "bucket" && toAccount) {
        await transfer({
          fromAccountId: fromAccount._id as any,
          toAccountId: toAccount._id as any,
          amount: amountNum,
        });
      } else if (transferType === "family" && recipient) {
        await sendToFamily({
          fromAccountId: fromAccount._id as any,
          toUserId: recipient.id as any,
          amount: amountNum,
          note: note || undefined,
        });
      }
      setStep("success");
    } catch (e: any) {
      setError(e.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const otherFamilyMembers = familyMembers?.filter((m) => m.id !== currentUserId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-surface p-6">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text">
              {step === "success" ? "Success!" : "Send Money"}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Step: Choose Type */}
          {step === "type" && (
            <View>
              <Text className="mb-4 text-text-muted">
                What would you like to do?
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTransferType("bucket");
                  setStep("amount");
                }}
                className="mb-3 flex-row items-center rounded-xl bg-blue-50 p-4"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                  <Ionicons name="swap-horizontal" size={24} color="#3080D8" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="font-semibold text-text">
                    Move Between Buckets
                  </Text>
                  <Text className="text-sm text-text-muted">
                    Transfer money between your Spend, Save, Give, and Invest
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>

              {otherFamilyMembers && otherFamilyMembers.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setTransferType("family");
                    setStep("recipient");
                  }}
                  className="flex-row items-center rounded-xl bg-green-50 p-4"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-100">
                    <Ionicons name="people" size={24} color="#22C772" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="font-semibold text-text">
                      Send to Family
                    </Text>
                    <Text className="text-sm text-text-muted">
                      Send money to a sibling or parent
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Step: Select Recipient */}
          {step === "recipient" && (
            <View>
              <TouchableOpacity
                onPress={() => setStep("type")}
                className="mb-4 flex-row items-center"
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
                <Text className="ml-2 text-text-muted">Back</Text>
              </TouchableOpacity>
              <Text className="mb-4 text-text-muted">Select who to send to:</Text>
              {otherFamilyMembers?.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => {
                    setRecipient(member);
                    setStep("amount");
                  }}
                  className="mb-3 flex-row items-center rounded-xl bg-gray-50 p-4"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                    <Text className="text-lg font-bold text-primary">
                      {member.firstName[0]}
                    </Text>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="font-semibold text-text">
                      {member.firstName}
                    </Text>
                    <Text className="text-sm text-text-muted">
                      Balance: {formatCurrency(member.totalBalance)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step: Enter Amount */}
          {step === "amount" && (
            <View>
              <TouchableOpacity
                onPress={() => setStep(transferType === "bucket" ? "type" : "recipient")}
                className="mb-4 flex-row items-center"
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
                <Text className="ml-2 text-text-muted">Back</Text>
              </TouchableOpacity>

              {/* From Account */}
              <Text className="mb-2 text-sm font-medium text-text-muted">From:</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {accounts?.map((acc) => (
                  <TouchableOpacity
                    key={acc._id}
                    onPress={() => setFromAccount(acc)}
                    className={`rounded-xl px-4 py-3 ${
                      fromAccount?._id === acc._id
                        ? "border-2 border-primary bg-primary-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        fromAccount?._id === acc._id ? "text-primary" : "text-text"
                      }`}
                    >
                      {bucketLabels[acc.type]}
                    </Text>
                    <Text
                      className={`text-xs ${
                        fromAccount?._id === acc._id
                          ? "text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {formatCurrency(acc.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* To Account (for bucket transfer) */}
              {transferType === "bucket" && fromAccount && (
                <>
                  <Text className="mb-2 text-sm font-medium text-text-muted">To:</Text>
                  <View className="mb-4 flex-row flex-wrap gap-2">
                    {accounts
                      ?.filter((acc) => acc._id !== fromAccount._id)
                      .map((acc) => (
                        <TouchableOpacity
                          key={acc._id}
                          onPress={() => setToAccount(acc)}
                          className={`rounded-xl px-4 py-3 ${
                            toAccount?._id === acc._id
                              ? "border-2 border-primary bg-primary-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              toAccount?._id === acc._id ? "text-primary" : "text-text"
                            }`}
                          >
                            {bucketLabels[acc.type]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </>
              )}

              {/* Recipient info (for family transfer) */}
              {transferType === "family" && recipient && (
                <View className="mb-4 flex-row items-center rounded-xl bg-gray-50 p-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <Text className="font-bold text-primary">
                      {recipient.firstName[0]}
                    </Text>
                  </View>
                  <Text className="ml-3 font-medium text-text">
                    To: {recipient.firstName}
                  </Text>
                </View>
              )}

              {/* Amount Input */}
              <Text className="mb-2 text-sm font-medium text-text-muted">Amount:</Text>
              <View className="mb-4 flex-row items-center rounded-xl bg-gray-100 px-4 py-3">
                <Text className="text-2xl font-bold text-text">$</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="ml-2 flex-1 text-2xl font-bold text-text"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Note (for family transfer) */}
              {transferType === "family" && (
                <>
                  <Text className="mb-2 text-sm font-medium text-text-muted">
                    Note (optional):
                  </Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="What's this for?"
                    className="mb-4 rounded-xl bg-gray-100 px-4 py-3 text-text"
                    placeholderTextColor="#9CA3AF"
                  />
                </>
              )}

              {error ? (
                <View className="mb-4 rounded-xl bg-red-50 p-3">
                  <Text className="text-sm text-red-600">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => setStep("confirm")}
                disabled={
                  !fromAccount ||
                  !amount ||
                  (transferType === "bucket" && !toAccount) ||
                  (transferType === "family" && !recipient)
                }
                className={`rounded-xl py-4 ${
                  fromAccount && amount && ((transferType === "bucket" && toAccount) || (transferType === "family" && recipient))
                    ? "bg-primary"
                    : "bg-gray-300"
                }`}
              >
                <Text className="text-center font-semibold text-white">
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <View>
              <TouchableOpacity
                onPress={() => setStep("amount")}
                className="mb-4 flex-row items-center"
              >
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
                <Text className="ml-2 text-text-muted">Back</Text>
              </TouchableOpacity>

              <View className="mb-6 items-center">
                <Text className="text-4xl font-bold text-text">
                  {formatCurrency(parseFloat(amount) || 0)}
                </Text>
                <View className="mt-4 flex-row items-center">
                  <View className="items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                      <Text className="font-bold text-primary">
                        {bucketLabels[fromAccount?.type as BucketType]?.[0]}
                      </Text>
                    </View>
                    <Text className="mt-1 text-xs text-text-muted">
                      {bucketLabels[fromAccount?.type as BucketType]}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={24}
                    color="#6B7280"
                    style={{ marginHorizontal: 16 }}
                  />
                  <View className="items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary-100">
                      {transferType === "bucket" ? (
                        <Text className="font-bold text-secondary">
                          {bucketLabels[toAccount?.type as BucketType]?.[0]}
                        </Text>
                      ) : (
                        <Text className="font-bold text-secondary">
                          {recipient?.firstName[0]}
                        </Text>
                      )}
                    </View>
                    <Text className="mt-1 text-xs text-text-muted">
                      {transferType === "bucket"
                        ? bucketLabels[toAccount?.type as BucketType]
                        : recipient?.firstName}
                    </Text>
                  </View>
                </View>
                {note && (
                  <Text className="mt-4 text-center text-text-muted">
                    "{note}"
                  </Text>
                )}
              </View>

              {error ? (
                <View className="mb-4 rounded-xl bg-red-50 p-3">
                  <Text className="text-sm text-red-600">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleTransfer}
                disabled={loading}
                className="rounded-xl bg-primary py-4"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    Confirm Transfer
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <View className="items-center py-4">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <Ionicons name="checkmark" size={48} color="#22C772" />
              </View>
              <Text className="text-2xl font-bold text-text">Transfer Complete</Text>
              <Text className="mt-2 text-center text-text-muted">
                {formatCurrency(parseFloat(amount) || 0)} has been sent
                {transferType === "bucket"
                  ? ` to your ${bucketLabels[toAccount?.type as BucketType]} bucket`
                  : ` to ${recipient?.firstName}`}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="mt-6 w-full rounded-xl bg-primary py-4"
              >
                <Text className="text-center font-semibold text-white">Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

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
  const [showSendModal, setShowSendModal] = useState(false);
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const family = useQuery(api.families.getMyFamily);
  const accounts = useQuery(api.accounts.getMyAccounts);
  const transactions = useQuery(api.transactions.getRecent, { limit: 5 });
  const trustScore = useQuery(api.trustScore.getMyCurrent);
  const familyKids = useQuery(
    api.users.getFamilyKids,
    family ? { familyId: family._id } : "skip"
  );

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
              <TouchableOpacity
                onPress={() => setShowSendModal(true)}
                className="flex-row items-center rounded-full bg-white/20 px-5 py-2.5"
              >
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
          <TouchableOpacity
            onPress={() => setShowSendModal(true)}
            className="flex-1 items-center rounded-xl bg-white p-4 shadow-elevation-2"
          >
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

      <SendMoneyModal
        visible={showSendModal}
        onClose={() => setShowSendModal(false)}
        accounts={accounts}
        familyMembers={familyKids?.filter((k): k is NonNullable<typeof k> => k !== null)}
        currentUserId={currentUser?._id}
      />
    </SafeAreaView>
  );
}
