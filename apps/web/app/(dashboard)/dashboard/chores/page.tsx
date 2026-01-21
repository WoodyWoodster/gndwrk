"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

type ChoreStatus = "all" | "open" | "claimed" | "pending_approval" | "paid";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    claimed: "bg-purple-100 text-purple-700",
    pending_approval: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
  };

  const labels: Record<string, string> = {
    open: "Open",
    claimed: "Claimed",
    pending_approval: "Pending",
    paid: "Paid",
    completed: "Completed",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function CreateChoreModal({
  familyId,
  onClose,
}: {
  familyId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payout, setPayout] = useState("");
  const [frequency, setFrequency] = useState<"once" | "daily" | "weekly">(
    "once"
  );
  const [loading, setLoading] = useState(false);

  const createChore = useMutation(api.chores.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !payout) return;

    setLoading(true);
    try {
      await createChore({
        familyId: familyId as any,
        title,
        description,
        payout: parseFloat(payout),
        frequency,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create chore:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Create New Chore</h2>
        <p className="text-sm text-gray-500">
          Add a new chore for your kids to earn money.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Clean your room"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done..."
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payout ($)
              </label>
              <input
                type="number"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                placeholder="5.00"
                min="0.01"
                step="0.01"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as "once" | "daily" | "weekly")
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="once">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Chore"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    frequency: string;
    status: string;
    assignedToName?: string;
    createdAt: number;
    completedAt?: number;
  };
  onApprove: () => void;
  onReject: () => void;
}) {
  const frequencyLabels: Record<string, string> = {
    once: "One-time",
    daily: "Daily",
    weekly: "Weekly",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{chore.title}</h3>
            <StatusBadge status={chore.status} />
          </div>
          {chore.description && (
            <p className="mt-1 text-sm text-gray-500">{chore.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5">
              {frequencyLabels[chore.frequency] ?? chore.frequency}
            </span>
            {chore.assignedToName && (
              <span>Assigned to {chore.assignedToName}</span>
            )}
            <span>Created {formatRelativeTime(chore.createdAt)}</span>
          </div>
        </div>
        <div className="ml-4 text-right">
          <p className="text-lg font-bold text-primary">
            {formatCurrency(chore.payout)}
          </p>
        </div>
      </div>

      {chore.status === "pending_approval" && (
        <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={onApprove}
            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Approve & Pay
          </button>
          <button
            onClick={onReject}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChoresPage() {
  const [filter, setFilter] = useState<ChoreStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const family = useQuery(api.families.getMyFamily);
  const chores = useQuery(
    api.chores.getFamilyChores,
    family ? { familyId: family._id } : "skip"
  );

  const approveChore = useMutation(api.chores.approve);
  const rejectChore = useMutation(api.chores.reject);

  const filteredChores =
    filter === "all"
      ? chores
      : chores?.filter((c) => c.status === filter);

  const pendingCount = chores?.filter(
    (c) => c.status === "pending_approval"
  ).length;

  const handleApprove = async (choreId: string) => {
    try {
      await approveChore({ choreId: choreId as any });
    } catch (error) {
      console.error("Failed to approve chore:", error);
    }
  };

  const handleReject = async (choreId: string) => {
    try {
      await rejectChore({ choreId: choreId as any });
    } catch (error) {
      console.error("Failed to reject chore:", error);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
          <p className="text-gray-600">
            Create and manage chores for your kids to earn.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          <svg
            className="h-5 w-5"
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
          New Chore
        </button>
      </div>

      {/* Pending Approval Alert */}
      {pendingCount && pendingCount > 0 && (
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {pendingCount} chore{pendingCount > 1 ? "s" : ""} waiting for
                your approval
              </p>
              <p className="text-sm text-amber-700">
                Review completed chores to release payments.
              </p>
            </div>
            <button
              onClick={() => setFilter("pending_approval")}
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
          { key: "open", label: "Open" },
          { key: "claimed", label: "Claimed" },
          { key: "pending_approval", label: "Pending" },
          { key: "paid", label: "Paid" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as ChoreStatus)}
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

      {/* Chores List */}
      {filteredChores && filteredChores.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredChores.map((chore) => (
            <ChoreCard
              key={chore._id}
              chore={chore}
              onApprove={() => handleApprove(chore._id)}
              onReject={() => handleReject(chore._id)}
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 font-medium text-gray-900">
            {filter === "all" ? "No chores yet" : `No ${filter} chores`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all"
              ? "Create your first chore to get started."
              : "Try a different filter."}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              Create Chore
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && family && (
        <CreateChoreModal
          familyId={family._id}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
