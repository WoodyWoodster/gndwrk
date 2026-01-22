"use client";

import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);

  useEffect(() => {
    // Wait for query to load
    if (status === undefined) return;

    // If no user or onboarding not complete, redirect to onboarding
    if (status === null || (status.onboardingStep && status.onboardingStep !== "complete")) {
      router.replace("/onboarding");
    }
  }, [status, router]);

  // Show loading state while checking
  if (status === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If needs onboarding, show nothing (redirect is happening)
  if (status === null || (status.onboardingStep && status.onboardingStep !== "complete")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
