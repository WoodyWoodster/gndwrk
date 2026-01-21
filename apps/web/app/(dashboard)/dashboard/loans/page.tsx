"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";

type LoanStatus = "all" | "pending" | "active" | "paid";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    active: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    defaulted: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    active: "Active",
    paid: "Paid Off",
    defaulted: "Defaulted",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function LoanCard({
  loan,
  onApprove,
  onReject,
}: {
  loan: {
    _id: string;
    borrowerName: string;
    principal: number;
    remainingBalance: number;
    interestRate: number;
    termWeeks: number;
    weeklyPayment: number;
    purpose: string;
    status: string;
    createdAt: number;
    approvedAt?: number;
    nextPaymentDate?: number;
  };
  onApprove: (interestRate: number) => void;
  onReject: () => void;
}) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [interestRate, setInterestRate] = useState("0");

  const progress =
    loan.status === "active" || loan.status === "paid"
      ? Math.round(((loan.principal - loan.remainingBalance) / loan.principal) * 100)
      : 0;

  const handleApprove = () => {
    onApprove(parseFloat(interestRate) || 0);
    setShowApproveModal(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary">
              {loan.borrowerName[0]}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900">{loan.borrowerName}</h3>
              <p className="text-sm text-gray-500">{loan.purpose}</p>
            </div>
          </div>
        </div>
        <StatusBadge status={loan.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Amount</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(loan.principal)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">
            {loan.status === "pending" ? "Proposed Term" : "Term"}
          </p>
          <p className="font-semibold text-gray-900">{loan.termWeeks} weeks</p>
        </div>
        {loan.status === "active" && (
          <>
            <div>
              <p className="text-gray-500">Remaining</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(loan.remainingBalance)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Weekly Payment</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(loan.weeklyPayment)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Progress Bar for Active Loans */}
      {(loan.status === "active" || loan.status === "paid") && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta Info */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        {loan.interestRate > 0 && (
          <span className="rounded bg-gray-100 px-2 py-0.5">
            {loan.interestRate}% APR
          </span>
        )}
        {loan.nextPaymentDate && loan.status === "active" && (
          <span>Next payment: {formatDate(loan.nextPaymentDate)}</span>
        )}
        <span>Requested {formatRelativeTime(loan.createdAt)}</span>
      </div>

      {/* Actions for Pending Loans */}
      {loan.status === "pending" && (
        <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => setShowApproveModal(true)}
            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Decline
          </button>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Approve Loan Request
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Set an interest rate for {loan.borrowerName}'s loan of{" "}
              {formatCurrency(loan.principal)}.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0"
                min="0"
                max="50"
                step="0.5"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter 0 for an interest-free loan
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve Loan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function LoansPage() {
  const [filter, setFilter] = useState<LoanStatus>("all");

  const family = useQuery(api.families.getMyFamily);
  const loans = useQuery(
    api.loans.getFamilyLoans,
    family ? { familyId: family._id } : "skip"
  );

  const approveLoan = useMutation(api.loans.approve);
  const rejectLoan = useMutation(api.loans.reject);

  const filteredLoans =
    filter === "all"
      ? loans
      : loans?.filter((l) => l.status === filter);

  const pendingCount = loans?.filter((l) => l.status === "pending").length ?? 0;
  const activeCount = loans?.filter((l) => l.status === "active").length ?? 0;
  const totalOutstanding =
    loans
      ?.filter((l) => l.status === "active")
      .reduce((sum, l) => sum + l.remainingBalance, 0) ?? 0;
  const totalPaidOff =
    loans
      ?.filter((l) => l.status === "paid")
      .reduce((sum, l) => sum + l.principal, 0) ?? 0;

  const handleApprove = async (loanId: string, interestRate: number) => {
    try {
      await approveLoan({ loanId: loanId as any, interestRate });
    } catch (error) {
      console.error("Failed to approve loan:", error);
    }
  };

  const handleReject = async (loanId: string) => {
    try {
      await rejectLoan({ loanId: loanId as any });
    } catch (error) {
      console.error("Failed to reject loan:", error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
        <p className="text-gray-600">
          Review and manage loan requests from your kids.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={String(pendingCount)}
          icon={
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Active Loans"
          value={String(activeCount)}
          icon={
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={
            <svg
              className="h-5 w-5 text-primary"
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
        <StatCard
          title="Paid Off"
          value={formatCurrency(totalPaidOff)}
          icon={
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
        />
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {pendingCount} loan request{pendingCount > 1 ? "s" : ""} waiting
                for your approval
              </p>
              <p className="text-sm text-amber-700">
                Review and approve or decline loan requests from your kids.
              </p>
            </div>
            <button
              onClick={() => setFilter("pending")}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "active", label: "Active" },
          { key: "paid", label: "Paid Off" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as LoanStatus)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loans List */}
      {filteredLoans && filteredLoans.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onApprove={(rate) => handleApprove(loan._id, rate)}
              onReject={() => handleReject(loan._id)}
            />
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 font-medium text-gray-900">
            {filter === "all" ? "No loans yet" : `No ${filter} loans`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all"
              ? "Your kids can request loans from the mobile app."
              : "Try a different filter."}
          </p>
        </div>
      )}
    </div>
  );
}
