"use client";

import { useEffect } from "react";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function KYCCallbackPage() {
  const router = useRouter();
  const status = useConvexQuery(api.onboarding.getStatus);
  const updateStep = useConvexMutation(api.onboarding.updateStep);
  const storeStripeIds = useConvexMutation(api.onboarding.storeStripeIds);

  const { data, isLoading, error } = useQuery({
    queryKey: ["kyc-status", status?.stripeIdentitySessionId],
    queryFn: async () => {
      const res = await fetch("/api/stripe/identity/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: status!.stripeIdentitySessionId }),
      });
      if (!res.ok) throw new Error("Failed to check status");
      return res.json();
    },
    enabled: !!status?.stripeCustomerId && !!status?.stripeIdentitySessionId,
    staleTime: Infinity,
    retry: false,
  });

  // Handle routing based on verification status
  useEffect(() => {
    if (!data) return;

    const handleResult = async () => {
      if (data.status === "verified") {
        await storeStripeIds({ kycStatus: "verified" });
        await updateStep({ step: "treasury_setup" });
        setTimeout(() => router.push("/onboarding/treasury"), 1500);
      } else if (data.status === "requires_input" || data.status === "canceled") {
        router.replace("/onboarding/kyc");
      }
    };

    handleResult();
  }, [data, storeStripeIds, updateStep, router]);

  // Redirect if no customer ID
  useEffect(() => {
    if (status && !status.stripeCustomerId) {
      router.replace("/onboarding/kyc");
    }
  }, [status, router]);

  const verificationStatus = data?.status;

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
        <div className="flex flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-gray-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "verified") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100">
            <svg className="h-8 w-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Identity Verified!</h1>
          <p className="mt-2 text-gray-600">
            Your identity has been successfully verified. Redirecting to the next step...
          </p>
        </div>
      </div>
    );
  }

  if (error || (verificationStatus !== "verified" && verificationStatus !== "requires_input" && verificationStatus !== "canceled")) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Verification Issue</h1>
          <p className="mt-2 text-gray-600">
            There was an issue with your verification. Please try again.
          </p>
          <button
            onClick={() => router.push("/onboarding/kyc")}
            className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
