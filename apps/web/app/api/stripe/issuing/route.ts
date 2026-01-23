import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
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

    // Get user's IP address for terms acceptance
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const userIp = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";

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

    // Ensure user has a Connect account and Treasury financial account
    const connectAccountId = onboardingStatus?.stripeConnectAccountId;
    const treasuryAccountId = onboardingStatus?.stripeTreasuryAccountId;

    if (!connectAccountId) {
      return NextResponse.json(
        { error: "Connect account required before card creation" },
        { status: 400 }
      );
    }

    if (!treasuryAccountId) {
      return NextResponse.json(
        { error: "Treasury account required before card creation" },
        { status: 400 }
      );
    }

    // Check if card_issuing capability is active
    const connectAccount = await stripe.accounts.retrieve(connectAccountId);
    const cardIssuingCapability = connectAccount.capabilities?.card_issuing;

    if (cardIssuingCapability !== "active") {
      console.log("Card issuing capability status:", cardIssuingCapability);
      console.log("Account requirements:", connectAccount.requirements);

      return NextResponse.json(
        {
          status: "capability_pending",
          capabilityStatus: cardIssuingCapability || "inactive",
          requirements: connectAccount.requirements?.currently_due,
        },
        { status: 202 }
      );
    }

    // Get personal info for billing address
    const personalInfo = onboardingStatus?.personalInfo;
    if (!personalInfo) {
      return NextResponse.json(
        { error: "Personal information required. Please complete KYC verification first." },
        { status: 400 }
      );
    }

    // Check if already has a cardholder
    let cardholderId = onboardingStatus?.stripeCardholderId;

    if (!cardholderId) {
      // Create a cardholder with terms acceptance
      const cardholder = await stripe.issuing.cardholders.create(
        {
          name: `${user.firstName} ${user.lastName || ""}`.trim(),
          email: user.email,
          type: "individual",
          individual: {
            first_name: user.firstName,
            last_name: user.lastName || "",
            card_issuing: {
              user_terms_acceptance: {
                date: Math.floor(Date.now() / 1000), // Unix timestamp
                ip: userIp,
              },
            },
          },
          billing: {
            address: {
              line1: personalInfo.address.line1,
              line2: personalInfo.address.line2 || undefined,
              city: personalInfo.address.city,
              state: personalInfo.address.state,
              postal_code: personalInfo.address.postalCode,
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
    } else {
      // Existing cardholder - check if they need terms acceptance update
      const existingCardholder = await stripe.issuing.cardholders.retrieve(
        cardholderId,
        { stripeAccount: connectAccountId }
      );

      // If cardholder has outstanding requirements, update with terms acceptance
      if (existingCardholder.requirements?.past_due?.length) {
        await stripe.issuing.cardholders.update(
          cardholderId,
          {
            individual: {
              card_issuing: {
                user_terms_acceptance: {
                  date: Math.floor(Date.now() / 1000),
                  ip: userIp,
                },
              },
            },
          },
          { stripeAccount: connectAccountId }
        );
      }
    }

    // Create a virtual card with spending limits
    // Category controls can be added later via the Stripe Dashboard or API updates
    const card = await stripe.issuing.cards.create(
      {
        cardholder: cardholderId,
        financial_account: treasuryAccountId, // Required: links card to Treasury for funding
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
