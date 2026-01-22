import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/icons";

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
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
      <main className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-lg py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
