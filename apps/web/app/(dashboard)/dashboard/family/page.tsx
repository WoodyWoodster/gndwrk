"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { formatCurrency } from "@/lib/utils";
import { FamilyIcon } from "@/components/icons";

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
  const family = useQuery(api.families.getMyFamily);
  const kids = useQuery(
    api.users.getFamilyKids,
    family ? { familyId: family._id } : "skip"
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Family</h1>
        <p className="text-gray-600">
          Manage your family members and settings.
        </p>
      </div>

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
            {kids?.length ?? 0} member{kids?.length !== 1 ? "s" : ""}
          </span>
        </div>

        {kids && kids.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {kids.map((kid) => (
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
              Share your family invite code with your kids to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
