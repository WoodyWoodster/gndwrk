"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { GrowthIllustration } from "@/components/icons/illustrations";
import { FamilyIcon, ChoreIcon, BucketIcon } from "@/components/icons";

export default function CompletePage() {
  const router = useRouter();
  const status = useQuery(api.onboarding.getStatus);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fire confetti on mount
    const duration = 2000;
    const end = Date.now() + duration;

    // Bucket system colors for confetti
    const bucketColors = ["#F06050", "#38BDF8", "#A78BFA", "#84CC16", "#F59315"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: bucketColors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: bucketColors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
    setShowContent(true);
  }, []);

  // Redirect if not complete - guard against race condition
  // Don't redirect if coming from bank_link or treasury_setup (natural previous steps)
  useEffect(() => {
    if (status && status.onboardingStep !== "complete" && status.onboardingStep !== "bank_link" && status.onboardingStep !== "treasury_setup") {
      router.replace("/onboarding");
    }
  }, [status, router]);

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2 transition-all duration-500 ${
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        <GrowthIllustration size={140} />
      </div>

      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary-50 shadow-elevation-2">
          <svg className="h-10 w-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">You're All Set!</h1>
        <p className="mt-3 text-gray-600">
          Your family account is ready. Welcome to Gndwrk!
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">What's next?</h3>
          <ul className="mt-3 space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                <FamilyIcon size={14} className="[&_*]:fill-white" />
              </span>
              <span>Add your kids to your family using the invite code or creating their profiles</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bucket-spend">
                <ChoreIcon size={14} className="[&_*]:fill-white" />
              </span>
              <span>Set up allowances and chores to start teaching money management</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bucket-invest">
                <BucketIcon size={14} className="[&_*]:fill-white" />
              </span>
              <span>Fund accounts and customize spending rules for each child</span>
            </li>
          </ul>
        </div>

        <button
          onClick={goToDashboard}
          className="w-full rounded-xl bg-primary px-5 py-4 text-sm font-semibold text-white shadow-elevation-1 transition-all hover:bg-primary-600 hover:shadow-elevation-2"
        >
          Go to Dashboard
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        Need help? Check out our guides or contact support.
      </p>
    </div>
  );
}
