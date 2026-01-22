"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useUser, useClerk } from "@clerk/nextjs";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-elevation-1">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function FamilySettings() {
  const family = useQuery(api.families.getMyFamily);
  const updateSettings = useMutation(api.families.updateSettings);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const handleSave = async () => {
    if (!family || !name.trim()) return;
    await updateSettings({
      familyId: family._id,
      name: name.trim(),
    });
    setEditing(false);
  };

  if (!family) return null;

  return (
    <SettingsSection
      title="Family Settings"
      description="Manage your family name and preferences"
    >
      <SettingsRow label="Family Name" description={family.name}>
        {editing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={family.name}
              className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSave}
              className="rounded-xl bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setName(family.name);
              setEditing(true);
            }}
            className="text-sm font-semibold text-primary hover:text-primary-600"
          >
            Edit
          </button>
        )}
      </SettingsRow>
    </SettingsSection>
  );
}

function AccountSettings() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) return null;

  return (
    <SettingsSection
      title="Account"
      description="Manage your account settings"
    >
      <SettingsRow label="Email" description={user.primaryEmailAddress?.emailAddress}>
        <span className="text-sm text-gray-500">Managed by Clerk</span>
      </SettingsRow>

      <SettingsRow label="Name" description={user.fullName ?? "Not set"}>
        <a
          href="https://accounts.clerk.dev/user"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:text-primary-600"
        >
          Manage
        </a>
      </SettingsRow>

      <SettingsRow label="Password" description="Change your password">
        <a
          href="https://accounts.clerk.dev/user/security"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:text-primary-600"
        >
          Change
        </a>
      </SettingsRow>

      <SettingsRow
        label="Sign Out"
        description="Sign out of your account on this device"
      >
        <button
          onClick={() => signOut()}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100"
        >
          Sign Out
        </button>
      </SettingsRow>
    </SettingsSection>
  );
}

function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [choreApprovals, setChoreApprovals] = useState(true);
  const [loanRequests, setLoanRequests] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <SettingsSection
      title="Notifications"
      description="Choose what notifications you receive"
    >
      <SettingsRow
        label="Email Notifications"
        description="Receive notifications via email"
      >
        <button
          onClick={() => setEmailNotifications(!emailNotifications)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            emailNotifications ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              emailNotifications ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </SettingsRow>

      <SettingsRow
        label="Chore Approval Requests"
        description="When a kid completes a chore"
      >
        <button
          onClick={() => setChoreApprovals(!choreApprovals)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            choreApprovals ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              choreApprovals ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </SettingsRow>

      <SettingsRow
        label="Loan Requests"
        description="When a kid requests a loan"
      >
        <button
          onClick={() => setLoanRequests(!loanRequests)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            loanRequests ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              loanRequests ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </SettingsRow>

      <SettingsRow
        label="Weekly Digest"
        description="Summary of family activity"
      >
        <button
          onClick={() => setWeeklyDigest(!weeklyDigest)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            weeklyDigest ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              weeklyDigest ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </SettingsRow>
    </SettingsSection>
  );
}

function DangerZone() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <SettingsSection
      title="Danger Zone"
      description="Irreversible actions"
    >
      <SettingsRow
        label="Delete Family"
        description="Permanently delete your family and all associated data"
      >
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100"
        >
          Delete Family
        </button>
      </SettingsRow>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevation-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Family?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone. All family data including kids'
              accounts, transactions, chores, and loans will be permanently
              deleted.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement family deletion
                  alert("Family deletion not yet implemented");
                  setShowConfirm(false);
                }}
                className="flex-1 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-red-700 hover:shadow-elevation-2"
              >
                Delete Family
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account and family settings.
        </p>
      </div>

      <div className="space-y-6">
        <FamilySettings />
        <AccountSettings />
        <NotificationSettings />
        <DangerZone />
      </div>
    </div>
  );
}
