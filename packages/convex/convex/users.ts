import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { ensureUserAccounts } from "./ledger";

/**
 * Ensures a user record exists for the authenticated Clerk identity.
 * If the Clerk webhook hasn't created the user yet, creates them from the identity token.
 */
export async function ensureUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    clerkId: identity.subject,
    email: identity.email ?? "",
    firstName: identity.givenName ?? "",
    lastName: identity.familyName ?? "",
    imageUrl: identity.pictureUrl ?? undefined,
  });

  return (await ctx.db.get(userId))!;
}

// Get current user from Clerk ID
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Set user role during onboarding
export const setRole = mutation({
  args: { role: v.union(v.literal("parent"), v.literal("kid")) },
  handler: async (ctx, { role }) => {
    const user = await ensureUser(ctx);
    await ctx.db.patch(user._id, { role });
    return user._id;
  },
});

// Get all kids in a family
export const getFamilyKids = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    // Get kid members from familyMembers table
    const kidMembers = await ctx.db
      .query("familyMembers")
      .withIndex("by_family_role", (q) =>
        q.eq("familyId", familyId).eq("role", "kid")
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get user details and ledger accounts for each kid
    const kidsWithData = await Promise.all(
      kidMembers.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) return null;

        const accounts = await ctx.db
          .query("ledgerAccounts")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("category"), "user_bucket"))
          .collect();

        const latestTrustScore = await ctx.db
          .query("trustScores")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .first();

        const totalBalance = accounts.reduce((sum, acc) => sum + acc.cachedBalance, 0);
        const spendAccount = accounts.find((a) => a.bucketType === "spend");
        const saveAccount = accounts.find((a) => a.bucketType === "save");

        return {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          trustScore: latestTrustScore?.score ?? 500,
          totalBalance: totalBalance / 100,
          spendBalance: (spendAccount?.cachedBalance ?? 0) / 100,
          saveBalance: (saveAccount?.cachedBalance ?? 0) / 100,
        };
      })
    );

    return kidsWithData.filter(Boolean);
  },
});

// Create user from Clerk webhook
export const createFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
    });
  },
});

// Update user from Clerk webhook
export const updateFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ...updates }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(user._id, filteredUpdates);
    return user._id;
  },
});

// Delete user from Clerk webhook
export const deleteFromClerk = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Create a kid profile by parent (managed account)
export const createKidByParent = mutation({
  args: {
    firstName: v.string(),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
  },
  handler: async (ctx, { firstName, lastName, dateOfBirth }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const parent = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!parent) throw new Error("User not found");
    if (parent.role !== "parent") throw new Error("Only parents can create kid profiles");
    if (!parent.familyId) throw new Error("Parent must have a family");

    const now = Date.now();

    // Generate a unique managed clerk ID
    const managedClerkId = `managed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the kid user
    const kidId = await ctx.db.insert("users", {
      clerkId: managedClerkId,
      email: `${managedClerkId}@managed.gndwrk.com`,
      firstName,
      lastName: lastName ?? "",
      role: "kid",
      familyId: parent.familyId,
      dateOfBirth,
    });

    // Create kidProfile record
    await ctx.db.insert("kidProfiles", {
      userId: kidId,
      createdByParentId: parent._id,
      isManagedAccount: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create familyMember record
    await ctx.db.insert("familyMembers", {
      familyId: parent.familyId,
      userId: kidId,
      role: "kid",
      status: "active",
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create guardianship record
    await ctx.db.insert("guardianships", {
      familyId: parent.familyId,
      parentId: parent._id,
      kidId: kidId,
      canApproveLoans: true,
      canApproveChores: true,
      canSetSpendingLimits: true,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Create ledger accounts for the kid
    await ensureUserAccounts(ctx, kidId, parent.familyId, ["spend", "save", "give", "invest"]);

    // Create initial trust score
    await ctx.db.insert("trustScores", {
      userId: kidId,
      score: 500,
      factors: {
        loanRepayment: 50,
        savingsConsistency: 50,
        choreCompletion: 50,
        budgetAdherence: 50,
        givingBehavior: 50,
        accountAge: 0,
        parentEndorsements: 50,
      },
      calculatedAt: now,
    });

    return kidId;
  },
});

// ============================================
// TUTORIAL FUNCTIONS
// ============================================

// Check if user has completed the tutorial
export const hasTutorialCompleted = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return false;

    const tutorialType = user.role === "parent" ? "parent_onboarding" : "kid_onboarding";

    const progress = await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("tutorialType", tutorialType)
      )
      .unique();

    return progress?.completedAt !== undefined || progress?.skippedAt !== undefined;
  },
});

// Get tutorial progress
export const getTutorialProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const tutorialType = user.role === "parent" ? "parent_onboarding" : "kid_onboarding";

    return await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("tutorialType", tutorialType)
      )
      .unique();
  },
});

// Complete the tutorial
export const completeTutorial = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const tutorialType = user.role === "parent" ? "parent_onboarding" : "kid_onboarding";

    // Check if progress exists
    const existing = await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("tutorialType", tutorialType)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completedAt: now,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("tutorialProgress", {
        userId: user._id,
        tutorialType,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Skip the tutorial
export const skipTutorial = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const tutorialType = user.role === "parent" ? "parent_onboarding" : "kid_onboarding";

    // Check if progress exists
    const existing = await ctx.db
      .query("tutorialProgress")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("tutorialType", tutorialType)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        skippedAt: now,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("tutorialProgress", {
        userId: user._id,
        tutorialType,
        skippedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
