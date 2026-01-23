import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { createJournalEntry } from "./ledger";

// Get current user's accounts (from ledgerAccounts)
export const getMyAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const accounts = await ctx.db
      .query("ledgerAccounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("category"), "user_bucket"),
          q.neq(q.field("bucketType"), undefined)
        )
      )
      .collect();

    return accounts.map((acc) => ({
      _id: acc._id,
      _creationTime: acc._creationTime,
      userId: acc.userId,
      familyId: acc.familyId,
      type: acc.bucketType!,
      balance: acc.cachedBalance / 100,
      dailySpendLimit: acc.dailySpendLimit,
      weeklySpendLimit: acc.weeklySpendLimit,
      monthlySpendLimit: acc.monthlySpendLimit,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    }));
  },
});

// Get accounts for a specific user
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const accounts = await ctx.db
      .query("ledgerAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("category"), "user_bucket"),
          q.neq(q.field("bucketType"), undefined)
        )
      )
      .collect();

    return accounts.map((acc) => ({
      _id: acc._id,
      _creationTime: acc._creationTime,
      userId: acc.userId,
      familyId: acc.familyId,
      type: acc.bucketType!,
      balance: acc.cachedBalance / 100,
      dailySpendLimit: acc.dailySpendLimit,
      weeklySpendLimit: acc.weeklySpendLimit,
      monthlySpendLimit: acc.monthlySpendLimit,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    }));
  },
});

// Transfer between buckets via journal entry
export const transfer = mutation({
  args: {
    fromAccountId: v.id("ledgerAccounts"),
    toAccountId: v.id("ledgerAccounts"),
    amount: v.number(), // In dollars
  },
  handler: async (ctx, { fromAccountId, toAccountId, amount }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const fromAccount = await ctx.db.get(fromAccountId);
    const toAccount = await ctx.db.get(toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error("Account not found");
    }

    // Verify ownership
    if (fromAccount.userId !== user._id || toAccount.userId !== user._id) {
      throw new Error("Not authorized");
    }

    const amountCents = Math.round(amount * 100);

    const groupId = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // DR destination / CR source
    await createJournalEntry(ctx, {
      debitAccountId: toAccountId,
      creditAccountId: fromAccountId,
      amount: amountCents,
      description: `Transfer from ${fromAccount.bucketType} to ${toAccount.bucketType}`,
      category: "transfer",
      sourceType: "bucket_transfer",
      groupId,
      createdBy: user._id,
    });

    return { success: true };
  },
});

// Set savings goal
export const setGoal = mutation({
  args: {
    accountId: v.id("ledgerAccounts"),
    goal: v.number(), // In dollars
    goalName: v.string(),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, goal, goalName, deadline }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const account = await ctx.db.get(accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found or not authorized");
    }

    const now = Date.now();

    const goalId = await ctx.db.insert("savingsGoals", {
      userId: user._id,
      ledgerAccountId: accountId,
      name: goalName,
      targetAmount: Math.round(goal * 100),
      currentAmount: 0,
      deadline,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, goalId };
  },
});

// Update spending limits (parent only)
export const setSpendingLimits = mutation({
  args: {
    accountId: v.id("ledgerAccounts"),
    dailyLimit: v.optional(v.number()),
    weeklyLimit: v.optional(v.number()),
    monthlyLimit: v.optional(v.number()),
  },
  handler: async (ctx, { accountId, dailyLimit, weeklyLimit, monthlyLimit }) => {
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

    await ctx.db.patch(accountId, {
      dailySpendLimit: dailyLimit ? Math.round(dailyLimit * 100) : undefined,
      weeklySpendLimit: weeklyLimit ? Math.round(weeklyLimit * 100) : undefined,
      monthlySpendLimit: monthlyLimit ? Math.round(monthlyLimit * 100) : undefined,
    });

    return { success: true };
  },
});

// Send money to another family member via journal entry
export const sendToFamilyMember = mutation({
  args: {
    fromAccountId: v.id("ledgerAccounts"),
    toUserId: v.id("users"),
    amount: v.number(), // In dollars
    note: v.optional(v.string()),
  },
  handler: async (ctx, { fromAccountId, toUserId, amount, note }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const fromAccount = await ctx.db.get(fromAccountId);
    if (!fromAccount || fromAccount.userId !== user._id) {
      throw new Error("Account not found or not authorized");
    }

    // Verify recipient is in the same family
    const toUser = await ctx.db.get(toUserId);
    if (!toUser || toUser.familyId !== user.familyId) {
      throw new Error("Recipient not found in your family");
    }

    // Get recipient's spend account
    const toAccount = await ctx.db
      .query("ledgerAccounts")
      .withIndex("by_user_bucket", (q) =>
        q.eq("userId", toUserId).eq("bucketType", "spend")
      )
      .unique();

    if (!toAccount) {
      throw new Error("Recipient's account not found");
    }

    const amountCents = Math.round(amount * 100);
    const description = note
      ? `Sent to ${toUser.firstName}: ${note}`
      : `Sent to ${toUser.firstName}`;

    const groupId = `send_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // DR recipient_spend / CR sender_spend
    await createJournalEntry(ctx, {
      debitAccountId: toAccount._id,
      creditAccountId: fromAccountId,
      amount: amountCents,
      description,
      category: "transfer",
      sourceType: "family_send",
      groupId,
      createdBy: user._id,
    });

    return { success: true };
  },
});
