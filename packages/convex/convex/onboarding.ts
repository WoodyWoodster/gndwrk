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

    return {
      userId: user._id,
      role: user.role,
      familyId: user.familyId,
      onboardingStep: user.onboardingStep ?? "role_select",
      isComplete: user.onboardingStep === "complete",
      stripeCustomerId: user.stripeCustomerId,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeIdentitySessionId: user.stripeIdentitySessionId,
      stripeTreasuryAccountId: user.stripeTreasuryAccountId,
      stripeCardholderId: user.stripeCardholderId,
      kycStatus: user.kycStatus,
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

    const updates: Record<string, unknown> = {
      onboardingStep: step,
    };

    if (step === "complete") {
      updates.onboardingCompletedAt = Date.now();
    }

    await ctx.db.patch(user._id, updates);
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

    const updates = Object.fromEntries(
      Object.entries(args).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(user._id, updates);
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
        });
      }
    }

    // Mark onboarding as complete
    await ctx.db.patch(user._id, {
      onboardingStep: "complete",
      onboardingCompletedAt: Date.now(),
    });

    return user._id;
  },
});
