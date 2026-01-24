import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureUserAccounts } from "./ledger";
import { ensureUser } from "./users";

// Onboarding step type
const onboardingStepValidator = v.union(
  v.literal("role_select"),
  v.literal("family_create"),
  v.literal("plan_select"),
  v.literal("checkout"),
  v.literal("kyc_verify"),
  v.literal("treasury_setup"),
  v.literal("bank_link"),
  v.literal("complete")
);

// Tier type
const tierValidator = v.union(
  v.literal("starter"),
  v.literal("family"),
  v.literal("familyplus")
);

// Get current user's onboarding status
export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    // Get onboarding session
    const onboardingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Get stripe identity
    const stripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Get KYC verification
    const kycVerification = await ctx.db
      .query("kycVerifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    const currentStep = onboardingSession?.currentStep ?? "role_select";
    const isComplete = onboardingSession?.status === "completed";

    return {
      userId: user._id,
      role: user.role,
      familyId: user.familyId,
      onboardingStep: currentStep,
      isComplete,
      selectedTier: onboardingSession?.selectedTier,
      personalInfo: onboardingSession?.personalInfo,
      stripeSubscriptionId: onboardingSession?.stripeSubscriptionId,
      stripeCustomerId: stripeIdentity?.stripeCustomerId,
      stripeConnectAccountId: stripeIdentity?.stripeConnectAccountId,
      stripeIdentitySessionId: kycVerification?.stripeIdentitySessionId,
      stripeTreasuryAccountId: stripeIdentity?.stripeTreasuryAccountId,
      stripeCardholderId: stripeIdentity?.stripeCardholderId,
      stripeIssuingCardId: stripeIdentity?.stripeIssuingCardId,
      kycStatus: kycVerification?.status,
      capabilities: stripeIdentity?.capabilities,
      autoCardCreationStatus: stripeIdentity?.autoCardCreationStatus,
    };
  },
});

// Get onboarding status by user ID (for webhook/internal use without auth)
export const getStatusByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const onboardingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const stripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      personalInfo: onboardingSession?.personalInfo,
      stripeConnectAccountId: stripeIdentity?.stripeConnectAccountId,
      stripeTreasuryAccountId: stripeIdentity?.stripeTreasuryAccountId,
    };
  },
});

// Store Stripe IDs for a specific user (for webhook/internal use without auth)
export const storeStripeIdsForUser = mutation({
  args: {
    userId: v.id("users"),
    stripeCardholderId: v.optional(v.string()),
    stripeIssuingCardId: v.optional(v.string()),
    autoCardCreationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    )),
  },
  handler: async (ctx, { userId, ...args }) => {
    const stripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!stripeIdentity) throw new Error("Stripe identity not found for user");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.stripeCardholderId) updates.stripeCardholderId = args.stripeCardholderId;
    if (args.stripeIssuingCardId) updates.stripeIssuingCardId = args.stripeIssuingCardId;
    if (args.autoCardCreationStatus) updates.autoCardCreationStatus = args.autoCardCreationStatus;

    await ctx.db.patch(stripeIdentity._id, updates);
    return userId;
  },
});

// Update onboarding step
export const updateStep = mutation({
  args: {
    step: onboardingStepValidator,
  },
  handler: async (ctx, { step }) => {
    const user = await ensureUser(ctx);

    const now = Date.now();

    // Find existing session or create one
    const existingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingSession) {
      const updates: Record<string, unknown> = {
        currentStep: step,
        updatedAt: now,
      };

      if (step === "complete") {
        updates.status = "completed";
        updates.completedAt = now;
      }

      await ctx.db.patch(existingSession._id, updates);
    } else {
      await ctx.db.insert("onboardingSessions", {
        userId: user._id,
        currentStep: step,
        status: step === "complete" ? "completed" : "in_progress",
        startedAt: now,
        completedAt: step === "complete" ? now : undefined,
        updatedAt: now,
      });
    }

    return user._id;
  },
});

// Select a subscription tier during onboarding
export const selectPlan = mutation({
  args: {
    tier: tierValidator,
  },
  handler: async (ctx, { tier }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Find existing session or create one
    const existingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const nextStep = tier === "starter" ? "kyc_verify" : "checkout";

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        selectedTier: tier,
        currentStep: nextStep,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("onboardingSessions", {
        userId: user._id,
        currentStep: nextStep,
        selectedTier: tier,
        status: "in_progress",
        startedAt: now,
        updatedAt: now,
      });
    }

    return user._id;
  },
});

// Store subscription ID after checkout and advance to KYC
export const storeCheckoutSubscription = mutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { stripeSubscriptionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    const existingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        stripeSubscriptionId,
        currentStep: "kyc_verify",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("onboardingSessions", {
        userId: user._id,
        currentStep: "kyc_verify",
        stripeSubscriptionId,
        status: "in_progress",
        startedAt: now,
        updatedAt: now,
      });
    }

    return user._id;
  },
});

// Store linked bank account from Financial Connections
export const storeBankLink = mutation({
  args: {
    stripeFinancialConnectionsAccountId: v.string(),
    institutionName: v.string(),
    accountLast4: v.string(),
    accountType: v.optional(v.union(
      v.literal("checking"),
      v.literal("savings"),
      v.literal("other")
    )),
    stripeBankAccountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");
    if (!user.familyId) throw new Error("User must have a family");

    const now = Date.now();

    // Check if this FC account already exists
    const existing = await ctx.db
      .query("linkedBankAccounts")
      .withIndex("by_fc_account", (q) =>
        q.eq("stripeFinancialConnectionsAccountId", args.stripeFinancialConnectionsAccountId)
      )
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        institutionName: args.institutionName,
        accountLast4: args.accountLast4,
        accountType: args.accountType,
        stripeBankAccountId: args.stripeBankAccountId,
        status: "active",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("linkedBankAccounts", {
        userId: user._id,
        familyId: user.familyId,
        stripeFinancialConnectionsAccountId: args.stripeFinancialConnectionsAccountId,
        institutionName: args.institutionName,
        accountLast4: args.accountLast4,
        accountType: args.accountType,
        stripeBankAccountId: args.stripeBankAccountId,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    return user._id;
  },
});

// Store personal info for Connect account verification
export const storePersonalInfo = mutation({
  args: {
    dateOfBirth: v.object({
      day: v.number(),
      month: v.number(),
      year: v.number(),
    }),
    ssn: v.string(),
    phone: v.string(),
    address: v.object({
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Find existing session
    const existingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        personalInfo: {
          dateOfBirth: args.dateOfBirth,
          ssn: args.ssn,
          phone: args.phone,
          address: args.address,
        },
        currentStep: "treasury_setup",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("onboardingSessions", {
        userId: user._id,
        currentStep: "treasury_setup",
        personalInfo: {
          dateOfBirth: args.dateOfBirth,
          ssn: args.ssn,
          phone: args.phone,
          address: args.address,
        },
        status: "in_progress",
        startedAt: now,
        updatedAt: now,
      });
    }

    return user._id;
  },
});

// Store Stripe IDs after API calls
export const storeStripeIds = mutation({
  args: {
    stripeCustomerId: v.optional(v.string()),
    stripeConnectAccountId: v.optional(v.string()),
    stripeIdentitySessionId: v.optional(v.string()),
    stripeTreasuryAccountId: v.optional(v.string()),
    stripeCardholderId: v.optional(v.string()),
    stripeIssuingCardId: v.optional(v.string()),
    kycStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("verified"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    // Update stripeIdentities table
    const existingStripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const stripeUpdates: Record<string, unknown> = {};
    if (args.stripeCustomerId) stripeUpdates.stripeCustomerId = args.stripeCustomerId;
    if (args.stripeConnectAccountId) stripeUpdates.stripeConnectAccountId = args.stripeConnectAccountId;
    if (args.stripeTreasuryAccountId) stripeUpdates.stripeTreasuryAccountId = args.stripeTreasuryAccountId;
    if (args.stripeCardholderId) stripeUpdates.stripeCardholderId = args.stripeCardholderId;
    if (args.stripeIssuingCardId) stripeUpdates.stripeIssuingCardId = args.stripeIssuingCardId;

    if (Object.keys(stripeUpdates).length > 0) {
      if (existingStripeIdentity) {
        await ctx.db.patch(existingStripeIdentity._id, {
          ...stripeUpdates,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("stripeIdentities", {
          userId: user._id,
          ...stripeUpdates,
          createdAt: now,
          updatedAt: now,
        } as any);
      }
    }

    // Update kycVerifications table if identity session provided
    if (args.stripeIdentitySessionId) {
      const existingKyc = await ctx.db
        .query("kycVerifications")
        .withIndex("by_session", (q) =>
          q.eq("stripeIdentitySessionId", args.stripeIdentitySessionId!)
        )
        .unique();

      if (existingKyc) {
        if (args.kycStatus) {
          await ctx.db.patch(existingKyc._id, {
            status: args.kycStatus,
            updatedAt: now,
          });
        }
      } else {
        await ctx.db.insert("kycVerifications", {
          userId: user._id,
          stripeIdentitySessionId: args.stripeIdentitySessionId,
          status: args.kycStatus ?? "pending",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return user._id;
  },
});

// Update capability status on stripeIdentities
export const updateCapabilities = mutation({
  args: {
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
  },
  handler: async (ctx, { capabilities }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const stripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!stripeIdentity) throw new Error("Stripe identity not found");

    await ctx.db.patch(stripeIdentity._id, {
      capabilities,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Request auto card creation when user leaves card page while capability is pending
export const requestAutoCardCreation = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const stripeIdentity = await ctx.db
      .query("stripeIdentities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!stripeIdentity) throw new Error("Stripe identity not found");

    await ctx.db.patch(stripeIdentity._id, {
      autoCardCreationStatus: "pending",
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Complete onboarding - creates accounts for parent
export const complete = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");
    if (!user.familyId) throw new Error("User must have a family");

    const now = Date.now();

    // Get onboarding session to check selected tier
    const onboardingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const selectedTier = onboardingSession?.selectedTier ?? "family";

    // Create ledger accounts based on selected tier
    // Starter: only 2 buckets (spend, save)
    // Family/Family+: all 4 buckets
    const bucketTypes = selectedTier === "starter"
      ? (["spend", "save"] as const)
      : (["spend", "save", "give", "invest"] as const);

    await ensureUserAccounts(ctx, user._id, user.familyId, [...bucketTypes]);

    // Mark onboarding as complete
    if (onboardingSession) {
      await ctx.db.patch(onboardingSession._id, {
        currentStep: "complete",
        status: "completed",
        completedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("onboardingSessions", {
        userId: user._id,
        currentStep: "complete",
        status: "completed",
        startedAt: now,
        completedAt: now,
        updatedAt: now,
      });
    }

    // Also create familyMember record if it doesn't exist
    const existingMember = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!existingMember) {
      // Check if user is family owner
      const family = await ctx.db.get(user.familyId);
      const isOwner = family?.ownerId === user._id;

      await ctx.db.insert("familyMembers", {
        familyId: user.familyId,
        userId: user._id,
        role: isOwner ? "owner" : user.role === "parent" ? "parent" : "kid",
        status: "active",
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return user._id;
  },
});
