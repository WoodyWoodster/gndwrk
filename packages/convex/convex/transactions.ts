import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get recent transactions for current user
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return transactions.map((tx) => ({
      id: tx._id,
      description: tx.description,
      amount: Math.abs(tx.amount) / 100,
      type: tx.type,
      category: tx.category,
      date: tx.createdAt,
      status: tx.status,
    }));
  },
});

// Get transactions by account
export const getByAccount = query({
  args: {
    accountId: v.id("accounts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, limit = 50 }) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .order("desc")
      .take(limit);

    return transactions.map((tx) => ({
      id: tx._id,
      description: tx.description,
      amount: Math.abs(tx.amount) / 100,
      type: tx.type,
      category: tx.category,
      merchantName: tx.merchantName,
      date: tx.createdAt,
      status: tx.status,
    }));
  },
});

// Get transactions for a family
export const getByFamily = query({
  args: {
    familyId: v.id("families"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { familyId, limit = 100 }) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .order("desc")
      .take(limit);

    // Get user names for each transaction
    const userIds = [...new Set(transactions.map((tx) => tx.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(users.map((u) => [u?._id, u]));

    return transactions.map((tx) => {
      const user = userMap.get(tx.userId);
      return {
        id: tx._id,
        description: tx.description,
        amount: Math.abs(tx.amount) / 100,
        type: tx.type,
        category: tx.category,
        userName: user?.firstName ?? "Unknown",
        date: tx.createdAt,
        status: tx.status,
      };
    });
  },
});

// Create a manual transaction (for parents to add money)
export const createDeposit = mutation({
  args: {
    accountId: v.id("accounts"),
    amount: v.number(), // In dollars
    description: v.string(),
  },
  handler: async (ctx, { accountId, amount, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const account = await ctx.db.get(accountId);
    if (!account || account.familyId !== user.familyId) {
      throw new Error("Account not found");
    }

    const amountCents = Math.round(amount * 100);

    // Update account balance
    await ctx.db.patch(accountId, {
      balance: account.balance + amountCents,
    });

    // Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      userId: account.userId,
      accountId,
      familyId: account.familyId,
      amount: amountCents,
      type: "credit",
      category: "Deposit",
      description,
      status: "completed",
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

// Get spending summary for a user
export const getSpendingSummary = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, { userId, startDate, endDate }) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate),
          q.eq(q.field("type"), "debit")
        )
      )
      .collect();

    // Group by category
    const byCategory = transactions.reduce(
      (acc, tx) => {
        const cat = tx.category;
        acc[cat] = (acc[cat] || 0) + Math.abs(tx.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    const total = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);

    return {
      total: total / 100,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({
        category,
        amount: amount / 100,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      })),
    };
  },
});
