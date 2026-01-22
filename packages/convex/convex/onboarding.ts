import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Onboarding step type
const onboardingStepValidator = v.union(
  v.literal("role_select"),
  v.literal("family_create"),
  v.literal("kyc_verify"),
  v.literal("treasury_setup"),
  v.literal("card_setup"),
  v.literal("complete")
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
      stripeCustomerId: stripeIdentity?.stripeCustomerId,
      stripeConnectAccountId: stripeIdentity?.stripeConnectAccountId,
      stripeIdentitySessionId: kycVerification?.stripeIdentitySessionId,
      stripeTreasuryAccountId: stripeIdentity?.stripeTreasuryAccountId,
      stripeCardholderId: stripeIdentity?.stripeCardholderId,
      kycStatus: kycVerification?.status,
    };
  },
});

// Update onboarding step
export const updateStep = mutation({
  args: {
    step: onboardingStepValidator,
  },
  handler: async (ctx, { step }) => {
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

    // Check if accounts already exist
    const existingAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Create 4 bucket accounts for parent if they don't exist
    if (existingAccounts.length === 0) {
      const bucketTypes = ["spend", "save", "give", "invest"] as const;
      for (const type of bucketTypes) {
        await ctx.db.insert("accounts", {
          userId: user._id,
          familyId: user.familyId,
          type,
          balance: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Mark onboarding as complete
    const existingSession = await ctx.db
      .query("onboardingSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
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
