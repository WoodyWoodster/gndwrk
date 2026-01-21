import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - all users (parents, kids, young adults)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("parent"), v.literal("kid"))),
    familyId: v.optional(v.id("families")),
    dateOfBirth: v.optional(v.number()), // timestamp
    stripeCustomerId: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    kycStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("verified"),
        v.literal("failed")
      )
    ),
    // Stats for profile
    choresCompleted: v.optional(v.number()),
    savingStreak: v.optional(v.number()),
    loansRepaid: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_family", ["familyId"]),

  // Families table - family unit
  families: defineTable({
    name: v.string(),
    code: v.string(), // 6-character invite code
    ownerId: v.id("users"), // Parent who created the family
    createdAt: v.number(),
    // Settings
    defaultAllocation: v.optional(
      v.object({
        spend: v.number(),
        save: v.number(),
        give: v.number(),
        invest: v.number(),
      })
    ),
  })
    .index("by_code", ["code"])
    .index("by_owner", ["ownerId"]),

  // Accounts - 4 buckets per user (Treasury financial accounts)
  accounts: defineTable({
    userId: v.id("users"),
    familyId: v.id("families"),
    type: v.union(
      v.literal("spend"),
      v.literal("save"),
      v.literal("give"),
      v.literal("invest")
    ),
    balance: v.number(), // Cents
    goal: v.optional(v.number()), // Savings goal amount
    goalName: v.optional(v.string()),
    stripeTreasuryAccountId: v.optional(v.string()),
    stripeIssuingCardId: v.optional(v.string()), // Only for spend bucket
    // Limits
    dailySpendLimit: v.optional(v.number()),
    weeklySpendLimit: v.optional(v.number()),
    monthlySpendLimit: v.optional(v.number()),
    // Tracking
    dailySpent: v.optional(v.number()),
    weeklySpent: v.optional(v.number()),
    monthlySpent: v.optional(v.number()),
    lastResetDate: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_family", ["familyId"])
    .index("by_stripe_treasury", ["stripeTreasuryAccountId"]),

  // Transactions - all money movements
  transactions: defineTable({
    userId: v.id("users"),
    accountId: v.id("accounts"),
    familyId: v.id("families"),
    amount: v.number(), // Cents, positive for credits, negative for debits
    type: v.union(v.literal("credit"), v.literal("debit")),
    category: v.string(),
    description: v.string(),
    merchantName: v.optional(v.string()),
    merchantCategory: v.optional(v.string()),
    // References
    choreId: v.optional(v.id("chores")),
    loanId: v.optional(v.id("loans")),
    transferToAccountId: v.optional(v.id("accounts")),
    // Stripe
    stripeTransactionId: v.optional(v.string()),
    stripeAuthorizationId: v.optional(v.string()),
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("reversed")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_family", ["familyId"])
    .index("by_created", ["createdAt"])
    .index("by_stripe_transaction", ["stripeTransactionId"]),

  // Chores - marketplace listings
  chores: defineTable({
    familyId: v.id("families"),
    createdBy: v.id("users"), // Parent
    title: v.string(),
    description: v.string(),
    payout: v.number(), // Cents
    frequency: v.union(
      v.literal("once"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    assignedTo: v.optional(v.id("users")), // Kid who claimed
    status: v.union(
      v.literal("open"),
      v.literal("claimed"),
      v.literal("pending_approval"),
      v.literal("completed"),
      v.literal("paid")
    ),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    proofPhotoUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_family_status", ["familyId", "status"])
    .index("by_assigned", ["assignedTo"])
    .index("by_created_by", ["createdBy"]),

  // Loans - parent-to-kid loans
  loans: defineTable({
    familyId: v.id("families"),
    lenderId: v.id("users"), // Parent
    borrowerId: v.id("users"), // Kid
    principal: v.number(), // Original amount in cents
    interestRate: v.number(), // Annual percentage (0-10%)
    termWeeks: v.number(),
    weeklyPayment: v.number(), // Calculated payment amount
    purpose: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("paid"),
      v.literal("defaulted")
    ),
    remainingBalance: v.number(),
    totalInterestPaid: v.optional(v.number()),
    nextPaymentDate: v.optional(v.number()),
    gracePeriodDays: v.optional(v.number()),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
    paidOffAt: v.optional(v.number()),
  })
    .index("by_family", ["familyId"])
    .index("by_borrower", ["borrowerId"])
    .index("by_lender", ["lenderId"])
    .index("by_status", ["status"]),

  // Loan payments
  loanPayments: defineTable({
    loanId: v.id("loans"),
    userId: v.id("users"),
    amount: v.number(),
    principal: v.number(),
    interest: v.number(),
    dueDate: v.number(),
    paidDate: v.optional(v.number()),
    onTime: v.optional(v.boolean()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("paid"),
      v.literal("late"),
      v.literal("missed")
    ),
  })
    .index("by_loan", ["loanId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Trust Score events
  trustScoreEvents: defineTable({
    userId: v.id("users"),
    familyId: v.id("families"),
    event: v.string(), // Human readable
    eventType: v.union(
      v.literal("loan_payment_on_time"),
      v.literal("loan_payment_late"),
      v.literal("loan_paid_early"),
      v.literal("loan_defaulted"),
      v.literal("chore_completed"),
      v.literal("savings_goal_reached"),
      v.literal("savings_streak"),
      v.literal("overspent_budget"),
      v.literal("giving_donation"),
      v.literal("parent_endorsement"),
      v.literal("account_age")
    ),
    points: v.number(), // Can be negative
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_family", ["familyId"])
    .index("by_created", ["createdAt"]),

  // Trust Scores - calculated snapshots
  trustScores: defineTable({
    userId: v.id("users"),
    score: v.number(), // 300-850
    factors: v.object({
      loanRepayment: v.number(), // 0-100
      savingsConsistency: v.number(),
      choreCompletion: v.number(),
      budgetAdherence: v.number(),
      givingBehavior: v.number(),
      accountAge: v.number(),
      parentEndorsements: v.number(),
    }),
    calculatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_calculated", ["calculatedAt"]),

  // AI Conversations
  aiConversations: defineTable({
    userId: v.id("users"),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    context: v.optional(
      v.object({
        trustScore: v.optional(v.number()),
        recentTransactions: v.optional(v.array(v.any())),
        savingsGoals: v.optional(v.array(v.any())),
        age: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_updated", ["updatedAt"]),

  // Savings Goals
  savingsGoals: defineTable({
    userId: v.id("users"),
    accountId: v.id("accounts"),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_status", ["status"]),

  // Processed Stripe Events - for webhook idempotency
  processedStripeEvents: defineTable({
    eventId: v.string(), // Stripe event ID (e.g., "evt_...")
    eventType: v.string(), // e.g., "treasury.inbound_transfer.succeeded"
    processedAt: v.number(), // Timestamp when processed
  }).index("by_event_id", ["eventId"]),
});
