import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@gndwrk/convex/_generated/api";
import { stripe, getWebhookSecret } from "@/lib/stripe";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Common event metadata for idempotency
  const eventMeta = { eventId: event.id, eventType: event.type };

  try {
    switch (event.type) {
      // ============================================
      // Treasury events
      // ============================================
      case "treasury.financial_account.created":
        await convex.mutation(api.stripe.handleFinancialAccountCreated, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "treasury.inbound_transfer.succeeded":
        await convex.mutation(api.stripe.handleInboundTransferSucceeded, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "treasury.inbound_transfer.failed":
        await convex.mutation(api.stripe.handleInboundTransferFailed, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "treasury.outbound_transfer.created":
      case "treasury.outbound_transfer.posted":
        await convex.mutation(api.stripe.handleOutboundTransferSucceeded, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "treasury.outbound_transfer.failed":
      case "treasury.outbound_transfer.returned":
        await convex.mutation(api.stripe.handleOutboundTransferFailed, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "treasury.received_credit.created":
        await convex.mutation(api.stripe.handleReceivedCredit, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "treasury.received_debit.created":
        await convex.mutation(api.stripe.handleReceivedDebit, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      // ============================================
      // Issuing events
      // ============================================
      case "issuing_authorization.request": {
        // Real-time authorization decision - must respond within 2 seconds
        // Using Stripe's built-in spending controls is recommended for lowest latency.
        // This handler approves by default and logs for monitoring.
        // Configure spending limits via the Stripe API when creating/updating cards.
        const authorization = event.data.object as Stripe.Issuing.Authorization;

        // For now, approve all authorizations - spending controls should be set on the card
        // If custom logic is needed (parent approval, etc.), add Redis/KV caching here
        await stripe.issuing.authorizations.approve(authorization.id);

        console.log(
          "Authorization approved:",
          authorization.id,
          "Amount:",
          authorization.amount,
          "Merchant:",
          authorization.merchant_data?.name
        );
        break;
      }

      case "issuing_authorization.created":
        await convex.mutation(api.stripe.handleAuthorizationCreated, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "issuing_authorization.updated":
        await convex.mutation(api.stripe.handleAuthorizationUpdated, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "issuing_transaction.created":
        await convex.mutation(api.stripe.handleIssuingTransaction, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "issuing_card.created":
        await convex.mutation(api.stripe.handleCardCreated, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "issuing_cardholder.created":
        await convex.mutation(api.stripe.handleCardholderCreated, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      // ============================================
      // Identity events
      // ============================================
      case "identity.verification_session.verified":
        await convex.mutation(api.stripe.handleIdentityVerified, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "identity.verification_session.requires_input":
        await convex.mutation(api.stripe.handleIdentityRequiresInput, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "identity.verification_session.canceled":
        await convex.mutation(api.stripe.handleIdentityCanceled, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
