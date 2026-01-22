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

    // Check if already has treasury account
    if (onboardingStatus?.stripeTreasuryAccountId) {
      return NextResponse.json({
        financialAccountId: onboardingStatus.stripeTreasuryAccountId,
        message: "Treasury account already exists",
      });
    }

    // Ensure user has a Stripe Connect account for Treasury
    let connectAccountId = onboardingStatus?.stripeConnectAccountId;

    if (!connectAccountId) {
      // Create a Connect Custom account for Treasury
      const account = await stripe.accounts.create({
        type: "custom",
        country: "US",
        email: user.email,
        capabilities: {
          treasury: { requested: true },
          card_issuing: { requested: true },
        },
        business_type: "individual",
        individual: {
          first_name: user.firstName,
          last_name: user.lastName || undefined,
          email: user.email,
        },
        business_profile: {
          mcc: "6012", // Financial institutions - for banking apps
          product_description: "Family banking and financial education platform",
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: req.headers.get("x-forwarded-for") || "0.0.0.0",
        },
        metadata: {
          clerkId: user.clerkId,
          convexId: user._id,
        },
      });

      connectAccountId = account.id;

      // Store connect account ID
      await convex.mutation(api.onboarding.storeStripeIds, {
        stripeConnectAccountId: connectAccountId,
      });
    }

    // Create Treasury Financial Account
    const financialAccount = await stripe.treasury.financialAccounts.create(
      {
        supported_currencies: ["usd"],
        features: {
          card_issuing: { requested: true },
          deposit_insurance: { requested: true },
          financial_addresses: {
            aba: { requested: true },
          },
          inbound_transfers: {
            ach: { requested: true },
          },
          intra_stripe_flows: { requested: true },
          outbound_payments: {
            ach: { requested: true },
            us_domestic_wire: { requested: true },
          },
          outbound_transfers: {
            ach: { requested: true },
            us_domestic_wire: { requested: true },
          },
        },
        metadata: {
          clerkId: user.clerkId,
          convexId: user._id,
          type: "parent_account",
        },
      },
      {
        stripeAccount: connectAccountId,
      }
    );

    // Store the treasury account ID
    await convex.mutation(api.onboarding.storeStripeIds, {
      stripeTreasuryAccountId: financialAccount.id,
    });

    return NextResponse.json({
      financialAccountId: financialAccount.id,
      connectAccountId,
    });
  } catch (error) {
    console.error("Error creating treasury account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create treasury account" },
      { status: 500 }
    );
  }
}
