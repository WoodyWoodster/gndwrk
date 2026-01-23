"use client";

import { useEffect } from "react";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { ConfigureIllustration } from "@/components/icons/illustrations";
import { BucketIcon } from "@/components/icons";

export default function TreasuryPage() {
  const router = useRouter();
  const status = useConvexQuery(api.onboarding.getStatus);
  const updateStep = useConvexMutation(api.onboarding.updateStep);

  // Redirect if already has treasury account
  useEffect(() => {
    if (status?.stripeTreasuryAccountId) {
      router.replace("/onboarding/bank");
    }
  }, [status, router]);

  const treasuryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/treasury", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to set up treasury account");
      }
      return res.json();
    },
    onSuccess: async () => {
      await updateStep({ step: "bank_link" });
      router.push("/onboarding/bank");
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      await updateStep({ step: "bank_link" });
    },
    onSuccess: () => {
      router.push("/onboarding/bank");
    },
  });

  const isProcessing = treasuryMutation.isPending || skipMutation.isPending;
  const error = treasuryMutation.error?.message || skipMutation.error?.message;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        <ConfigureIllustration size={120} />
      </div>

      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-bucket-spend-50 shadow-elevation-2">
          <BucketIcon size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Set Up Your Account</h1>
        <p className="mt-2 text-gray-600">
          We'll create your family's financial account with the 4-bucket system.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900">Your 4 buckets:</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-bucket-spend/10 p-3">
              <p className="text-sm font-semibold text-bucket-spend">Spend</p>
              <p className="mt-1 text-xs text-gray-600">Everyday purchases</p>
            </div>
            <div className="rounded-lg bg-bucket-save/10 p-3">
              <p className="text-sm font-semibold text-bucket-save">Save</p>
              <p className="mt-1 text-xs text-gray-600">Goals & emergencies</p>
            </div>
            <div className="rounded-lg bg-bucket-give/10 p-3">
              <p className="text-sm font-semibold text-bucket-give">Give</p>
              <p className="mt-1 text-xs text-gray-600">Charity & gifting</p>
            </div>
            <div className="rounded-lg bg-bucket-invest/10 p-3">
              <p className="text-sm font-semibold text-bucket-invest">Invest</p>
              <p className="mt-1 text-xs text-gray-600">Long-term growth</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => treasuryMutation.mutate()}
          disabled={isProcessing}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {treasuryMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Setting up account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>

        {/* Skip button for development */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => skipMutation.mutate()}
            disabled={isProcessing}
            className="w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Skip (Development Only)
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        Your funds are held securely with our banking partner and are FDIC insured.
      </p>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-bucket-spend" />
        <div className="h-2 w-8 rounded-full bg-bucket-save" />
        <div className="h-2 w-8 rounded-full bg-bucket-give" />
        <div className="h-2 w-8 rounded-full bg-bucket-invest" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
