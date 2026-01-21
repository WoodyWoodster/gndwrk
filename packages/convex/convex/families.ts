import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate random 6-character code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Get current user's family
export const getMyFamily = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user?.familyId) return null;

    return await ctx.db.get(user.familyId);
  },
});

// Get family by ID
export const getById = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    return await ctx.db.get(familyId);
  },
});

// Create a new family
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.familyId) throw new Error("User already has a family");

    // Generate unique code
    let code = generateCode();
    let existing = await ctx.db
      .query("families")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    while (existing) {
      code = generateCode();
      existing = await ctx.db
        .query("families")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    }

    // Create family
    const familyId = await ctx.db.insert("families", {
      name,
      code,
      ownerId: user._id,
      createdAt: Date.now(),
      defaultAllocation: {
        spend: 50,
        save: 30,
        give: 10,
        invest: 10,
      },
    });

    // Update user with family ID
    await ctx.db.patch(user._id, { familyId });

    return familyId;
  },
});

// Join a family with code
export const join = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.familyId) throw new Error("User already has a family");

    const family = await ctx.db
      .query("families")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();

    if (!family) throw new Error("Invalid family code");

    // Update user with family ID
    await ctx.db.patch(user._id, { familyId: family._id });

    // Create the 4 bucket accounts for the new member
    const bucketTypes = ["spend", "save", "give", "invest"] as const;
    for (const type of bucketTypes) {
      await ctx.db.insert("accounts", {
        userId: user._id,
        familyId: family._id,
        type,
        balance: 0,
      });
    }

    // Create initial trust score
    await ctx.db.insert("trustScores", {
      userId: user._id,
      score: 500, // Starting score
      factors: {
        loanRepayment: 50,
        savingsConsistency: 50,
        choreCompletion: 50,
        budgetAdherence: 50,
        givingBehavior: 50,
        accountAge: 0,
        parentEndorsements: 50,
      },
      calculatedAt: Date.now(),
    });

    return family._id;
  },
});

// Get family invite code
export const getInviteCode = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.db.get(familyId);
    if (!family) throw new Error("Family not found");

    // Only owner can see the code
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || family.ownerId !== user._id) {
      throw new Error("Not authorized");
    }

    return family.code;
  },
});

// Update family settings
export const updateSettings = mutation({
  args: {
    familyId: v.id("families"),
    name: v.optional(v.string()),
    defaultAllocation: v.optional(
      v.object({
        spend: v.number(),
        save: v.number(),
        give: v.number(),
        invest: v.number(),
      })
    ),
  },
  handler: async (ctx, { familyId, ...updates }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.db.get(familyId);
    if (!family) throw new Error("Family not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || family.ownerId !== user._id) {
      throw new Error("Not authorized");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(familyId, filteredUpdates);
    return familyId;
  },
});
