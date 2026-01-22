"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { TrustScoreIcon, BucketIcon } from "@/components/icons";

type TimeRange = "week" | "month" | "year";

function StatCard({
  title,
  value,
  change,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-elevation-1 transition-all hover:shadow-elevation-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p
              className={`mt-1 text-xs ${change >= 0 ? "text-secondary" : "text-red-600"}`}
            >
              {change >= 0 ? "+" : ""}
              {change}% from last period
            </p>
          )}
        </div>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-xl ${gradient ?? "bg-gradient-to-br from-primary-100 to-secondary-100"}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function CategoryBar({
  category,
  amount,
  percentage,
  color,
}: {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-24 text-sm font-medium text-gray-700">{category}</div>
      <div className="flex-1">
        <div className="h-6 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <div className="w-24 text-right">
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(amount)}
        </p>
        <p className="text-xs text-gray-500">{percentage}%</p>
      </div>
    </div>
  );
}

function TransactionItem({
  transaction,
}: {
  transaction: {
    id: string;
    description: string;
    amount: number;
    type: string;
    category: string;
    userName: string;
    date: number;
  };
}) {
  const isCredit = transaction.type === "credit";

  return (
    <div className="flex items-center gap-4 py-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${isCredit ? "bg-green-100" : "bg-gray-100"}`}
      >
        {isCredit ? (
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{transaction.description}</p>
        <p className="text-sm text-gray-500">
          {transaction.userName} · {transaction.category}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`font-semibold ${isCredit ? "text-green-600" : "text-gray-900"}`}
        >
          {isCredit ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </p>
        <p className="text-xs text-gray-500">
          {formatRelativeTime(transaction.date)}
        </p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const family = useQuery(api.families.getMyFamily);
  const kids = useQuery(
    api.users.getFamilyKids,
    family ? { familyId: family._id } : "skip"
  );
  const transactions = useQuery(
    api.transactions.getByFamily,
    family ? { familyId: family._id, limit: 50 } : "skip"
  );

  // Filter out null kids
  const validKids = kids?.filter((k): k is NonNullable<typeof k> => k !== null) ?? [];

  // Calculate totals
  const totalBalance = validKids.reduce((sum, k) => sum + k.totalBalance, 0);
  const totalSavings = validKids.reduce((sum, k) => sum + k.saveBalance, 0);

  // Calculate spending from transactions (debits only)
  const now = Date.now();
  const rangeMs = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };
  const cutoffDate = now - rangeMs[timeRange];

  const periodTransactions = transactions?.filter((t) => t.date >= cutoffDate);
  const periodSpending =
    periodTransactions
      ?.filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const periodEarnings =
    periodTransactions
      ?.filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  // Calculate category breakdown
  const categorySpending =
    periodTransactions
      ?.filter((t) => t.type === "debit")
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        },
        {} as Record<string, number>
      ) ?? {};

  const totalCategorySpending = Object.values(categorySpending).reduce(
    (sum, amt) => sum + amt,
    0
  );

  const categoryColors: Record<string, string> = {
    Shopping: "bg-pink-500",
    Food: "bg-amber-500",
    Entertainment: "bg-purple-500",
    "Loan Payment": "bg-blue-500",
    Other: "bg-gray-500",
  };

  const sortedCategories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        totalCategorySpending > 0
          ? Math.round((amount / totalCategorySpending) * 100)
          : 0,
      color: categoryColors[category] ?? "bg-gray-400",
    }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Track your family's financial activity.
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-elevation-1">
          {[
            { key: "week", label: "Week" },
            { key: "month", label: "Month" },
            { key: "year", label: "Year" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key as TimeRange)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                timeRange === key
                  ? "bg-primary text-white shadow-elevation-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          gradient="bg-gradient-to-br from-bucket-spend-100 to-bucket-invest-100"
          icon={<BucketIcon size={28} />}
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(totalSavings)}
          gradient="bg-gradient-to-br from-bucket-save-100 to-secondary-100"
          icon={<BucketIcon size={28} />}
        />
        <StatCard
          title="Period Earnings"
          value={formatCurrency(periodEarnings)}
          gradient="bg-gradient-to-br from-accent-100 to-amber-100"
          icon={<TrustScoreIcon size={28} />}
        />
        <StatCard
          title="Period Spending"
          value={formatCurrency(periodSpending)}
          gradient="bg-gradient-to-br from-bucket-spend-100 to-primary-100"
          icon={<BucketIcon size={28} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by Category */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1">
          <h2 className="text-lg font-semibold text-gray-900">
            Spending by Category
          </h2>
          <p className="text-sm text-gray-500">
            Where the money went this {timeRange}
          </p>

          {sortedCategories.length > 0 ? (
            <div className="mt-6 space-y-4">
              {sortedCategories.map(({ category, amount, percentage, color }) => (
                <CategoryBar
                  key={category}
                  category={category}
                  amount={amount}
                  percentage={percentage}
                  color={color}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center text-gray-500">
              <p>No spending data for this period</p>
            </div>
          )}
        </div>

        {/* Kid Balances */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1">
          <h2 className="text-lg font-semibold text-gray-900">Kid Balances</h2>
          <p className="text-sm text-gray-500">Current balance breakdown</p>

          {validKids.length > 0 ? (
            <div className="mt-6 space-y-4">
              {validKids.map((kid) => (
                <div
                  key={kid.id}
                  className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100">
                    <span className="text-lg font-bold text-primary">
                      {kid.firstName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{kid.firstName}</p>
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      <span>
                        Spend:{" "}
                        <span className="font-medium text-bucket-spend">
                          {formatCurrency(kid.spendBalance)}
                        </span>
                      </span>
                      <span>
                        Save:{" "}
                        <span className="font-medium text-bucket-save">
                          {formatCurrency(kid.saveBalance)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(kid.totalBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center text-gray-500">
              <p>No kids in family yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Transactions
        </h2>
        <p className="text-sm text-gray-500">Latest family activity</p>

        {transactions && transactions.length > 0 ? (
          <div className="mt-4 divide-y divide-gray-100">
            {transactions.slice(0, 10).map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center text-gray-500">
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
