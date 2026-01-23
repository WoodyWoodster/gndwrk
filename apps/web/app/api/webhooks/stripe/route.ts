import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@gndwrk/convex/_generated/api";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { resend } from "@/lib/resend";
import CardReadyEmail from "@/emails/card-ready";

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
      // Account capability events
      // ============================================
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const connectAccountId = account.id;

        // Map Stripe capability statuses to our enum
        const mapCapability = (status: string | undefined) => {
          if (status === "active") return "active" as const;
          if (status === "pending") return "pending" as const;
          if (status === "restricted") return "restricted" as const;
          return "inactive" as const;
        };

        const result = await convex.mutation(api.stripe.handleAccountUpdated, {
          connectAccountId,
          capabilities: {
            cardIssuing: mapCapability(account.capabilities?.card_issuing),
            treasury: mapCapability(account.capabilities?.treasury),
          },
          ...eventMeta,
        });

        // Auto-create card if capability just activated and user is waiting
        if (result?.shouldAutoCreateCard && result.connectAccountId && result.treasuryAccountId) {
          try {
            // Get user data for cardholder billing info
            const user = await convex.query(api.users.getById, { userId: result.userId });
            if (user) {
              // Get onboarding session for personal info
              const stripeIdentity = await convex.query(api.onboarding.getStatusByUserId, { userId: result.userId });
              const personalInfo = stripeIdentity?.personalInfo;

              if (personalInfo) {
                // Create cardholder
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
                          date: Math.floor(Date.now() / 1000),
                          ip: "0.0.0.0", // Webhook context, no user IP
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
                      convexId: result.userId,
                    },
                  },
                  { stripeAccount: result.connectAccountId }
                );

                // Create card
                const card = await stripe.issuing.cards.create(
                  {
                    cardholder: cardholder.id,
                    financial_account: result.treasuryAccountId,
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
                      userId: result.userId,
                      bucketType: "spend",
                    },
                  },
                  { stripeAccount: result.connectAccountId }
                );

                // Store IDs in Convex via internal mutation
                await convex.mutation(api.onboarding.storeStripeIdsForUser, {
                  userId: result.userId,
                  stripeCardholderId: cardholder.id,
                  stripeIssuingCardId: card.id,
                  autoCardCreationStatus: "completed",
                });

                console.log("Auto-created card:", card.id, "for user:", result.userId);

                // Send card-ready email notification
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gndwrk.com";
                try {
                  await resend.emails.send({
                    from: "Gndwrk <noreply@gndwrk.com>",
                    to: user.email,
                    subject: "Your Gndwrk debit card is ready!",
                    react: CardReadyEmail({
                      firstName: user.firstName,
                      dashboardUrl: `${appUrl}/dashboard`,
                    }),
                  });
                  console.log("Card-ready email sent to:", user.email);
                } catch (emailErr) {
                  // Email failure is non-critical
                  console.error("Failed to send card-ready email:", emailErr);
                }
              }
            }
          } catch (cardError) {
            console.error("Auto-card creation failed:", cardError);
            // Mark as failed
            await convex.mutation(api.onboarding.storeStripeIdsForUser, {
              userId: result.userId,
              autoCardCreationStatus: "failed",
            });
          }
        }
        break;
      }

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

      // ============================================
      // Subscription events
      // ============================================
      case "customer.subscription.created":
        await convex.mutation(api.stripe.handleSubscriptionCreated, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "customer.subscription.updated":
        await convex.mutation(api.stripe.handleSubscriptionUpdated, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "customer.subscription.deleted":
        await convex.mutation(api.stripe.handleSubscriptionDeleted, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "invoice.payment_succeeded":
        await convex.mutation(api.stripe.handleInvoicePaymentSucceeded, {
          data: event.data.object as any,
          ...eventMeta,
        });
        break;

      case "invoice.payment_failed":
        await convex.mutation(api.stripe.handleInvoicePaymentFailed, {
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
