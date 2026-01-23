import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/pricing";
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

    const [user, onboardingStatus] = await Promise.all([
      convex.query(api.users.getCurrentUser),
      convex.query(api.onboarding.getStatus),
    ]);

    if (!user || !onboardingStatus) {
      return NextResponse.json({ error: "User or onboarding session not found" }, { status: 404 });
    }

    const tier = onboardingStatus.selectedTier;
    if (!tier || tier === "starter") {
      return NextResponse.json({ error: "Checkout not required for starter plan" }, { status: 400 });
    }

    const plan = PLANS[tier];
    if (!plan.priceLookupKey) {
      return NextResponse.json({ error: "No price configured for this plan" }, { status: 400 });
    }

    // If subscription already exists on session, retrieve it for idempotency
    if (onboardingStatus.stripeSubscriptionId) {
      const existingSub = await stripe.subscriptions.retrieve(
        onboardingStatus.stripeSubscriptionId,
        { expand: ["pending_setup_intent"] }
      );

      if (existingSub.status === "trialing" || existingSub.status === "active") {
        return NextResponse.json({ alreadyConfirmed: true });
      }

      // Return existing setup intent for incomplete subscription
      const setupIntent = existingSub.pending_setup_intent as { client_secret: string } | null;
      if (setupIntent?.client_secret) {
        return NextResponse.json({
          subscriptionId: existingSub.id,
          clientSecret: setupIntent.client_secret,
        });
      }
    }

    // Get or create Stripe Customer
    let customerId = onboardingStatus.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: `${user.firstName} ${user.lastName ?? ""}`.trim(),
        email: user.email,
        metadata: { clerkId: userId, convexId: onboardingStatus.userId },
      });
      customerId = customer.id;
      await convex.mutation(api.onboarding.storeStripeIds, {
        stripeCustomerId: customerId,
      });
    }

    // Resolve price by lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [plan.priceLookupKey],
      active: true,
      limit: 1,
    });

    if (!prices.data.length) {
      return NextResponse.json(
        { error: `Price not found for lookup key: ${plan.priceLookupKey}` },
        { status: 500 }
      );
    }

    const priceId = prices.data[0].id;

    // Create subscription with 14-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 14,
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["pending_setup_intent"],
      metadata: {
        clerkId: userId,
        convexId: onboardingStatus.userId,
        tier,
      },
    });

    const setupIntent = subscription.pending_setup_intent as { client_secret: string } | null;
    if (!setupIntent?.client_secret) {
      return NextResponse.json(
        { error: "Failed to create setup intent for subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating checkout subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create subscription" },
      { status: 500 }
    );
  }
}
