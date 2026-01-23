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

    // Ensure personal info was collected during KYC
    const personalInfo = onboardingStatus?.personalInfo;
    if (!personalInfo) {
      return NextResponse.json(
        { error: "Personal information required. Please complete KYC verification first." },
        { status: 400 }
      );
    }

    // Ensure user has a Stripe Connect account for Treasury
    let connectAccountId = onboardingStatus?.stripeConnectAccountId;

    const tosTimestamp = Math.floor(Date.now() / 1000);
    const userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (!connectAccountId) {
      // Create a Connect Custom account for Treasury
      // Use personal info collected during KYC
      const account = await stripe.accounts.create({
        type: "custom",
        country: "US",
        email: user.email,
        capabilities: {
          treasury: { requested: true },
          card_issuing: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        individual: {
          first_name: user.firstName,
          last_name: user.lastName || undefined,
          email: user.email,
          phone: personalInfo.phone, // Required for capabilities
          dob: {
            day: personalInfo.dateOfBirth.day,
            month: personalInfo.dateOfBirth.month,
            year: personalInfo.dateOfBirth.year,
          },
          id_number: personalInfo.ssn, // Full SSN for verification
          address: {
            line1: personalInfo.address.line1,
            line2: personalInfo.address.line2 || undefined,
            city: personalInfo.address.city,
            state: personalInfo.address.state,
            postal_code: personalInfo.address.postalCode,
            country: "US",
          },
        },
        business_profile: {
          mcc: "6012", // Financial institutions - for banking apps
          product_description: "Family banking and financial education platform",
          url: "https://gndwrk.com",
          annual_revenue: {
            amount: 0,
            currency: "usd",
            fiscal_year_end: "2025-12-31",
          },
          estimated_worker_count: 0,
        },
        tos_acceptance: {
          date: tosTimestamp,
          ip: userIp,
        },
        settings: {
          card_issuing: {
            tos_acceptance: {
              date: tosTimestamp,
              ip: userIp,
            },
          },
          treasury: {
            tos_acceptance: {
              date: tosTimestamp,
              ip: userIp,
            },
          },
        },
        // External account for payouts (required for capabilities)
        // In production, you'd collect bank account info or use Stripe's instant payouts
        external_account: {
          object: "bank_account",
          country: "US",
          currency: "usd",
          routing_number: "110000000", // Test routing number
          account_number: "000123456789", // Test account number
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

      // Seed initial capability status
      const createdAccount = await stripe.accounts.retrieve(connectAccountId);
      const mapCapability = (status: string | undefined) => {
        if (status === "active") return "active" as const;
        if (status === "pending") return "pending" as const;
        if (status === "restricted") return "restricted" as const;
        return "inactive" as const;
      };
      await convex.mutation(api.onboarding.updateCapabilities, {
        capabilities: {
          cardIssuing: mapCapability(createdAccount.capabilities?.card_issuing),
          treasury: mapCapability(createdAccount.capabilities?.treasury),
        },
      });
    } else {
      // Check if existing account has card_issuing capability active
      const account = await stripe.accounts.retrieve(connectAccountId);
      const cardIssuingCapability = account.capabilities?.card_issuing;

      if (cardIssuingCapability !== "active") {
        // Update account with all required fields to activate capabilities
        await stripe.accounts.update(connectAccountId, {
          individual: {
            phone: personalInfo.phone,
            dob: {
              day: personalInfo.dateOfBirth.day,
              month: personalInfo.dateOfBirth.month,
              year: personalInfo.dateOfBirth.year,
            },
            id_number: personalInfo.ssn,
            address: {
              line1: personalInfo.address.line1,
              line2: personalInfo.address.line2 || undefined,
              city: personalInfo.address.city,
              state: personalInfo.address.state,
              postal_code: personalInfo.address.postalCode,
              country: "US",
            },
          },
          business_profile: {
            url: "https://gndwrk.com",
            annual_revenue: {
              amount: 0,
              currency: "usd",
              fiscal_year_end: "2025-12-31",
            },
            estimated_worker_count: 0,
          },
          settings: {
            card_issuing: {
              tos_acceptance: {
                date: tosTimestamp,
                ip: userIp,
              },
            },
            treasury: {
              tos_acceptance: {
                date: tosTimestamp,
                ip: userIp,
              },
            },
          },
        });

        // Add external account if not present
        if (!account.external_accounts?.data?.length) {
          await stripe.accounts.createExternalAccount(connectAccountId, {
            external_account: {
              object: "bank_account",
              country: "US",
              currency: "usd",
              routing_number: "110000000",
              account_number: "000123456789",
            },
          });
        }
      }
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

    // Attempt card creation if card_issuing capability is already active
    const currentAccount = await stripe.accounts.retrieve(connectAccountId);
    const cardIssuingStatus = currentAccount.capabilities?.card_issuing;

    let cardCreated = false;
    let cardId: string | undefined;
    let cardholderId: string | undefined;

    if (cardIssuingStatus === "active") {
      // Capability is active — create card immediately
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
                date: tosTimestamp,
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
        { stripeAccount: connectAccountId }
      );

      const card = await stripe.issuing.cards.create(
        {
          cardholder: cardholder.id,
          financial_account: financialAccount.id,
          currency: "usd",
          type: "virtual",
          status: "active",
          spending_controls: {
            spending_limits: [
              { amount: 50000, interval: "daily" },
              { amount: 200000, interval: "monthly" },
            ],
          },
          metadata: {
            clerkId: user.clerkId,
            convexId: user._id,
            bucketType: "spend",
          },
        },
        { stripeAccount: connectAccountId }
      );

      cardholderId = cardholder.id;
      cardId = card.id;
      cardCreated = true;

      await convex.mutation(api.onboarding.storeStripeIds, {
        stripeCardholderId: cardholder.id,
        stripeIssuingCardId: card.id,
      });
    } else {
      // Capability not yet active — card will be created via webhook
      await convex.mutation(api.onboarding.requestAutoCardCreation, {});
    }

    return NextResponse.json({
      financialAccountId: financialAccount.id,
      connectAccountId,
      cardCreated,
      cardId,
      cardholderId,
    });
  } catch (error) {
    console.error("Error creating treasury account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create treasury account" },
      { status: 500 }
    );
  }
}
