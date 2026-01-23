import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Amount handling note:
 * Both Stripe and our database use cents (smallest currency unit).
 * No conversion is needed - amounts are stored as-is from Stripe.
 */

// Type-safe validators for Stripe webhook data
const treasuryTransferData = v.object({
  id: v.string(),
  financial_account: v.string(),
  amount: v.number(),
  status: v.optional(v.string()),
  description: v.optional(v.string()),
  network: v.optional(v.string()),
  failure_details: v.optional(
    v.object({
      code: v.optional(v.string()),
      message: v.optional(v.string()),
    })
  ),
});

const issuingAuthorizationData = v.object({
  id: v.string(),
  amount: v.number(),
  card: v.object({
    id: v.string(),
  }),
  merchant_data: v.optional(
    v.object({
      name: v.optional(v.string()),
      category: v.optional(v.string()),
      city: v.optional(v.string()),
    })
  ),
  status: v.optional(v.string()),
});

const issuingTransactionData = v.object({
  id: v.string(),
  amount: v.number(),
  card: v.object({
    id: v.string(),
  }),
  authorization: v.optional(v.string()),
  merchant_data: v.optional(
    v.object({
      name: v.optional(v.string()),
      category: v.optional(v.string()),
    })
  ),
  type: v.optional(v.string()),
});

const issuingCardData = v.object({
  id: v.string(),
  cardholder: v.optional(v.string()),
  metadata: v.optional(v.any()),
  status: v.optional(v.string()),
});

// Use v.any() since Stripe sends many fields (billing, individual, etc.)
// and we only need a few of them
const issuingCardholderData = v.any();

const identityVerificationData = v.object({
  id: v.string(),
  status: v.optional(v.string()),
  metadata: v.optional(v.any()),
  last_error: v.optional(
    v.object({
      code: v.optional(v.string()),
      reason: v.optional(v.string()),
    })
  ),
});

// Subscription webhook data validators
const subscriptionData = v.object({
  id: v.string(),
  customer: v.string(),
  status: v.string(),
  current_period_end: v.optional(v.number()),
  trial_end: v.optional(v.union(v.number(), v.null())),
  items: v.optional(
    v.object({
      data: v.array(
        v.object({
          price: v.object({
            lookup_key: v.optional(v.union(v.string(), v.null())),
          }),
        })
      ),
    })
  ),
  metadata: v.optional(v.any()),
});

const invoiceData = v.object({
  id: v.string(),
  customer: v.string(),
  subscription: v.optional(v.union(v.string(), v.null())),
  status: v.optional(v.string()),
  amount_paid: v.optional(v.number()),
  amount_due: v.optional(v.number()),
});

// Helper to check and record processed events (idempotency)
async function checkAndRecordEvent(
  ctx: any,
  eventId: string,
  eventType: string
): Promise<boolean> {
  const existing = await ctx.db
    .query("processedStripeEvents")
    .withIndex("by_event_id", (q: any) => q.eq("eventId", eventId))
    .unique();

  if (existing) {
    console.log(`Event ${eventId} already processed, skipping`);
    return false;
  }

  await ctx.db.insert("processedStripeEvents", {
    eventId,
    eventType,
    processedAt: Date.now(),
  });

  return true;
}

// Helper to find user by stripe customer ID via stripeIdentities table
async function findUserByStripeCustomerId(ctx: any, customerId: string) {
  const stripeIdentity = await ctx.db
    .query("stripeIdentities")
    .withIndex("by_customer_id", (q: any) => q.eq("stripeCustomerId", customerId))
    .unique();

  if (!stripeIdentity) return null;
  return await ctx.db.get(stripeIdentity.userId);
}

// Helper to find stripeIdentity by card ID
async function findStripeIdentityByCardId(ctx: any, cardId: string) {
  const stripeIdentities = await ctx.db.query("stripeIdentities").collect();
  return stripeIdentities.find((si: any) => si.stripeIssuingCardId === cardId);
}

// Helper to find stripeIdentity by Connect account ID
async function findStripeIdentityByConnectAccount(ctx: any, connectAccountId: string) {
  return await ctx.db
    .query("stripeIdentities")
    .withIndex("by_connect_account", (q: any) =>
      q.eq("stripeConnectAccountId", connectAccountId)
    )
    .unique();
}

// Helper to find stripeIdentity by treasury account ID
async function findStripeIdentityByTreasuryAccount(ctx: any, treasuryAccountId: string) {
  const stripeIdentity = await ctx.db
    .query("stripeIdentities")
    .withIndex("by_treasury_account", (q: any) =>
      q.eq("stripeTreasuryAccountId", treasuryAccountId)
    )
    .unique();

  return stripeIdentity;
}

// Check spending limit for authorization
export const checkSpendingLimit = query({
  args: {
    cardId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { cardId, amount }) => {
    // Find user's stripeIdentity by card ID
    const stripeIdentity = await findStripeIdentityByCardId(ctx, cardId);
    if (!stripeIdentity) return false;

    // Find spend account for this user
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", stripeIdentity.userId).eq("type", "spend")
      )
      .unique();

    if (!account) return false;

    // Check balance
    if (account.balance < amount) return false;

    // Calculate time boundaries
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get debit transactions for spending calculations
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", account._id))
      .filter((q) => q.eq(q.field("type"), "debit"))
      .collect();

    // Calculate spending for each period
    let dailySpent = 0;
    let weeklySpent = 0;
    let monthlySpent = 0;

    for (const t of transactions) {
      const txAmount = Math.abs(t.amount);
      if (t.createdAt >= startOfDay.getTime()) dailySpent += txAmount;
      if (t.createdAt >= startOfWeek.getTime()) weeklySpent += txAmount;
      if (t.createdAt >= startOfMonth.getTime()) monthlySpent += txAmount;
    }

    // Check daily limit
    if (account.dailySpendLimit) {
      if (dailySpent + amount > account.dailySpendLimit) return false;
    }

    // Check weekly limit
    if (account.weeklySpendLimit) {
      if (weeklySpent + amount > account.weeklySpendLimit) return false;
    }

    // Check monthly limit
    if (account.monthlySpendLimit) {
      if (monthlySpent + amount > account.monthlySpendLimit) return false;
    }

    return true;
  },
});

// Handle Treasury financial account created
export const handleFinancialAccountCreated = mutation({
  args: {
    data: v.any(),
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    console.log("Treasury financial account created:", data.id);
  },
});

// Handle inbound transfer (deposit)
export const handleInboundTransferSucceeded = mutation({
  args: {
    data: treasuryTransferData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    // Find stripeIdentity by treasury account
    const stripeIdentity = await findStripeIdentityByTreasuryAccount(ctx, data.financial_account);
    if (!stripeIdentity) {
      console.log("StripeIdentity not found for treasury:", data.financial_account);
      return;
    }

    // Find user's spend account (deposits go to spend by default)
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", stripeIdentity.userId).eq("type", "spend")
      )
      .unique();

    if (!account) {
      console.log("Spend account not found for user:", stripeIdentity.userId);
      return;
    }

    const amount = data.amount;
    const now = Date.now();

    await ctx.db.patch(account._id, {
      balance: account.balance + amount,
      updatedAt: now,
    });

    await ctx.db.insert("transactions", {
      userId: account.userId,
      accountId: account._id,
      familyId: account.familyId,
      amount: amount,
      type: "credit",
      category: "Deposit",
      description: data.description || "Inbound transfer",
      stripeTransactionId: data.id,
      status: "completed",
      createdAt: now,
    });
  },
});

// Handle outbound transfer succeeded
export const handleOutboundTransferSucceeded = mutation({
  args: {
    data: treasuryTransferData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_stripe_transaction", (q) =>
        q.eq("stripeTransactionId", data.id)
      )
      .unique();

    if (transaction) {
      await ctx.db.patch(transaction._id, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }
  },
});

// Handle outbound transfer failed
export const handleOutboundTransferFailed = mutation({
  args: {
    data: treasuryTransferData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_stripe_transaction", (q) =>
        q.eq("stripeTransactionId", data.id)
      )
      .unique();

    if (transaction) {
      await ctx.db.patch(transaction._id, {
        status: "failed",
        updatedAt: Date.now(),
      });

      // Refund amount back to account
      const account = await ctx.db.get(transaction.accountId);
      if (account) {
        await ctx.db.patch(account._id, {
          balance: account.balance + Math.abs(transaction.amount),
          updatedAt: Date.now(),
        });
      }
    }

    console.log(
      "Outbound transfer failed:",
      data.id,
      data.failure_details?.code,
      data.failure_details?.message
    );
  },
});

// Handle inbound transfer failed
export const handleInboundTransferFailed = mutation({
  args: {
    data: treasuryTransferData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_stripe_transaction", (q) =>
        q.eq("stripeTransactionId", data.id)
      )
      .unique();

    if (transaction) {
      await ctx.db.patch(transaction._id, {
        status: "failed",
        updatedAt: Date.now(),
      });
    }

    console.log(
      "Inbound transfer failed:",
      data.id,
      data.failure_details?.code,
      data.failure_details?.message
    );
  },
});

// Handle received credit (incoming funds)
export const handleReceivedCredit = mutation({
  args: {
    data: treasuryTransferData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const stripeIdentity = await findStripeIdentityByTreasuryAccount(ctx, data.financial_account);
    if (!stripeIdentity) return;

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", stripeIdentity.userId).eq("type", "spend")
      )
      .unique();

    if (!account) return;

    const amount = data.amount;
    const now = Date.now();

    await ctx.db.patch(account._id, {
      balance: account.balance + amount,
      updatedAt: now,
    });

    await ctx.db.insert("transactions", {
      userId: account.userId,
      accountId: account._id,
      familyId: account.familyId,
      amount: amount,
      type: "credit",
      category: data.network === "ach" ? "ACH Transfer" : "Received Credit",
      description: data.description || "Received credit",
      stripeTransactionId: data.id,
      status: "completed",
      createdAt: now,
    });
  },
});

// Handle received debit (outgoing funds)
export const handleReceivedDebit = mutation({
  args: {
    data: treasuryTransferData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const stripeIdentity = await findStripeIdentityByTreasuryAccount(ctx, data.financial_account);
    if (!stripeIdentity) return;

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", stripeIdentity.userId).eq("type", "spend")
      )
      .unique();

    if (!account) return;

    const amount = data.amount;
    const now = Date.now();

    await ctx.db.patch(account._id, {
      balance: account.balance - amount,
      updatedAt: now,
    });

    await ctx.db.insert("transactions", {
      userId: account.userId,
      accountId: account._id,
      familyId: account.familyId,
      amount: -amount,
      type: "debit",
      category: "Debit",
      description: data.description || "Debit",
      stripeTransactionId: data.id,
      status: "completed",
      createdAt: now,
    });
  },
});

// Handle Issuing authorization created
export const handleAuthorizationCreated = mutation({
  args: {
    data: issuingAuthorizationData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    console.log(
      "Authorization created:",
      data.id,
      "Amount:",
      data.amount,
      "cents"
    );
  },
});

// Handle Issuing authorization updated (partial captures, reversals, etc.)
export const handleAuthorizationUpdated = mutation({
  args: {
    data: issuingAuthorizationData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    console.log(
      "Authorization updated:",
      data.id,
      "Status:",
      data.status,
      "Amount:",
      data.amount
    );
  },
});

// Handle Issuing transaction (actual charge)
export const handleIssuingTransaction = mutation({
  args: {
    data: issuingTransactionData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    // Find stripeIdentity by card ID
    const stripeIdentity = await findStripeIdentityByCardId(ctx, data.card.id);
    if (!stripeIdentity) return;

    // Find spend account
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", stripeIdentity.userId).eq("type", "spend")
      )
      .unique();

    if (!account) return;

    const amount = Math.abs(data.amount);
    const isRefund = data.amount > 0 || data.type === "refund";
    const now = Date.now();

    if (isRefund) {
      await ctx.db.patch(account._id, {
        balance: account.balance + amount,
        updatedAt: now,
      });

      await ctx.db.insert("transactions", {
        userId: account.userId,
        accountId: account._id,
        familyId: account.familyId,
        amount: amount,
        type: "credit",
        category: "Refund",
        description: `Refund from ${data.merchant_data?.name || "merchant"}`,
        merchantName: data.merchant_data?.name,
        merchantCategory: data.merchant_data?.category,
        stripeTransactionId: data.id,
        stripeAuthorizationId: data.authorization,
        status: "completed",
        createdAt: now,
      });
    } else {
      await ctx.db.patch(account._id, {
        balance: account.balance - amount,
        updatedAt: now,
      });

      await ctx.db.insert("transactions", {
        userId: account.userId,
        accountId: account._id,
        familyId: account.familyId,
        amount: -amount,
        type: "debit",
        category: data.merchant_data?.category || "Purchase",
        description: data.merchant_data?.name || "Card purchase",
        merchantName: data.merchant_data?.name,
        merchantCategory: data.merchant_data?.category,
        stripeTransactionId: data.id,
        stripeAuthorizationId: data.authorization,
        status: "completed",
        createdAt: now,
      });

      // Check if over budget - emit trust score event
      if (account.monthlySpendLimit) {
        // Compute monthly spent from transactions instead of using legacy field
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyTransactions = await ctx.db
          .query("transactions")
          .withIndex("by_account", (q) => q.eq("accountId", account._id))
          .filter((q) =>
            q.and(
              q.gte(q.field("createdAt"), startOfMonth.getTime()),
              q.eq(q.field("type"), "debit")
            )
          )
          .collect();

        const monthlySpent = monthlyTransactions.reduce(
          (sum, t) => sum + Math.abs(t.amount),
          0
        );

        if (monthlySpent > account.monthlySpendLimit) {
          await ctx.db.insert("trustScoreEvents", {
            userId: account.userId,
            familyId: account.familyId,
            event: "Exceeded monthly spending limit",
            eventType: "overspent_budget",
            points: -5,
            createdAt: now,
          });
        }
      }
    }
  },
});

// Handle card created
export const handleCardCreated = mutation({
  args: {
    data: issuingCardData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userIdStr = data.metadata?.userId as string | undefined;
    if (!userIdStr) return;

    const userId = userIdStr as Id<"users">;

    // Verify user exists
    const user = await ctx.db.get(userId);
    if (!user) return;

    const now = Date.now();

    // Update stripeIdentities table
    const stripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (stripeIdentity) {
      await ctx.db.patch(stripeIdentity._id, {
        stripeIssuingCardId: data.id,
        updatedAt: now,
      });
    } else {
      // Create stripeIdentity if it doesn't exist
      await ctx.db.insert("stripeIdentities", {
        userId,
        stripeIssuingCardId: data.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log("Card created:", data.id, "for user:", userIdStr);
  },
});

// Handle cardholder created
export const handleCardholderCreated = mutation({
  args: {
    data: issuingCardholderData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userIdStr = data.metadata?.userId as string | undefined;
    if (!userIdStr) return;

    const userId = userIdStr as Id<"users">;

    // Verify user exists
    const user = await ctx.db.get(userId);
    if (!user) return;

    const now = Date.now();

    // Update stripeIdentities table
    const stripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (stripeIdentity) {
      await ctx.db.patch(stripeIdentity._id, {
        stripeCardholderId: data.id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("stripeIdentities", {
        userId,
        stripeCardholderId: data.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(
      "Cardholder created:",
      data.id,
      "Name:",
      data.name,
      "Status:",
      data.status
    );
  },
});

// Handle identity verification completed
export const handleIdentityVerified = mutation({
  args: {
    data: identityVerificationData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userIdStr = data.metadata?.userId as string | undefined;
    if (!userIdStr) return;

    const userId = userIdStr as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) return;

    const now = Date.now();

    // Update or create kycVerifications record
    const existingKyc = await ctx.db
      .query("kycVerifications")
      .withIndex("by_session", (q) => q.eq("stripeIdentitySessionId", data.id))
      .unique();

    if (existingKyc) {
      await ctx.db.patch(existingKyc._id, {
        status: "verified",
        verifiedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("kycVerifications", {
        userId,
        stripeIdentitySessionId: data.id,
        status: "verified",
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log("Identity verified for user:", userIdStr);
  },
});

// Handle identity verification requires input
export const handleIdentityRequiresInput = mutation({
  args: {
    data: identityVerificationData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userIdStr = data.metadata?.userId as string | undefined;
    if (!userIdStr) return;

    const userId = userIdStr as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) return;

    const now = Date.now();

    const existingKyc = await ctx.db
      .query("kycVerifications")
      .withIndex("by_session", (q) => q.eq("stripeIdentitySessionId", data.id))
      .unique();

    if (existingKyc) {
      await ctx.db.patch(existingKyc._id, {
        status: "processing",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("kycVerifications", {
        userId,
        stripeIdentitySessionId: data.id,
        status: "processing",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Handle identity verification canceled
export const handleIdentityCanceled = mutation({
  args: {
    data: identityVerificationData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userIdStr = data.metadata?.userId as string | undefined;
    if (!userIdStr) return;

    const userId = userIdStr as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) return;

    const now = Date.now();

    const existingKyc = await ctx.db
      .query("kycVerifications")
      .withIndex("by_session", (q) => q.eq("stripeIdentitySessionId", data.id))
      .unique();

    if (existingKyc) {
      await ctx.db.patch(existingKyc._id, {
        status: "failed",
        failureReason: data.last_error?.reason,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("kycVerifications", {
        userId,
        stripeIdentitySessionId: data.id,
        status: "failed",
        failureReason: data.last_error?.reason,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(
      "Identity verification canceled:",
      data.id,
      data.last_error?.reason
    );
  },
});

// ============================================
// Subscription events
// ============================================

// Helper to map price lookup key to subscription tier
function lookupKeyToTier(
  lookupKey: string | null | undefined
): "starter" | "family" | "familyplus" {
  switch (lookupKey) {
    case "family_monthly":
      return "family";
    case "familyplus_monthly":
      return "familyplus";
    default:
      return "starter";
  }
}

// Helper to map Stripe subscription status to our status
function mapSubscriptionStatus(
  stripeStatus: string
): "active" | "past_due" | "canceled" | "trialing" | "incomplete" {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "trialing":
      return "trialing";
    case "incomplete":
    case "incomplete_expired":
    default:
      return "incomplete";
  }
}

// Handle subscription created
export const handleSubscriptionCreated = mutation({
  args: {
    data: subscriptionData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    // Find user by Stripe customer ID
    const user = await findUserByStripeCustomerId(ctx, data.customer);
    if (!user) {
      console.log("User not found for customer:", data.customer);
      return;
    }

    if (!user.familyId) {
      console.log("User has no family, cannot create subscription:", user._id);
      return;
    }

    const lookupKey = data.items?.data[0]?.price?.lookup_key;
    const tier = lookupKeyToTier(lookupKey);
    const status = mapSubscriptionStatus(data.status);
    const now = Date.now();

    // Check if subscription already exists
    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", data.id)
      )
      .unique();

    if (!existingSub) {
      await ctx.db.insert("subscriptions", {
        userId: user._id,
        familyId: user.familyId,
        stripeSubscriptionId: data.id,
        tier,
        status,
        trialEndsAt: data.trial_end ? data.trial_end * 1000 : undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(
      "Subscription created:",
      data.id,
      "Tier:",
      tier,
      "Status:",
      status
    );
  },
});

// Handle subscription updated
export const handleSubscriptionUpdated = mutation({
  args: {
    data: subscriptionData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const lookupKey = data.items?.data[0]?.price?.lookup_key;
    const tier = lookupKeyToTier(lookupKey);
    const status = mapSubscriptionStatus(data.status);
    const now = Date.now();

    // Find subscription by Stripe subscription ID
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", data.id)
      )
      .unique();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        tier,
        status,
        trialEndsAt: data.trial_end ? data.trial_end * 1000 : undefined,
        updatedAt: now,
      });

      console.log(
        "Subscription updated:",
        data.id,
        "Tier:",
        tier,
        "Status:",
        status
      );
      return;
    }

    // Subscription not found - try to create it
    const user = await findUserByStripeCustomerId(ctx, data.customer);
    if (!user || !user.familyId) {
      console.log("User not found or has no family for customer:", data.customer);
      return;
    }

    await ctx.db.insert("subscriptions", {
      userId: user._id,
      familyId: user.familyId,
      stripeSubscriptionId: data.id,
      tier,
      status,
      trialEndsAt: data.trial_end ? data.trial_end * 1000 : undefined,
      createdAt: now,
      updatedAt: now,
    });

    console.log(
      "Subscription created (from update event):",
      data.id,
      "Tier:",
      tier,
      "Status:",
      status
    );
  },
});

// Handle subscription deleted (canceled)
export const handleSubscriptionDeleted = mutation({
  args: {
    data: subscriptionData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", data.id)
      )
      .unique();

    if (!subscription) {
      console.log("Subscription not found:", data.id);
      return;
    }

    // Update to canceled status (or delete the record)
    await ctx.db.patch(subscription._id, {
      status: "canceled",
      tier: "starter",
      updatedAt: Date.now(),
    });

    console.log("Subscription deleted, downgraded to starter:", data.id);
  },
});

// Handle invoice payment succeeded
export const handleInvoicePaymentSucceeded = mutation({
  args: {
    data: invoiceData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    if (!data.subscription) return;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", data.subscription!)
      )
      .unique();

    if (!subscription) {
      console.log("Subscription not found:", data.subscription);
      return;
    }

    if (subscription.status !== "active") {
      await ctx.db.patch(subscription._id, {
        status: "active",
        updatedAt: Date.now(),
      });
    }

    console.log(
      "Invoice payment succeeded:",
      data.id,
      "Amount:",
      data.amount_paid
    );
  },
});

// Handle invoice payment failed
export const handleInvoicePaymentFailed = mutation({
  args: {
    data: invoiceData,
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { data, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    if (!data.subscription) return;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", data.subscription!)
      )
      .unique();

    if (!subscription) {
      console.log("Subscription not found:", data.subscription);
      return;
    }

    await ctx.db.patch(subscription._id, {
      status: "past_due",
      updatedAt: Date.now(),
    });

    console.log(
      "Invoice payment failed:",
      data.id,
      "Amount due:",
      data.amount_due
    );
  },
});

// ============================================
// Account capability events
// ============================================

// Handle account.updated - tracks capability status changes
export const handleAccountUpdated = mutation({
  args: {
    connectAccountId: v.string(),
    capabilities: v.object({
      cardIssuing: v.optional(v.union(
        v.literal("inactive"), v.literal("pending"),
        v.literal("active"), v.literal("restricted")
      )),
      treasury: v.optional(v.union(
        v.literal("inactive"), v.literal("pending"),
        v.literal("active"), v.literal("restricted")
      )),
    }),
    eventId: v.optional(v.string()),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, { connectAccountId, capabilities, eventId, eventType }) => {
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return null;
    }

    const stripeIdentity = await findStripeIdentityByConnectAccount(ctx, connectAccountId);
    if (!stripeIdentity) {
      console.log("StripeIdentity not found for connect account:", connectAccountId);
      return null;
    }

    const now = Date.now();
    const previousCapabilities = stripeIdentity.capabilities;

    await ctx.db.patch(stripeIdentity._id, {
      capabilities,
      updatedAt: now,
    });

    // Check if card_issuing just became active and user requested auto-creation
    const cardIssuingBecameActive =
      capabilities.cardIssuing === "active" &&
      previousCapabilities?.cardIssuing !== "active";

    const shouldAutoCreateCard =
      cardIssuingBecameActive &&
      stripeIdentity.autoCardCreationStatus === "pending" &&
      !stripeIdentity.stripeIssuingCardId;

    console.log(
      "Account updated:", connectAccountId,
      "card_issuing:", capabilities.cardIssuing,
      "treasury:", capabilities.treasury,
      "shouldAutoCreateCard:", shouldAutoCreateCard
    );

    if (shouldAutoCreateCard) {
      return {
        shouldAutoCreateCard: true,
        userId: stripeIdentity.userId,
        connectAccountId: stripeIdentity.stripeConnectAccountId,
        treasuryAccountId: stripeIdentity.stripeTreasuryAccountId,
      };
    }

    return null;
  },
});
