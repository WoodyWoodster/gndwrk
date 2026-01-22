"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { formatCurrency } from "@/lib/utils";
import { FamilyIcon } from "@/components/icons";

function AddKidModal({
  isOpen,
  onClose,
  familyId,
  inviteCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  inviteCode?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<"share" | "create">("share");
  const [copied, setCopied] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createKid = useMutation(api.users.createKidByParent);

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createKid({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      });
      setFirstName("");
      setLastName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create kid profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-elevation-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Kid</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("share")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "share"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Share Code
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "create"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Create Profile
          </button>
        </div>

        {/* Share Code Tab */}
        {activeTab === "share" && (
          <div className="mt-6">
            <p className="text-sm text-gray-600">
              Share this code with your teen (13+) so they can create their own account in the mobile app.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center">
                <span className="font-mono text-3xl font-bold tracking-wider text-gray-900">
                  {inviteCode ?? "------"}
                </span>
              </div>
            </div>
            <button
              onClick={copyCode}
              className="mt-4 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <p className="mt-3 text-xs text-center text-gray-500">
              Kids can enter this code in the mobile app to join your family.
            </p>
          </div>
        )}

        {/* Create Profile Tab */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateKid} className="mt-6">
            <p className="text-sm text-gray-600">
              Create a managed profile for younger kids. You'll control their account.
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Enter last name (optional)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !firstName.trim()}
              className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Kid Profile"}
            </button>
            <p className="mt-3 text-xs text-center text-gray-500">
              This creates a managed account controlled by you. Kids can upgrade to their own account later.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function KidCard({
  kid,
}: {
  kid: {
    id: string;
    firstName: string;
    lastName?: string;
    imageUrl?: string;
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
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-secondary-100">
          {kid.imageUrl ? (
            <img
              src={kid.imageUrl}
              alt={kid.firstName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {kid.firstName[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {kid.firstName} {kid.lastName}
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

function InviteCodeCard({ familyId }: { familyId: string }) {
  const [copied, setCopied] = useState(false);
  const inviteCode = useQuery(api.families.getInviteCode, {
    familyId: familyId as any,
  });

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100">
          <FamilyIcon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Family Invite Code</h3>
          <p className="text-sm text-gray-500">
            Share this code with your kids to join
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center">
          <span className="font-mono text-2xl font-bold tracking-wider text-gray-900">
            {inviteCode ?? "------"}
          </span>
        </div>
        <button
          onClick={copyCode}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Kids can enter this code in the mobile app to join your family.
      </p>
    </div>
  );
}

function AllocationSettingsCard({
  familyId,
  currentAllocation,
}: {
  familyId: string;
  currentAllocation: {
    spend: number;
    save: number;
    give: number;
    invest: number;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [allocation, setAllocation] = useState(currentAllocation);
  const updateSettings = useMutation(api.families.updateSettings);

  const total =
    allocation.spend + allocation.save + allocation.give + allocation.invest;
  const isValid = total === 100;

  const handleSave = async () => {
    if (!isValid) return;
    await updateSettings({
      familyId: familyId as any,
      defaultAllocation: allocation,
    });
    setEditing(false);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            Default Bucket Allocation
          </h3>
          <p className="text-sm text-gray-500">
            How new earnings are split by default
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-primary hover:text-primary-600"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          {[
            { key: "spend", label: "Spend", color: "bucket-spend" },
            { key: "save", label: "Save", color: "bucket-save" },
            { key: "give", label: "Give", color: "bucket-give" },
            { key: "invest", label: "Invest", color: "bucket-invest" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-16 text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={allocation[key as keyof typeof allocation]}
                onChange={(e) =>
                  setAllocation({
                    ...allocation,
                    [key]: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          ))}

          <div
            className={`text-sm font-medium ${isValid ? "text-secondary" : "text-red-600"}`}
          >
            Total: {total}% {!isValid && "(must equal 100%)"}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setAllocation(currentAllocation);
                setEditing(false);
              }}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-bucket-spend/10 p-3 text-center">
            <p className="text-xs font-medium text-bucket-spend">Spend</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {currentAllocation.spend}%
            </p>
          </div>
          <div className="rounded-xl bg-bucket-save/10 p-3 text-center">
            <p className="text-xs font-medium text-bucket-save">Save</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {currentAllocation.save}%
            </p>
          </div>
          <div className="rounded-xl bg-bucket-give/10 p-3 text-center">
            <p className="text-xs font-medium text-bucket-give">Give</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {currentAllocation.give}%
            </p>
          </div>
          <div className="rounded-xl bg-bucket-invest/10 p-3 text-center">
            <p className="text-xs font-medium text-bucket-invest">Invest</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {currentAllocation.invest}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FamilyPage() {
  const [isAddKidModalOpen, setIsAddKidModalOpen] = useState(false);
  const family = useQuery(api.families.getMyFamily);
  const kidsQuery = useQuery(
    api.users.getFamilyKids,
    family ? { familyId: family._id } : "skip"
  );
  const validKids = kidsQuery?.filter((k): k is NonNullable<typeof k> => k !== null) ?? [];
  const inviteCode = useQuery(
    api.families.getInviteCode,
    family ? { familyId: family._id } : "skip"
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family</h1>
          <p className="text-gray-600">
            Manage your family members and settings.
          </p>
        </div>
        {family && (
          <button
            onClick={() => setIsAddKidModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Kid
          </button>
        )}
      </div>

      {/* Add Kid Modal */}
      {family && (
        <AddKidModal
          isOpen={isAddKidModalOpen}
          onClose={() => setIsAddKidModalOpen(false)}
          familyId={family._id}
          inviteCode={inviteCode}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invite Code Card */}
        {family && <InviteCodeCard familyId={family._id} />}

        {/* Allocation Settings */}
        {family && (
          <AllocationSettingsCard
            familyId={family._id}
            currentAllocation={
              family.defaultAllocation ?? {
                spend: 50,
                save: 30,
                give: 10,
                invest: 10,
              }
            }
          />
        )}
      </div>

      {/* Kids Section */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Kids</h2>
          <span className="text-sm text-gray-500">
            {validKids.length} member{validKids.length !== 1 ? "s" : ""}
          </span>
        </div>

        {validKids.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {validKids.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100">
              <FamilyIcon size={32} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">No kids yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add kids to your family to help them learn money management.
            </p>
            <button
              onClick={() => setIsAddKidModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Kid
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
