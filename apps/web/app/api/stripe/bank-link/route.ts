import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@gndwrk/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkToken = await auth().then((a) => a.getToken({ template: "convex" }));
    convex.setAuth(clerkToken!);

    const onboardingStatus = await convex.query(api.onboarding.getStatus);

    if (!onboardingStatus) {
      return NextResponse.json({ error: "Onboarding session not found" }, { status: 404 });
    }

    // Ensure customer exists
    const customerId = onboardingStatus.stripeCustomerId;
    if (!customerId) {
      return NextResponse.json(
        { error: "Stripe customer not found. Please complete previous steps." },
        { status: 400 }
      );
    }

    // Create Financial Connections session
    const session = await stripe.financialConnections.sessions.create({
      account_holder: {
        type: "customer",
        customer: customerId,
      },
      permissions: ["payment_method", "balances"],
      filters: {
        countries: ["US"],
        account_subcategories: ["checking", "savings"],
      },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
    });
  } catch (error) {
    console.error("Error creating bank link session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create bank link session" },
      { status: 500 }
    );
  }
}
