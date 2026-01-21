import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { role });
    return user._id;
  },
});

// Get all kids in a family
export const getFamilyKids = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .filter((q) => q.eq(q.field("role"), "kid"))
      .collect();

    // Get accounts and trust scores for each kid
    const kidsWithData = await Promise.all(
      users.map(async (user) => {
        const accounts = await ctx.db
          .query("accounts")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const latestTrustScore = await ctx.db
          .query("trustScores")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .first();

        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const spendAccount = accounts.find((a) => a.type === "spend");
        const saveAccount = accounts.find((a) => a.type === "save");

        return {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          trustScore: latestTrustScore?.score ?? 500,
          totalBalance: totalBalance / 100, // Convert from cents
          spendBalance: (spendAccount?.balance ?? 0) / 100,
          saveBalance: (saveAccount?.balance ?? 0) / 100,
        };
      })
    );

    return kidsWithData;
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
      choresCompleted: 0,
      savingStreak: 0,
      loansRepaid: 0,
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
