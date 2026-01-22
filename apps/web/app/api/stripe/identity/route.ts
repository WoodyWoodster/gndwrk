import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@gndwrk/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and stripe data from Convex
    const clerkToken = await auth().then((a) => a.getToken({ template: "convex" }));
    convex.setAuth(clerkToken!);

    const [user, onboardingStatus] = await Promise.all([
      convex.query(api.users.getCurrentUser),
      convex.query(api.onboarding.getStatus),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or retrieve Stripe Customer
    let customerId = onboardingStatus?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: {
          clerkId: user.clerkId,
          convexId: user._id,
        },
      });
      customerId = customer.id;

      // Store customer ID in Convex
      await convex.mutation(api.onboarding.storeStripeIds, {
        stripeCustomerId: customerId,
      });
    }

    // Create Identity Verification Session
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        clerkId: user.clerkId,
        convexId: user._id,
        customerId,
      },
      options: {
        document: {
          allowed_types: ["driving_license", "passport", "id_card"],
          require_id_number: true,
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/kyc-callback`,
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      customerId,
    });
  } catch (error) {
    console.error("Error creating identity session:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create verification session" },
      { status: 500 }
    );
  }
}
