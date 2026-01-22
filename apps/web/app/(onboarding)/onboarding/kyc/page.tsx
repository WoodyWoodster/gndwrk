"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";

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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100">
          <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
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
              <svg className="h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              A valid government-issued ID
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Your device's camera
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
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
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
        <div className="h-2 w-8 rounded-full bg-primary" />
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
