"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@gndwrk/convex/_generated/api";
import { useRouter } from "next/navigation";
import { SignUpIllustration } from "@/components/icons/illustrations";
import { FamilyIcon } from "@/components/icons";

export default function RoleSelectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setRole = useMutation(api.users.setRole);
  const updateStep = useMutation(api.onboarding.updateStep);

  const handleRoleSelect = async (role: "parent" | "kid") => {
    setIsSubmitting(true);
    try {
      if (role === "parent") {
        await Promise.all([
          setRole({ role }),
          updateStep({ step: "family_create" }),
        ]);
      } else {
        await setRole({ role });
      }
      router.push("/onboarding/family");
    } catch (error) {
      console.error("Failed to set role:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-elevation-2">
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        <SignUpIllustration size={120} />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Gndwrk</h1>
        <p className="mt-2 text-gray-600">
          Let's get you set up. First, tell us who you are.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <button
          onClick={() => handleRoleSelect("parent")}
          disabled={isSubmitting}
          className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 p-6 text-left transition-all hover:border-primary hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 shadow-elevation-2">
              <FamilyIcon size={28} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">I'm a Parent</h2>
            <p className="mt-1 text-sm text-gray-600">
              Set up your family account, invite kids, and manage their finances
            </p>
          </div>
        </button>

        <button
          onClick={() => handleRoleSelect("kid")}
          disabled={isSubmitting}
          className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 p-6 text-left transition-all hover:border-secondary hover:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-50 shadow-elevation-2">
              <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" fill="#F59315" />
                <path d="M6 20c0-4 3-6 6-6s6 2 6 6" fill="#F59315" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">I'm a Kid</h2>
            <p className="mt-1 text-sm text-gray-600">
              Join your family and start managing your money
            </p>
          </div>
        </button>
      </div>

      {isSubmitting && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Setting up...
        </div>
      )}
    </div>
  );
}
