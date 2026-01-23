"use client";

import { useEffect } from "react";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ConfigureIllustration } from "@/components/icons/illustrations";
import { PLANS } from "@/lib/pricing";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({
  subscriptionId,
  tierName,
  tierPrice,
}: {
  subscriptionId: string;
  tierName: string;
  tierPrice: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const storeCheckoutSubscription = useConvexMutation(api.onboarding.storeCheckoutSubscription);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: setupError } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (setupError) {
      setError(setupError.message ?? "Payment setup failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    // Success - store subscription and advance
    await storeCheckoutSubscription({ stripeSubscriptionId: subscriptionId });
    router.push("/onboarding/kyc");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-medium text-gray-900">{tierName} Plan</span>
          <div>
            <span className="text-xl font-bold text-gray-900">{tierPrice}</span>
            <span className="text-sm text-gray-500">/month</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-secondary font-medium">14-day free trial included</p>
      </div>

      <PaymentElement />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </span>
        ) : (
          "Start Free Trial"
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        You won't be charged until your 14-day trial ends. Cancel anytime.
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const status = useConvexQuery(api.onboarding.getStatus);
  const storeCheckoutSubscription = useConvexMutation(api.onboarding.storeCheckoutSubscription);

  const tier = status?.selectedTier;

  // Guard: redirect if starter plan (no checkout needed)
  useEffect(() => {
    if (status && (!tier || tier === "starter")) {
      router.replace("/onboarding/kyc");
    }
  }, [status, tier, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["checkout-session"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create checkout session");
      }
      return res.json();
    },
    enabled: !!status && !!tier && tier !== "starter",
    staleTime: Infinity,
    retry: false,
  });

  // Handle already-confirmed subscription
  useEffect(() => {
    if (data?.alreadyConfirmed) {
      storeCheckoutSubscription({
        stripeSubscriptionId: status?.stripeSubscriptionId ?? "",
      }).then(() => router.push("/onboarding/kyc"));
    }
  }, [data, storeCheckoutSubscription, status?.stripeSubscriptionId, router]);

  if (!tier || tier === "starter") return null;

  const plan = PLANS[tier];
  const tierPrice = `$${(plan.price / 100).toFixed(2)}`;
  const clientSecret = data?.clientSecret;
  const subscriptionId = data?.subscriptionId;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      <div className="flex justify-center mb-6">
        <ConfigureIllustration size={120} />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Set Up Payment</h1>
        <p className="mt-2 text-gray-600">
          Add a payment method to start your 14-day free trial.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error instanceof Error ? error.message : "Failed to initialize checkout"}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Preparing checkout...</p>
        </div>
      ) : clientSecret && subscriptionId ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#6366f1",
                borderRadius: "12px",
              },
            },
          }}
        >
          <CheckoutForm
            subscriptionId={subscriptionId}
            tierName={plan.name}
            tierPrice={tierPrice}
          />
        </Elements>
      ) : null}

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-bucket-spend" />
        <div className="h-2 w-8 rounded-full bg-bucket-save" />
        <div className="h-2 w-8 rounded-full bg-bucket-give" />
        <div className="h-2 w-8 rounded-full bg-bucket-invest" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
