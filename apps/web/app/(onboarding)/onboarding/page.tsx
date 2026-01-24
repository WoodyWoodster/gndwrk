"use client";

import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingRouter() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);

  useEffect(() => {
    if (status === undefined) return; // Still loading from Convex

    // No user record yet — ensureUser in the mutations will create them
    if (status === null) {
      router.replace("/onboarding/role");
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
  }, [status, router]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-4 text-gray-600">Loading your progress...</p>
    </div>
  );
}
