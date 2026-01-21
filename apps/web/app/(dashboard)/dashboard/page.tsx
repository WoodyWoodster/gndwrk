"use client";

import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { formatCurrency } from "@/lib/utils";

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
}: {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
}) {
  const isPositive = change && change > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p
              className={`mt-1 text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}
              {change}% {changeLabel}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function KidOverviewCard({
  kid,
}: {
  kid: {
    id: string;
    firstName: string;
    trustScore: number;
    totalBalance: number;
    spendBalance: number;
    saveBalance: number;
  };
}) {
  const getTrustScoreColor = (score: number) => {
    if (score >= 750) return "text-green-600 bg-green-100";
    if (score >= 650) return "text-blue-600 bg-blue-100";
    if (score >= 550) return "text-amber-600 bg-amber-100";
    return "text-gray-600 bg-gray-100";
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <span className="text-xl font-bold text-primary">
            {kid.firstName[0]}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {kid.firstName}
          </h3>
          <div
            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${getTrustScoreColor(kid.trustScore)}`}
          >
            Trust Score: {kid.trustScore}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(kid.totalBalance)}
          </p>
          <p className="text-sm text-gray-500">Total Balance</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-primary-50 p-3">
          <p className="text-xs font-medium text-primary-700">Spend</p>
          <p className="mt-1 font-semibold text-primary-900">
            {formatCurrency(kid.spendBalance)}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700">Save</p>
          <p className="mt-1 font-semibold text-green-900">
            {formatCurrency(kid.saveBalance)}
          </p>
        </div>
        <div className="rounded-lg bg-pink-50 p-3">
          <p className="text-xs font-medium text-pink-700">Give</p>
          <p className="mt-1 font-semibold text-pink-900">$0.00</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-700">Invest</p>
          <p className="mt-1 font-semibold text-amber-900">$0.00</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const family = useQuery(api.families.getMyFamily);
  const kids = useQuery(
    api.users.getFamilyKids,
    family ? { familyId: family._id } : "skip"
  );
  const pendingChores = useQuery(
    api.chores.getPendingApproval,
    family ? { familyId: family._id } : "skip"
  );
  const activeLoans = useQuery(
    api.loans.getActiveLoans,
    family ? { familyId: family._id } : "skip"
  );

  const totalBalance = kids?.reduce((sum: number, k: { totalBalance: number }) => sum + k.totalBalance, 0) ?? 0;
  const totalOutstanding =
    activeLoans?.reduce((sum: number, l: { remainingBalance: number }) => sum + l.remainingBalance, 0) ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {family?.name ?? "Family"}
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your family's finances.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Family Balance"
          value={formatCurrency(totalBalance)}
          icon={
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          }
        />
        <StatCard
          title="Active Kids"
          value={String(kids?.length ?? 0)}
          icon={
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Pending Chores"
          value={String(pendingChores?.length ?? 0)}
          icon={
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
        />
        <StatCard
          title="Loans Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Pending Approvals Alert */}
      {pendingChores && pendingChores.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {pendingChores.length} chore{pendingChores.length > 1 ? "s" : ""}{" "}
                waiting for your approval
              </p>
              <p className="text-sm text-amber-700">
                Review and approve completed chores to release payments.
              </p>
            </div>
            <a
              href="/dashboard/chores"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Review Now
            </a>
          </div>
        </div>
      )}

      {/* Kids Overview */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Kids</h2>
          <a
            href="/dashboard/family"
            className="text-sm font-medium text-primary hover:text-primary-600"
          >
            Manage Family →
          </a>
        </div>

        {kids && kids.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {kids.map((kid) => (
              <KidOverviewCard key={kid.id} kid={kid} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <h3 className="mt-4 font-medium text-gray-900">No kids yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first child to start their financial journey.
            </p>
            <a
              href="/dashboard/family"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              Add a Kid
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
