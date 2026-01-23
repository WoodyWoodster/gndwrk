"use client";

import { useEffect } from "react";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { ConfigureIllustration } from "@/components/icons/illustrations";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BankLinkPage() {
  const router = useRouter();
  const status = useConvexQuery(api.onboarding.getStatus);
  const completeOnboarding = useConvexMutation(api.onboarding.complete);
  const storeBankLink = useConvexMutation(api.onboarding.storeBankLink);

  // Guard: redirect if onboarding is already complete
  useEffect(() => {
    if (status?.isComplete) {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const linkMutation = useMutation({
    mutationFn: async () => {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Failed to load Stripe");

      // Get Financial Connections session
      const response = await fetch("/api/stripe/bank-link", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create bank link session");
      }

      const { clientSecret } = await response.json();

      // Open Financial Connections modal
      const result = await stripe.collectFinancialConnectionsAccounts({
        clientSecret,
      });

      if (result.error) {
        throw new Error(result.error.message || "Bank linking failed");
      }

      const accounts = result.financialConnectionsSession?.accounts ?? [];

      if (accounts.length === 0) {
        throw new Error("No accounts were linked. Please try again.");
      }

      // Store each linked account
      for (const account of accounts) {
        const accountType = account.subcategory === "checking"
          ? "checking" as const
          : account.subcategory === "savings"
            ? "savings" as const
            : "other" as const;

        await storeBankLink({
          stripeFinancialConnectionsAccountId: account.id,
          institutionName: account.institution_name ?? "Unknown",
          accountLast4: account.last4 ?? "****",
          accountType,
        });
      }

      // Complete onboarding and navigate
      await completeOnboarding();
    },
    onSuccess: () => {
      router.push("/onboarding/complete");
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      await completeOnboarding();
    },
    onSuccess: () => {
      router.push("/onboarding/complete");
    },
  });

  const isProcessing = linkMutation.isPending || skipMutation.isPending;
  const error = linkMutation.error?.message || skipMutation.error?.message;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      <div className="flex justify-center mb-6">
        <ConfigureIllustration size={120} />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Connect Your Bank</h1>
        <p className="mt-2 text-gray-600">
          Link a bank account to easily fund your kids' accounts.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {linkMutation.isSuccess && (
        <div className="mt-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Bank account linked successfully!
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900">Why link a bank account?</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Fund your kids' accounts via ACH transfer</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Set up recurring allowances automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Bank-level security with Stripe Financial Connections</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => linkMutation.mutate()}
          disabled={isProcessing}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {linkMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Connecting...
            </span>
          ) : (
            "Connect Bank Account"
          )}
        </button>

        <button
          onClick={() => skipMutation.mutate()}
          disabled={isProcessing}
          className="w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {skipMutation.isPending ? "Continuing..." : "Skip for Now"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        You can always link a bank account later from your dashboard.
      </p>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-bucket-spend" />
        <div className="h-2 w-8 rounded-full bg-bucket-save" />
        <div className="h-2 w-8 rounded-full bg-bucket-give" />
        <div className="h-2 w-8 rounded-full bg-bucket-invest" />
        <div className="h-2 w-8 rounded-full bg-bucket-spend" />
        <div className="h-2 w-8 rounded-full bg-bucket-save" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
