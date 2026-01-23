import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { allocateDeposit } from "./allocation";

// Get recent transactions for current user (from journalEntries)
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

    // Get user's ledger account IDs
    const userAccounts = await ctx.db
      .query("ledgerAccounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("category"), "user_bucket"))
      .collect();

    const accountIds = new Set(userAccounts.map((a) => a._id.toString()));

    // Get entries where user's accounts are involved (debit or credit)
    // Query by createdBy for user-initiated transactions
    const byUser = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("createdBy", user._id))
      .order("desc")
      .take(limit);

    // Also get entries targeting user's accounts (incoming deposits, payouts, etc.)
    const debitEntries = await Promise.all(
      userAccounts.map((acc) =>
        ctx.db
          .query("journalEntries")
          .withIndex("by_debit_account", (q) => q.eq("debitAccountId", acc._id))
          .order("desc")
          .take(limit)
      )
    );

    const creditEntries = await Promise.all(
      userAccounts.map((acc) =>
        ctx.db
          .query("journalEntries")
          .withIndex("by_credit_account", (q) => q.eq("creditAccountId", acc._id))
          .order("desc")
          .take(limit)
      )
    );

    // Merge, deduplicate, sort, and limit
    const allEntries = [...byUser, ...debitEntries.flat(), ...creditEntries.flat()];
    const seen = new Set<string>();
    const unique = allEntries.filter((e) => {
      if (seen.has(e._id.toString())) return false;
      seen.add(e._id.toString());
      return true;
    });

    unique.sort((a, b) => b.createdAt - a.createdAt);
    const limited = unique.slice(0, limit);

    return limited.map((entry) => {
      // Determine if this is a credit or debit from user's perspective
      const isDebit = accountIds.has(entry.creditAccountId.toString());

      return {
        id: entry._id,
        description: entry.description,
        amount: entry.amount / 100,
        type: (isDebit ? "debit" : "credit") as "debit" | "credit",
        category: entry.category,
        date: entry.createdAt,
        status: "completed" as const,
      };
    });
  },
});

// Get transactions by ledger account
export const getByAccount = query({
  args: {
    accountId: v.id("ledgerAccounts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, limit = 50 }) => {
    // Get entries where this account is debited
    const debitEntries = await ctx.db
      .query("journalEntries")
      .withIndex("by_debit_account", (q) => q.eq("debitAccountId", accountId))
      .order("desc")
      .take(limit);

    // Get entries where this account is credited
    const creditEntries = await ctx.db
      .query("journalEntries")
      .withIndex("by_credit_account", (q) => q.eq("creditAccountId", accountId))
      .order("desc")
      .take(limit);

    // Merge and sort
    const all = [...debitEntries, ...creditEntries];
    all.sort((a, b) => b.createdAt - a.createdAt);
    const limited = all.slice(0, limit);

    return limited.map((entry) => {
      const isCredit = entry.debitAccountId.toString() === accountId.toString();

      return {
        id: entry._id,
        description: entry.description,
        amount: entry.amount / 100,
        type: isCredit ? ("credit" as const) : ("debit" as const),
        category: entry.category,
        date: entry.createdAt,
        status: "completed" as const,
      };
    });
  },
});

// Get transactions for a family
export const getByFamily = query({
  args: {
    familyId: v.id("families"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { familyId, limit = 100 }) => {
    // Get all family member accounts
    const familyAccounts = await ctx.db
      .query("ledgerAccounts")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .filter((q) => q.eq(q.field("category"), "user_bucket"))
      .collect();

    // Get entries for each account
    const allEntries = [];
    for (const acc of familyAccounts) {
      const debits = await ctx.db
        .query("journalEntries")
        .withIndex("by_debit_account", (q) => q.eq("debitAccountId", acc._id))
        .order("desc")
        .take(limit);
      const credits = await ctx.db
        .query("journalEntries")
        .withIndex("by_credit_account", (q) => q.eq("creditAccountId", acc._id))
        .order("desc")
        .take(limit);
      allEntries.push(...debits, ...credits);
    }

    // Deduplicate, sort, limit
    const seen = new Set<string>();
    const unique = allEntries.filter((e) => {
      if (seen.has(e._id.toString())) return false;
      seen.add(e._id.toString());
      return true;
    });
    unique.sort((a, b) => b.createdAt - a.createdAt);
    const limited = unique.slice(0, limit);

    // Get user names
    const accountMap = new Map(familyAccounts.map((a) => [a._id.toString(), a]));
    const userIds = [...new Set(familyAccounts.map((a) => a.userId).filter(Boolean))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id!)));
    const userMap = new Map(users.map((u) => [u?._id.toString(), u]));

    return limited.map((entry) => {
      // Find which user this entry relates to
      const debitAccount = accountMap.get(entry.debitAccountId.toString());
      const creditAccount = accountMap.get(entry.creditAccountId.toString());
      const relatedAccount = debitAccount || creditAccount;
      const user = relatedAccount?.userId
        ? userMap.get(relatedAccount.userId.toString())
        : null;

      const isDebit = !!creditAccount && !debitAccount;

      return {
        id: entry._id,
        description: entry.description,
        amount: entry.amount / 100,
        type: isDebit ? ("debit" as const) : ("credit" as const),
        category: entry.category,
        userName: user?.firstName ?? "Unknown",
        date: entry.createdAt,
        status: "completed" as const,
      };
    });
  },
});

// Create a deposit - allocates across buckets per family settings
export const createDeposit = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(), // In dollars
    description: v.string(),
  },
  handler: async (ctx, { userId, amount, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const targetUser = await ctx.db.get(userId);
    if (!targetUser || targetUser.familyId !== user.familyId) {
      throw new Error("User not found in your family");
    }

    if (!targetUser.familyId) {
      throw new Error("Target user has no family");
    }

    const amountCents = Math.round(amount * 100);

    await allocateDeposit(ctx, {
      userId,
      familyId: targetUser.familyId,
      totalAmount: amountCents,
      sourceType: "parent_deposit",
      description,
      createdBy: user._id,
    });

    return { success: true };
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
    // Get user's accounts
    const userAccounts = await ctx.db
      .query("ledgerAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("category"), "user_bucket"))
      .collect();

    // Get credit entries (money leaving user's accounts = spending)
    const spendingEntries = [];
    for (const acc of userAccounts) {
      const entries = await ctx.db
        .query("journalEntries")
        .withIndex("by_credit_account", (q) => q.eq("creditAccountId", acc._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("createdAt"), startDate),
            q.lte(q.field("createdAt"), endDate)
          )
        )
        .collect();
      // Exclude internal transfers (both accounts belong to user)
      const accountIds = new Set(userAccounts.map((a) => a._id.toString()));
      const externalSpending = entries.filter(
        (e) => !accountIds.has(e.debitAccountId.toString())
      );
      spendingEntries.push(...externalSpending);
    }

    // Group by category
    const byCategory = spendingEntries.reduce(
      (acc, entry) => {
        const cat = entry.category;
        acc[cat] = (acc[cat] || 0) + entry.amount;
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
