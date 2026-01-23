import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current user's savings goals
export const getMySavingsGoals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Convert amounts from cents to dollars
    return goals.map((goal) => ({
      ...goal,
      targetAmount: goal.targetAmount / 100,
      currentAmount: goal.currentAmount / 100,
    }));
  },
});

// Create a savings goal
export const create = mutation({
  args: {
    accountId: v.id("ledgerAccounts"),
    name: v.string(),
    targetAmount: v.number(),
    deadline: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify account belongs to user
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found");
    }

    const goalId = await ctx.db.insert("savingsGoals", {
      userId: user._id,
      ledgerAccountId: args.accountId,
      name: args.name,
      targetAmount: Math.round(args.targetAmount * 100), // Store in cents
      currentAmount: 0,
      deadline: args.deadline,
      imageUrl: args.imageUrl,
      status: "active",
      createdAt: Date.now(),
    });

    return goalId;
  },
});

// Update goal progress
export const updateProgress = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    amount: v.number(),
  },
  handler: async (ctx, { goalId, amount }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }

    const newAmount = Math.round(amount * 100); // Convert to cents
    const isCompleted = newAmount >= goal.targetAmount;

    await ctx.db.patch(goalId, {
      currentAmount: newAmount,
      status: isCompleted ? "completed" : "active",
      completedAt: isCompleted ? Date.now() : undefined,
    });

    return { completed: isCompleted };
  },
});

// Cancel a savings goal
export const cancel = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, { goalId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found");
    }

    await ctx.db.patch(goalId, {
      status: "cancelled",
    });
  },
});
