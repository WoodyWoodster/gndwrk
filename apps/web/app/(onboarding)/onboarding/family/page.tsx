"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function FamilyPage() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFamily = useMutation(api.families.create);
  const joinFamily = useMutation(api.families.join);
  const updateStep = useMutation(api.onboarding.updateStep);

  useEffect(() => {
    // If user is a kid, default to join mode
    if (status?.role === "kid") {
      setMode("join");
    }
  }, [status?.role]);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setError("Please enter a family name");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createFamily({ name: familyName.trim() });
      await updateStep({ step: "kyc_verify" });
      router.push("/onboarding/kyc");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create family");
      setIsSubmitting(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await joinFamily({ code: inviteCode.trim().toUpperCase() });
      // Kids skip KYC and go straight to complete
      if (status?.role === "kid") {
        await updateStep({ step: "complete" });
        router.push("/dashboard");
      } else {
        await updateStep({ step: "kyc_verify" });
        router.push("/onboarding/kyc");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invite code");
      setIsSubmitting(false);
    }
  };

  // Redirect if already has family
  useEffect(() => {
    if (status?.familyId) {
      if (status.role === "kid") {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding/kyc");
      }
    }
  }, [status, router]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100">
          <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {status?.role === "kid" ? "Join Your Family" : "Set Up Your Family"}
        </h1>
        <p className="mt-2 text-gray-600">
          {status?.role === "kid"
            ? "Enter the invite code from your parent"
            : "Create a new family or join an existing one"}
        </p>
      </div>

      {/* Mode Toggle - only show for parents */}
      {status?.role === "parent" && (
        <div className="mt-6 flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              mode === "create"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Create Family
          </button>
          <button
            onClick={() => setMode("join")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              mode === "join"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Join Family
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Create Family Form */}
      {mode === "create" && (
        <form onSubmit={handleCreateFamily} className="mt-6">
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
              Family Name
            </label>
            <input
              type="text"
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g., The Smith Family"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !familyName.trim()}
            className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Family"}
          </button>
        </form>
      )}

      {/* Join Family Form */}
      {mode === "join" && (
        <form onSubmit={handleJoinFamily} className="mt-6">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-center font-mono text-xl tracking-wider focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="ABC123"
              maxLength={6}
              disabled={isSubmitting}
            />
            <p className="mt-2 text-xs text-gray-500">
              Ask your parent for the 6-character family invite code
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !inviteCode.trim()}
            className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Joining..." : "Join Family"}
          </button>
        </form>
      )}

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
