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

    // Get user from Convex
    const clerkToken = await auth().then((a) => a.getToken({ template: "convex" }));
    convex.setAuth(clerkToken!);
    const user = await convex.query(api.users.getCurrentUser);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure user has a Connect account
    const connectAccountId = user.stripeConnectAccountId;
    if (!connectAccountId) {
      return NextResponse.json(
        { error: "Treasury account required before card creation" },
        { status: 400 }
      );
    }

    // Check if already has a cardholder
    let cardholderId = user.stripeCardholderId;

    if (!cardholderId) {
      // Create a cardholder
      const cardholder = await stripe.issuing.cardholders.create(
        {
          name: `${user.firstName} ${user.lastName || ""}`.trim(),
          email: user.email,
          type: "individual",
          individual: {
            first_name: user.firstName,
            last_name: user.lastName || "",
          },
          billing: {
            address: {
              line1: "123 Main Street", // Placeholder - should be collected during onboarding
              city: "San Francisco",
              state: "CA",
              postal_code: "94102",
              country: "US",
            },
          },
          metadata: {
            clerkId: user.clerkId,
            convexId: user._id,
          },
        },
        {
          stripeAccount: connectAccountId,
        }
      );

      cardholderId = cardholder.id;

      // Store cardholder ID
      await convex.mutation(api.onboarding.storeStripeIds, {
        stripeCardholderId: cardholderId,
      });
    }

    // Create a virtual card with spending limits
    // Category controls can be added later via the Stripe Dashboard or API updates
    const card = await stripe.issuing.cards.create(
      {
        cardholder: cardholderId,
        currency: "usd",
        type: "virtual",
        status: "active",
        spending_controls: {
          spending_limits: [
            {
              amount: 50000, // $500 daily limit
              interval: "daily",
            },
            {
              amount: 200000, // $2000 monthly limit
              interval: "monthly",
            },
          ],
        },
        metadata: {
          clerkId: user.clerkId,
          convexId: user._id,
          bucketType: "spend",
        },
      },
      {
        stripeAccount: connectAccountId,
      }
    );

    // Store card ID in user's spend account
    await convex.mutation(api.onboarding.storeStripeIds, {
      stripeIssuingCardId: card.id,
    });

    return NextResponse.json({
      cardholderId,
      cardId: card.id,
      last4: card.last4,
    });
  } catch (error) {
    console.error("Error creating issuing card:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create card" },
      { status: 500 }
    );
  }
}
