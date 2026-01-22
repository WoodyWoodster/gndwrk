import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  LogoMark,
  BucketIcon,
  FamilyIcon,
  ChoreIcon,
  LoanIcon,
  TrustScoreIcon,
} from "@/components/icons";
import { OnboardingCheck } from "@/components/onboarding-check";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white shadow-elevation-1">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-elevation-2">
              <LogoMark size={28} />
            </div>
            <span className="text-xl font-bold text-gray-900">Gndwrk</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-primary-50"
            >
              <BucketIcon size={22} />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              href="/dashboard/family"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-primary-50"
            >
              <FamilyIcon size={22} />
              <span className="font-medium">Family</span>
            </Link>

            <Link
              href="/dashboard/chores"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-primary-50"
            >
              <ChoreIcon size={22} />
              <span className="font-medium">Chores</span>
            </Link>

            <Link
              href="/dashboard/loans"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-primary-50"
            >
              <LoanIcon size={22} />
              <span className="font-medium">Loans</span>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-colors hover:bg-primary-50"
            >
              <TrustScoreIcon size={22} />
              <span className="font-medium">Analytics</span>
            </Link>
          </nav>

          {/* User */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Account</p>
                <Link
                  href="/dashboard/settings"
                  className="text-xs text-gray-500 hover:text-primary"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64">
        <OnboardingCheck>
          <div className="p-8">{children}</div>
        </OnboardingCheck>
      </main>
    </div>
  );
}
