"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function CardPage() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const updateStep = useMutation(api.onboarding.updateStep);
  const storeStripeIds = useMutation(api.onboarding.storeStripeIds);
  const completeOnboarding = useMutation(api.onboarding.complete);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already has card
  useEffect(() => {
    if (status?.stripeCardholderId) {
      router.replace("/onboarding/complete");
    }
  }, [status, router]);

  const setupCard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/issuing", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create card");
      }

      const { cardholderId, cardId } = await response.json();

      // Store the cardholder ID
      await storeStripeIds({
        stripeCardholderId: cardholderId,
      });

      // Complete onboarding
      await completeOnboarding();
      router.push("/onboarding/complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create card");
      setIsLoading(false);
    }
  };

  const skipCard = async () => {
    // For development/testing - skip card setup
    setIsLoading(true);
    try {
      await completeOnboarding();
      router.push("/onboarding/complete");
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
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Get Your Debit Card</h1>
        <p className="mt-2 text-gray-600">
          We'll create a virtual debit card linked to your Spend bucket.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {/* Card Preview */}
        <div className="relative mx-auto aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-600 to-secondary p-6 text-white shadow-elevation-3">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="80" cy="20" r="40" fill="white" />
              <circle cx="20" cy="80" r="30" fill="white" />
            </svg>
          </div>
          <div className="relative">
            <p className="text-sm font-medium opacity-80">Gndwrk</p>
            <div className="mt-6">
              <p className="font-mono text-lg tracking-wider">•••• •••• •••• ••••</p>
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <p className="text-xs opacity-60">CARDHOLDER</p>
                <p className="text-sm font-medium">Your Name</p>
              </div>
              <div>
                <p className="text-xs opacity-60">EXPIRES</p>
                <p className="text-sm font-medium">••/••</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900">Card features:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Virtual card for online purchases
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Real-time transaction notifications
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Spending limits set by parents
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Order physical card later
            </li>
          </ul>
        </div>

        <button
          onClick={setupCard}
          disabled={isLoading}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating your card...
            </span>
          ) : (
            "Create My Card"
          )}
        </button>

        {/* Skip button for development */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={skipCard}
            disabled={isLoading}
            className="w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Skip (Development Only)
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
      </div>
    </div>
  );
}
