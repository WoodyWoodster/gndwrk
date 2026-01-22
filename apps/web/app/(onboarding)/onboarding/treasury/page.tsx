"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function TreasuryPage() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const updateStep = useMutation(api.onboarding.updateStep);
  const storeStripeIds = useMutation(api.onboarding.storeStripeIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already has treasury account
  useEffect(() => {
    if (status?.stripeTreasuryAccountId) {
      router.replace("/onboarding/card");
    }
  }, [status, router]);

  const setupTreasury = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/treasury", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set up treasury account");
      }

      const { financialAccountId } = await response.json();

      // Store the treasury account ID
      await storeStripeIds({
        stripeTreasuryAccountId: financialAccountId,
      });

      // Move to next step
      await updateStep({ step: "card_setup" });
      router.push("/onboarding/card");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up account");
      setIsLoading(false);
    }
  };

  const skipTreasury = async () => {
    // For development/testing - skip Treasury setup
    setIsLoading(true);
    try {
      await updateStep({ step: "card_setup" });
      router.push("/onboarding/card");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip");
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100">
          <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
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
          onClick={setupTreasury}
          disabled={isLoading}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
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
            onClick={skipTreasury}
            disabled={isLoading}
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
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
