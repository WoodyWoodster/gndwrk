import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/icons";

// Floating decorative coin SVG
function FloatingCoin({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#F59315" />
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">$</text>
    </svg>
  );
}

// Floating sparkle SVG
function FloatingSparkle({ className, color = "#A78BFA" }: { className?: string; color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 0l1.5 5.5L16 8l-6.5 2.5L8 16l-1.5-5.5L0 8l6.5-2.5L8 0z"
        fill={color}
      />
    </svg>
  );
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50">
      {/* Floating decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <FloatingCoin className="absolute left-[10%] top-[15%] animate-float opacity-40" />
        <FloatingCoin className="absolute right-[15%] top-[25%] animate-float-delayed opacity-30" />
        <FloatingCoin className="absolute left-[20%] bottom-[20%] animate-float opacity-25" />
        <FloatingSparkle className="absolute left-[5%] top-[40%] animate-pulse opacity-50" color="#F06050" />
        <FloatingSparkle className="absolute right-[8%] top-[60%] animate-pulse opacity-40" color="#38BDF8" />
        <FloatingSparkle className="absolute right-[25%] bottom-[30%] animate-pulse opacity-35" color="#84CC16" />
        <FloatingSparkle className="absolute left-[30%] top-[70%] animate-pulse opacity-30" color="#A78BFA" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-center border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-elevation-2">
            <LogoMark size={28} />
          </div>
          <span className="text-xl font-bold text-gray-900">Gndwrk</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-lg py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
