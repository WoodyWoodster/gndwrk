import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@gndwrk/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkToken = await auth().then((a) => a.getToken({ template: "convex" }));
    convex.setAuth(clerkToken!);

    const onboardingStatus = await convex.query(api.onboarding.getStatus);

    const connectAccountId = onboardingStatus?.stripeConnectAccountId;
    if (!connectAccountId) {
      return NextResponse.json(
        { error: "No Connect account found" },
        { status: 404 }
      );
    }

    // Retrieve current account from Stripe
    const account = await stripe.accounts.retrieve(connectAccountId);

    const mapCapability = (status: string | undefined) => {
      if (status === "active") return "active" as const;
      if (status === "pending") return "pending" as const;
      if (status === "restricted") return "restricted" as const;
      return "inactive" as const;
    };

    const capabilities = {
      cardIssuing: mapCapability(account.capabilities?.card_issuing),
      treasury: mapCapability(account.capabilities?.treasury),
    };

    // Sync to Convex
    await convex.mutation(api.onboarding.updateCapabilities, { capabilities });

    return NextResponse.json({ capabilities });
  } catch (error) {
    console.error("Error checking capability status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check capabilities" },
      { status: 500 }
    );
  }
}
