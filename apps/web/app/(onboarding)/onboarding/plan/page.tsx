"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfigureIllustration } from "@/components/icons/illustrations";
import { CheckIcon, StarIcon } from "@/components/icons";

type Tier = "starter" | "family" | "familyplus";

const plans: {
  id: Tier;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  cta: string;
  recommended?: boolean;
  bestValue?: boolean;
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    priceNote: "/month",
    description: "Get started with the basics",
    features: [
      "1 child account",
      "2 buckets (Spend & Save)",
      "1 debit card ($5 shipping)",
      "Basic chore tracking",
      "Basic Trust Score",
      "Parent dashboard",
    ],
    cta: "Get Started Free",
  },
  {
    id: "family",
    name: "Family",
    price: "$7.99",
    priceNote: "/month",
    description: "Everything for growing families",
    features: [
      "Up to 5 kids",
      "All 4 buckets (Spend, Save, Give, Invest)",
      "Debit cards included, free shipping",
      "AI Money Coach",
      "Full Trust Score system",
      "Kid loans with interest lessons",
      "Advanced chore marketplace",
    ],
    cta: "Start 14-Day Free Trial",
    recommended: true,
  },
  {
    id: "familyplus",
    name: "Family+",
    price: "$12.99",
    priceNote: "/month",
    description: "Premium features for large families",
    features: [
      "Unlimited kids",
      "Everything in Family",
      "Investment simulation",
      "Premium card designs",
      "Priority support",
    ],
    cta: "Start 14-Day Free Trial",
    bestValue: true,
  },
];

export default function PlanSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useQuery(api.onboarding.getStatus);
  const selectPlan = useMutation(api.onboarding.selectPlan);

  // Get plan from URL query param (e.g., ?plan=family)
  const urlPlan = searchParams.get("plan") as Tier | null;
  const validPlans: Tier[] = ["starter", "family", "familyplus"];
  const initialPlan = urlPlan && validPlans.includes(urlPlan) ? urlPlan : "family";

  const [selectedTier, setSelectedTier] = useState<Tier>(initialPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect kids - they don't select plans
  const role = status?.role;
  useEffect(() => {
    if (role === "kid") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const handleSelectPlan = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await selectPlan({ tier: selectedTier });
      router.push(selectedTier === "starter" ? "/onboarding/kyc" : "/onboarding/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select plan");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        <ConfigureIllustration size={120} />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-gray-600">
          Select the plan that fits your family. You can upgrade anytime.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Plan Cards */}
      <div className="mt-8 space-y-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedTier(plan.id)}
            disabled={isSubmitting}
            className={`group relative w-full overflow-hidden rounded-2xl border-2 p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              selectedTier === plan.id
                ? plan.recommended
                  ? "border-primary bg-primary-50/30"
                  : plan.bestValue
                    ? "border-secondary bg-secondary-50/30"
                    : "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300 hover:shadow-elevation-1"
            }`}
          >
            {/* Badge */}
            {plan.recommended && (
              <div className="absolute -top-px right-4 z-10">
                <span className="inline-flex items-center gap-1 rounded-b-lg bg-primary px-3 py-1 text-xs font-semibold text-white">
                  <StarIcon size={12} className="text-accent" />
                  Recommended
                </span>
              </div>
            )}
            {plan.bestValue && (
              <div className="absolute -top-px right-4 z-10">
                <span className="inline-flex items-center gap-1 rounded-b-lg bg-secondary px-3 py-1 text-xs font-semibold text-white">
                  Best Value
                </span>
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              {/* Selection Indicator */}
              <div
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  selectedTier === plan.id
                    ? plan.recommended
                      ? "border-primary bg-primary"
                      : plan.bestValue
                        ? "border-secondary bg-secondary"
                        : "border-gray-900 bg-gray-900"
                    : "border-gray-300"
                }`}
              >
                {selectedTier === plan.id && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Plan Info */}
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.priceNote}</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

                {/* Features - shown when selected */}
                {selectedTier === plan.id && (
                  <ul className="mt-4 grid gap-2 border-t border-gray-100 pt-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckIcon size={16} className="mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <button
        onClick={handleSelectPlan}
        disabled={isSubmitting}
        className={`mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          selectedTier === "starter"
            ? "bg-gray-900 hover:bg-gray-800"
            : selectedTier === "familyplus"
              ? "bg-secondary hover:bg-secondary-600"
              : "bg-primary hover:bg-primary-600"
        }`}
      >
        {isSubmitting
          ? "Setting up..."
          : plans.find((p) => p.id === selectedTier)?.cta}
      </button>

      {/* Trust Note */}
      <p className="mt-4 text-center text-xs text-gray-500">
        {selectedTier === "starter"
          ? "No credit card required"
          : "14-day free trial. Cancel anytime."}
      </p>

      {/* Progress Indicator */}
      <div className="mt-6 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-bucket-spend" />
        <div className="h-2 w-8 rounded-full bg-bucket-save" />
        <div className="h-2 w-8 rounded-full bg-bucket-give" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
