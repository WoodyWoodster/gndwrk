"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { TrustScoreIcon, CheckIcon } from "@/components/icons";

export default function KYCPage() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const updateStep = useMutation(api.onboarding.updateStep);
  const storeStripeIds = useMutation(api.onboarding.storeStripeIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already verified
  useEffect(() => {
    if (status?.kycStatus === "verified") {
      router.replace("/onboarding/treasury");
    }
  }, [status, router]);

  const startVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/identity", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start verification");
      }

      const { clientSecret, sessionId, customerId } = await response.json();

      // Store the customer ID and session ID
      await storeStripeIds({
        stripeCustomerId: customerId,
        stripeIdentitySessionId: sessionId,
        kycStatus: "pending",
      });

      // Load Stripe.js and open the verification modal
      const stripe = await loadStripe();
      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      const { error: stripeError } = await stripe.verifyIdentity(clientSecret);

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Verification completed (or user closed modal)
      // Redirect to callback page to check status
      router.push("/onboarding/kyc-callback");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setIsLoading(false);
    }
  };

  const skipVerification = async () => {
    // For development/testing - skip KYC
    setIsLoading(true);
    try {
      await updateStep({ step: "treasury_setup" });
      router.push("/onboarding/treasury");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip");
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-50 shadow-elevation-2">
          <TrustScoreIcon size={32} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Verify Your Identity</h1>
        <p className="mt-2 text-gray-600">
          We need to verify your identity to set up your banking features. This is required by financial regulations.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-medium text-gray-900">What you'll need:</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckIcon size={16} />
              A valid government-issued ID
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon size={16} />
              Your device's camera
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon size={16} />
              A few minutes to complete the process
            </li>
          </ul>
        </div>

        <button
          onClick={startVerification}
          disabled={isLoading}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Starting verification...
            </span>
          ) : (
            "Start Verification"
          )}
        </button>

        {/* Skip button for development */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={skipVerification}
            disabled={isLoading}
            className="w-full rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Skip (Development Only)
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        Your information is securely processed by Stripe and protected by bank-level encryption.
      </p>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="h-2 w-8 rounded-full bg-bucket-spend" />
        <div className="h-2 w-8 rounded-full bg-bucket-save" />
        <div className="h-2 w-8 rounded-full bg-bucket-give" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
        <div className="h-2 w-8 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

// Helper function to load Stripe.js
async function loadStripe(): Promise<any> {
  if (typeof window === "undefined") return null;

  // Check if already loaded
  if ((window as any).Stripe) {
    return (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }

  // Load the script
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => {
      resolve((window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));
    };
    script.onerror = () => reject(new Error("Failed to load Stripe.js"));
    document.head.appendChild(script);
  });
}
