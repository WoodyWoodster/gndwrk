"use client";

import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { formatCurrency } from "@/lib/utils";
import {
  BucketIcon,
  FamilyIcon,
  ChoreIcon,
  LoanIcon,
} from "@/components/icons";

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  gradient?: string;
}) {
  const isPositive = change && change > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1 transition-all hover:shadow-elevation-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p
              className={`mt-1 text-sm ${isPositive ? "text-secondary" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}
              {change}% {changeLabel}
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
    if (score >= 750) return "text-secondary bg-secondary-100";
    if (score >= 650) return "text-primary bg-primary-100";
    if (score >= 550) return "text-accent bg-accent-100";
    return "text-gray-600 bg-gray-100";
  };

  const getTrustScoreLabel = (score: number) => {
    if (score >= 750) return "Excellent";
    if (score >= 650) return "Strong";
    if (score >= 550) return "Growing";
    return "Building";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1 transition-all hover:shadow-elevation-2">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100">
          <span className="text-xl font-bold text-primary">
            {kid.firstName[0]}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {kid.firstName}
          </h3>
          <div
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${getTrustScoreColor(kid.trustScore)}`}
          >
            <span>{getTrustScoreLabel(kid.trustScore)}</span>
            <span className="opacity-70">({kid.trustScore})</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(kid.totalBalance)}
          </p>
          <p className="text-sm text-gray-500">Total Balance</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-bucket-spend/10 p-3">
          <p className="text-xs font-medium text-bucket-spend">Spend</p>
          <p className="mt-1 font-semibold text-gray-900">
            {formatCurrency(kid.spendBalance)}
          </p>
        </div>
        <div className="rounded-xl bg-bucket-save/10 p-3">
          <p className="text-xs font-medium text-bucket-save">Save</p>
          <p className="mt-1 font-semibold text-gray-900">
            {formatCurrency(kid.saveBalance)}
          </p>
        </div>
        <div className="rounded-xl bg-bucket-give/10 p-3">
          <p className="text-xs font-medium text-bucket-give">Give</p>
          <p className="mt-1 font-semibold text-gray-900">$0.00</p>
        </div>
        <div className="rounded-xl bg-bucket-invest/10 p-3">
          <p className="text-xs font-medium text-bucket-invest">Invest</p>
          <p className="mt-1 font-semibold text-gray-900">$0.00</p>
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

  const totalBalance =
    kids?.reduce(
      (sum: number, k: { totalBalance: number }) => sum + k.totalBalance,
      0
    ) ?? 0;
  const totalOutstanding =
    activeLoans?.reduce(
      (sum: number, l: { remainingBalance: number }) => sum + l.remainingBalance,
      0
    ) ?? 0;

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
          gradient="bg-gradient-to-br from-bucket-spend-100 to-bucket-invest-100"
          icon={<BucketIcon size={28} />}
        />
        <StatCard
          title="Active Kids"
          value={String(kids?.length ?? 0)}
          gradient="bg-gradient-to-br from-primary-100 to-secondary-100"
          icon={<FamilyIcon size={28} />}
        />
        <StatCard
          title="Pending Chores"
          value={String(pendingChores?.length ?? 0)}
          gradient="bg-gradient-to-br from-bucket-spend-100 to-accent-100"
          icon={<ChoreIcon size={28} />}
        />
        <StatCard
          title="Loans Outstanding"
          value={formatCurrency(totalOutstanding)}
          gradient="bg-gradient-to-br from-primary-100 to-bucket-save-100"
          icon={<LoanIcon size={28} />}
        />
      </div>

      {/* Pending Approvals Alert */}
      {pendingChores && pendingChores.length > 0 && (
        <div className="mb-8 rounded-2xl border border-accent-200 bg-gradient-to-r from-accent-50 to-amber-50 p-4 shadow-elevation-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100">
              <ChoreIcon size={24} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-accent-800">
                {pendingChores.length} chore{pendingChores.length > 1 ? "s" : ""}{" "}
                waiting for your approval
              </p>
              <p className="text-sm text-accent-700">
                Review and approve completed chores to release payments.
              </p>
            </div>
            <a
              href="/dashboard/chores"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-accent-600 hover:shadow-elevation-2"
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
            className="text-sm font-semibold text-primary hover:text-primary-600"
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
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100">
              <FamilyIcon size={32} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">No kids yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first child to start their financial journey.
            </p>
            <a
              href="/dashboard/family"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
            >
              Add a Kid
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
