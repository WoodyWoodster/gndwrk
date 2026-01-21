import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

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

const issuingCardholderData = v.object({
  id: v.string(),
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  metadata: v.optional(v.any()),
  status: v.optional(v.string()),
});

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

// Helper to check and record processed events (idempotency)
async function checkAndRecordEvent(
  ctx: any,
  eventId: string,
  eventType: string
): Promise<boolean> {
  // Check if already processed
  const existing = await ctx.db
    .query("processedStripeEvents")
    .withIndex("by_event_id", (q: any) => q.eq("eventId", eventId))
    .unique();

  if (existing) {
    console.log(`Event ${eventId} already processed, skipping`);
    return false; // Already processed
  }

  // Record the event
  await ctx.db.insert("processedStripeEvents", {
    eventId,
    eventType,
    processedAt: Date.now(),
  });

  return true; // OK to process
}

// Check spending limit for authorization
export const checkSpendingLimit = query({
  args: {
    cardId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { cardId, amount }) => {
    // Find account by card ID
    const account = await ctx.db
      .query("accounts")
      .filter((q) => q.eq(q.field("stripeIssuingCardId"), cardId))
      .unique();

    if (!account) return false;

    // Check balance
    if (account.balance < amount) return false;

    // Check daily limit
    if (account.dailySpendLimit) {
      const dailySpent = account.dailySpent ?? 0;
      if (dailySpent + amount > account.dailySpendLimit) return false;
    }

    // Check weekly limit
    if (account.weeklySpendLimit) {
      const weeklySpent = account.weeklySpent ?? 0;
      if (weeklySpent + amount > account.weeklySpendLimit) return false;
    }

    // Check monthly limit
    if (account.monthlySpendLimit) {
      const monthlySpent = account.monthlySpent ?? 0;
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    // Find account to link
    // This would be called after we create the account and request Treasury
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_treasury", (q) =>
        q.eq("stripeTreasuryAccountId", data.financial_account)
      )
      .unique();

    if (!account) {
      console.log("Account not found for treasury:", data.financial_account);
      return;
    }

    // Stripe amounts are in cents, our DB stores cents - no conversion needed
    const amount = data.amount;

    // Update balance
    await ctx.db.patch(account._id, {
      balance: account.balance + amount,
    });

    // Create transaction record
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
      createdAt: Date.now(),
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_treasury", (q) =>
        q.eq("stripeTreasuryAccountId", data.financial_account)
      )
      .unique();

    if (!account) return;

    // Transaction should already exist from when we initiated the transfer
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_stripe_transaction", (q) =>
        q.eq("stripeTransactionId", data.id)
      )
      .unique();

    if (transaction) {
      await ctx.db.patch(transaction._id, { status: "completed" });
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_treasury", (q) =>
        q.eq("stripeTreasuryAccountId", data.financial_account)
      )
      .unique();

    if (!account) return;

    // Find and mark transaction as failed
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_stripe_transaction", (q) =>
        q.eq("stripeTransactionId", data.id)
      )
      .unique();

    if (transaction) {
      await ctx.db.patch(transaction._id, { status: "failed" });

      // Refund the amount back to balance (it was deducted when initiated)
      await ctx.db.patch(account._id, {
        balance: account.balance + Math.abs(transaction.amount),
      });
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    // Find any pending transaction for this transfer
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_stripe_transaction", (q) =>
        q.eq("stripeTransactionId", data.id)
      )
      .unique();

    if (transaction) {
      await ctx.db.patch(transaction._id, { status: "failed" });
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_treasury", (q) =>
        q.eq("stripeTreasuryAccountId", data.financial_account)
      )
      .unique();

    if (!account) return;

    // Stripe amounts are in cents, our DB stores cents - no conversion needed
    const amount = data.amount;

    await ctx.db.patch(account._id, {
      balance: account.balance + amount,
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
      createdAt: Date.now(),
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_stripe_treasury", (q) =>
        q.eq("stripeTreasuryAccountId", data.financial_account)
      )
      .unique();

    if (!account) return;

    // Stripe amounts are in cents, our DB stores cents - no conversion needed
    const amount = data.amount;

    await ctx.db.patch(account._id, {
      balance: account.balance - amount,
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
      createdAt: Date.now(),
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    // Find account by card ID
    const account = await ctx.db
      .query("accounts")
      .filter((q) => q.eq(q.field("stripeIssuingCardId"), data.card.id))
      .unique();

    if (!account) return;

    // Track pending authorization (amount is in cents)
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
    // Idempotency check
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const account = await ctx.db
      .query("accounts")
      .filter((q) => q.eq(q.field("stripeIssuingCardId"), data.card.id))
      .unique();

    if (!account) return;

    // Issuing amounts can be negative (refunds), use absolute value for debits
    // Amounts are in cents - no conversion needed
    const amount = Math.abs(data.amount);
    const isRefund = data.amount > 0 || data.type === "refund";

    if (isRefund) {
      // Handle refund - add back to balance
      await ctx.db.patch(account._id, {
        balance: account.balance + amount,
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
        createdAt: Date.now(),
      });
    } else {
      // Handle purchase - deduct from balance
      await ctx.db.patch(account._id, {
        balance: account.balance - amount,
        dailySpent: (account.dailySpent ?? 0) + amount,
        weeklySpent: (account.weeklySpent ?? 0) + amount,
        monthlySpent: (account.monthlySpent ?? 0) + amount,
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
        createdAt: Date.now(),
      });

      // Check if over budget
      if (account.monthlySpendLimit) {
        const newSpent = (account.monthlySpent ?? 0) + amount;
        if (newSpent > account.monthlySpendLimit) {
          await ctx.db.insert("trustScoreEvents", {
            userId: account.userId,
            familyId: account.familyId,
            event: "Exceeded monthly spending limit",
            eventType: "overspent_budget",
            points: -5,
            createdAt: Date.now(),
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    // Link card to account based on metadata
    const userId = data.metadata?.userId;
    if (!userId) return;

    const spendAccount = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", userId as any).eq("type", "spend")
      )
      .unique();

    if (spendAccount) {
      await ctx.db.patch(spendAccount._id, {
        stripeIssuingCardId: data.id,
      });
    }
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userId = data.metadata?.userId;
    if (!userId) return;

    const user = await ctx.db.get(userId as any);
    if (user) {
      await ctx.db.patch(user._id, {
        kycStatus: "verified",
      });
    }
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userId = data.metadata?.userId;
    if (!userId) return;

    const user = await ctx.db.get(userId as any);
    if (user) {
      await ctx.db.patch(user._id, {
        kycStatus: "pending",
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
    // Idempotency check
    if (eventId && eventType) {
      const shouldProcess = await checkAndRecordEvent(ctx, eventId, eventType);
      if (!shouldProcess) return;
    }

    const userId = data.metadata?.userId;
    if (!userId) return;

    const user = await ctx.db.get(userId as any);
    if (user) {
      // Keep as pending so they can retry
      await ctx.db.patch(user._id, {
        kycStatus: "pending",
      });
    }

    console.log(
      "Identity verification canceled:",
      data.id,
      data.last_error?.reason
    );
  },
});
