import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - all users (parents, kids, young adults)
  // Note: Stripe data moved to stripeIdentities, subscriptions moved to subscriptions table,
  // KYC moved to kycVerifications, onboarding moved to onboardingSessions,
  // stats computed from source tables via userStats queries,
  // kid management moved to kidProfiles
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("parent"), v.literal("kid"))),
    familyId: v.optional(v.id("families")),
    dateOfBirth: v.optional(v.number()), // timestamp
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
    updatedAt: v.number(),
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

  // Ledger Accounts - double-entry bookkeeping accounts
  // Replaces old "accounts" table. Each user has 4 bucket accounts (spend, save, give, invest)
  // plus system accounts for Stripe, chore pool, loan pool, etc.
  ledgerAccounts: defineTable({
    code: v.string(), // "USR_{userId}_spend" or "SYS_STRIPE_TREASURY"
    name: v.string(),
    accountType: v.union(
      v.literal("asset"),
      v.literal("liability"),
      v.literal("equity"),
      v.literal("expense")
    ),
    category: v.union(
      v.literal("user_bucket"),
      v.literal("system_external"),
      v.literal("system_internal"),
      v.literal("system_suspense")
    ),
    userId: v.optional(v.id("users")),
    familyId: v.optional(v.id("families")),
    bucketType: v.optional(
      v.union(
        v.literal("spend"),
        v.literal("save"),
        v.literal("give"),
        v.literal("invest")
      )
    ),
    cachedBalance: v.number(), // Cents
    // Spending limits
    dailySpendLimit: v.optional(v.number()),
    weeklySpendLimit: v.optional(v.number()),
    monthlySpendLimit: v.optional(v.number()),
    lastReconciled: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_user", ["userId"])
    .index("by_user_bucket", ["userId", "bucketType"])
    .index("by_category", ["category"])
    .index("by_family", ["familyId"]),

  // Journal Entries - double-entry transaction records
  // Replaces old "transactions" table. Each entry has a debit and credit account.
  journalEntries: defineTable({
    entryId: v.string(), // UUID
    sequenceNumber: v.number(), // Monotonically increasing
    debitAccountId: v.id("ledgerAccounts"),
    creditAccountId: v.id("ledgerAccounts"),
    amount: v.number(), // Always positive, cents
    description: v.string(),
    category: v.string(), // "deposit", "transfer", "chore_payout", "card_purchase", etc.
    sourceType: v.string(), // "parent_deposit", "stripe_inbound", "chore_approval", etc.
    sourceId: v.optional(v.string()),
    groupId: v.string(), // Links entries in one logical operation
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    // Reversal tracking
    isReversal: v.optional(v.boolean()),
    reversesEntryId: v.optional(v.string()),
    reversedByEntryId: v.optional(v.string()),
    // Stripe linkage
    stripeTransactionId: v.optional(v.string()),
    stripeAuthorizationId: v.optional(v.string()),
    // Original source refs
    choreId: v.optional(v.id("chores")),
    loanId: v.optional(v.id("loans")),
  })
    .index("by_entry_id", ["entryId"])
    .index("by_group_id", ["groupId"])
    .index("by_debit_account", ["debitAccountId", "createdAt"])
    .index("by_credit_account", ["creditAccountId", "createdAt"])
    .index("by_sequence", ["sequenceNumber"])
    .index("by_source", ["sourceType", "sourceId"])
    .index("by_user", ["createdBy", "createdAt"])
    .index("by_stripe_transaction", ["stripeTransactionId"]),

  // Reconciliation Runs - audit trail for balance verification
  reconciliationRuns: defineTable({
    type: v.union(
      v.literal("internal"),
      v.literal("stripe"),
      v.literal("full")
    ),
    status: v.union(
      v.literal("running"),
      v.literal("passed"),
      v.literal("discrepancy_found"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    accountsChecked: v.optional(v.number()),
    discrepancies: v.optional(
      v.array(
        v.object({
          ledgerAccountId: v.id("ledgerAccounts"),
          cachedBalance: v.number(),
          computedBalance: v.number(),
          stripeBalance: v.optional(v.number()),
          difference: v.number(),
          autoResolved: v.boolean(),
        })
      )
    ),
  })
    .index("by_status", ["status"])
    .index("by_started", ["startedAt"]),

  // Ledger Sequence - monotonically increasing counter for journal entries
  ledgerSequence: defineTable({
    currentSequence: v.number(),
  }),

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
    updatedAt: v.optional(v.number()),
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
    updatedAt: v.optional(v.number()),
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
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
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
    ledgerAccountId: v.id("ledgerAccounts"),
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
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_ledger_account", ["ledgerAccountId"])
    .index("by_status", ["status"]),

  // Processed Stripe Events - for webhook idempotency
  processedStripeEvents: defineTable({
    eventId: v.string(), // Stripe event ID (e.g., "evt_...")
    eventType: v.string(), // e.g., "treasury.inbound_transfer.succeeded"
    processedAt: v.number(), // Timestamp when processed
  }).index("by_event_id", ["eventId"]),

  // ============================================
  // NEW NORMALIZED TABLES
  // ============================================

  // Stripe data consolidated in one place - single source of truth for all Stripe IDs per user
  stripeIdentities: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    stripeTreasuryAccountId: v.optional(v.string()),
    stripeCardholderId: v.optional(v.string()),
    stripeIssuingCardId: v.optional(v.string()),
    capabilities: v.optional(v.object({
      cardIssuing: v.optional(v.union(
        v.literal("inactive"), v.literal("pending"),
        v.literal("active"), v.literal("restricted")
      )),
      treasury: v.optional(v.union(
        v.literal("inactive"), v.literal("pending"),
        v.literal("active"), v.literal("restricted")
      )),
    })),
    autoCardCreationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    )),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_customer_id", ["stripeCustomerId"])
    .index("by_connect_account", ["stripeConnectAccountId"])
    .index("by_treasury_account", ["stripeTreasuryAccountId"]),

  // Subscriptions separate from user identity
  subscriptions: defineTable({
    userId: v.id("users"),
    familyId: v.id("families"),
    stripeSubscriptionId: v.string(),
    tier: v.union(
      v.literal("starter"),
      v.literal("family"),
      v.literal("familyplus")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
      v.literal("incomplete")
    ),
    trialEndsAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_family", ["familyId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  // KYC verification tracking
  kycVerifications: defineTable({
    userId: v.id("users"),
    stripeIdentitySessionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("verified"),
      v.literal("failed")
    ),
    failureReason: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["stripeIdentitySessionId"]),

  // Onboarding as a process, not user state
  onboardingSessions: defineTable({
    userId: v.id("users"),
    currentStep: v.union(
      v.literal("role_select"),
      v.literal("family_create"),
      v.literal("plan_select"),
      v.literal("kyc_verify"),
      v.literal("treasury_setup"),
      v.literal("complete")
    ),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
    // Selected tier for the family subscription
    selectedTier: v.optional(v.union(
      v.literal("starter"),
      v.literal("family"),
      v.literal("familyplus")
    )),
    // Personal info for Connect account (collected during KYC)
    personalInfo: v.optional(v.object({
      dateOfBirth: v.object({
        day: v.number(),
        month: v.number(),
        year: v.number(),
      }),
      ssn: v.string(), // Full SSN - handle securely
      phone: v.optional(v.string()), // US phone number
      address: v.object({
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
      }),
    })),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Explicit family membership junction table
  familyMembers: defineTable({
    familyId: v.id("families"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("parent"), v.literal("kid")),
    status: v.union(
      v.literal("active"),
      v.literal("invited"),
      v.literal("removed")
    ),
    joinedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_user", ["userId"])
    .index("by_family_role", ["familyId", "role"]),

  // Parent-kid relationships with permissions
  guardianships: defineTable({
    familyId: v.id("families"),
    parentId: v.id("users"),
    kidId: v.id("users"),
    canApproveLoans: v.boolean(),
    canApproveChores: v.boolean(),
    canSetSpendingLimits: v.boolean(),
    status: v.union(v.literal("active"), v.literal("revoked")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_kid", ["kidId"]),

  // Kid-specific profile data
  kidProfiles: defineTable({
    userId: v.id("users"),
    createdByParentId: v.optional(v.id("users")),
    isManagedAccount: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_parent", ["createdByParentId"]),

  // Savings goal progress tracking
  savingsGoalContributions: defineTable({
    goalId: v.id("savingsGoals"),
    userId: v.id("users"),
    journalEntryId: v.optional(v.id("journalEntries")),
    amount: v.number(),
    previousAmount: v.number(),
    newAmount: v.number(),
    createdAt: v.number(),
  }).index("by_goal", ["goalId"]),

  // ============================================
  // GAMIFICATION TABLES
  // ============================================

  // Tutorial completion tracking
  tutorialProgress: defineTable({
    userId: v.id("users"),
    tutorialType: v.union(v.literal("kid_onboarding"), v.literal("parent_onboarding")),
    completedAt: v.optional(v.number()),
    skippedAt: v.optional(v.number()),
    currentStep: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "tutorialType"]),

  // Achievement definitions and unlocks
  achievements: defineTable({
    userId: v.id("users"),
    achievementId: v.string(), // e.g., "first_save", "week_warrior", "chore_champion"
    unlockedAt: v.number(),
    metadata: v.optional(v.any()), // Additional context like amount saved, streak count
  })
    .index("by_user", ["userId"])
    .index("by_user_achievement", ["userId", "achievementId"]),

  // Streak tracking
  streaks: defineTable({
    userId: v.id("users"),
    streakType: v.union(
      v.literal("daily_login"),
      v.literal("savings_streak"),
      v.literal("chore_streak")
    ),
    currentCount: v.number(),
    longestCount: v.number(),
    lastActivityAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "streakType"]),
});
