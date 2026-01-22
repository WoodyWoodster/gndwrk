"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function KYCCallbackPage() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const updateStep = useMutation(api.onboarding.updateStep);
  const storeStripeIds = useMutation(api.onboarding.storeStripeIds);
  const [verificationStatus, setVerificationStatus] = useState<"checking" | "verified" | "failed">("checking");

  useEffect(() => {
    const checkVerification = async () => {
      if (!status?.stripeCustomerId) {
        // No customer ID, go back to KYC
        router.replace("/onboarding/kyc");
        return;
      }

      try {
        // Check the verification status
        const response = await fetch("/api/stripe/identity/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: status.stripeIdentitySessionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to check status");
        }

        const { status: verifyStatus } = await response.json();

        if (verifyStatus === "verified") {
          await storeStripeIds({ kycStatus: "verified" });
          await updateStep({ step: "treasury_setup" });
          setVerificationStatus("verified");
          setTimeout(() => router.push("/onboarding/treasury"), 1500);
        } else if (verifyStatus === "requires_input" || verifyStatus === "canceled") {
          // User needs to try again
          router.replace("/onboarding/kyc");
        } else {
          // Still processing or failed
          setVerificationStatus("failed");
        }
      } catch (error) {
        console.error("Failed to check verification:", error);
        setVerificationStatus("failed");
      }
    };

    if (status) {
      checkVerification();
    }
  }, [status, router, storeStripeIds, updateStep]);

  if (verificationStatus === "checking") {
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
