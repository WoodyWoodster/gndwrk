"use client";

import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingRouter() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const [hasWaited, setHasWaited] = useState(false);

  // Give Convex a moment to sync user from Clerk webhook
  useEffect(() => {
    const timer = setTimeout(() => setHasWaited(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === undefined) return; // Still loading from Convex

    // If no user record yet (Clerk webhook may not have fired)
    // Wait a bit then redirect to role selection to start fresh
    if (status === null) {
      if (hasWaited) {
        router.replace("/onboarding/role");
      }
      return;
    }

    // Route to the appropriate step based on onboarding progress
    switch (status.onboardingStep) {
      case "complete":
        router.replace("/dashboard");
        break;
      case "role_select":
        router.replace("/onboarding/role");
        break;
      case "family_create":
        router.replace("/onboarding/family");
        break;
      case "plan_select":
        router.replace("/onboarding/plan");
        break;
      case "checkout":
        router.replace("/onboarding/checkout");
        break;
      case "kyc_verify":
        router.replace("/onboarding/kyc");
        break;
      case "treasury_setup":
        router.replace("/onboarding/treasury");
        break;
      case "bank_link":
        router.replace("/onboarding/bank");
        break;
      default:
        router.replace("/onboarding/role");
    }
  }, [status, router, hasWaited]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-gray-600">Loading your progress...</p>
    </div>
  );
}
