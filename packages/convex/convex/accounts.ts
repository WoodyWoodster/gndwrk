import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current user's accounts
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
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Convert balance from cents to dollars
    return accounts.map((acc) => ({
      ...acc,
      balance: acc.balance / 100,
    }));
  },
});

// Get accounts for a specific user
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return accounts.map((acc) => ({
      ...acc,
      balance: acc.balance / 100,
    }));
  },
});

// Transfer between buckets
export const transfer = mutation({
  args: {
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
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

    if (fromAccount.balance < amountCents) {
      throw new Error("Insufficient funds");
    }

    // Update balances
    await ctx.db.patch(fromAccountId, {
      balance: fromAccount.balance - amountCents,
    });
    await ctx.db.patch(toAccountId, {
      balance: toAccount.balance + amountCents,
    });

    // Create transaction records
    const now = Date.now();

    await ctx.db.insert("transactions", {
      userId: user._id,
      accountId: fromAccountId,
      familyId: fromAccount.familyId,
      amount: -amountCents,
      type: "debit",
      category: "Transfer",
      description: `Transfer to ${toAccount.type}`,
      transferToAccountId: toAccountId,
      status: "completed",
      createdAt: now,
    });

    await ctx.db.insert("transactions", {
      userId: user._id,
      accountId: toAccountId,
      familyId: toAccount.familyId,
      amount: amountCents,
      type: "credit",
      category: "Transfer",
      description: `Transfer from ${fromAccount.type}`,
      status: "completed",
      createdAt: now,
    });

    return { success: true };
  },
});

// Set savings goal - creates a new savings goal in the savingsGoals table
export const setGoal = mutation({
  args: {
    accountId: v.id("accounts"),
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

    // Create a savings goal record
    const goalId = await ctx.db.insert("savingsGoals", {
      userId: user._id,
      accountId,
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
    accountId: v.id("accounts"),
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

// Send money to another family member
export const sendToFamilyMember = mutation({
  args: {
    fromAccountId: v.id("accounts"),
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
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", toUserId).eq("type", "spend")
      )
      .unique();

    if (!toAccount) {
      throw new Error("Recipient's account not found");
    }

    const amountCents = Math.round(amount * 100);

    if (fromAccount.balance < amountCents) {
      throw new Error("Insufficient funds");
    }

    const now = Date.now();
    const description = note
      ? `Sent to ${toUser.firstName}: ${note}`
      : `Sent to ${toUser.firstName}`;
    const receiveDescription = note
      ? `Received from ${user.firstName}: ${note}`
      : `Received from ${user.firstName}`;

    // Update balances and create transactions in parallel
    await Promise.all([
      ctx.db.patch(fromAccountId, {
        balance: fromAccount.balance - amountCents,
      }),
      ctx.db.patch(toAccount._id, {
        balance: toAccount.balance + amountCents,
      }),
      ctx.db.insert("transactions", {
        userId: user._id,
        accountId: fromAccountId,
        familyId: fromAccount.familyId,
        amount: -amountCents,
        type: "debit",
        category: "Transfer",
        description,
        status: "completed",
        createdAt: now,
      }),
      ctx.db.insert("transactions", {
        userId: toUserId,
        accountId: toAccount._id,
        familyId: toAccount.familyId,
        amount: amountCents,
        type: "credit",
        category: "Transfer",
        description: receiveDescription,
        status: "completed",
        createdAt: now,
      }),
    ]);

    return { success: true };
  },
});

// Create accounts for a new user
export const createForUser = mutation({
  args: {
    userId: v.id("users"),
    familyId: v.id("families"),
  },
  handler: async (ctx, { userId, familyId }) => {
    const bucketTypes = ["spend", "save", "give", "invest"] as const;

    for (const type of bucketTypes) {
      await ctx.db.insert("accounts", {
        userId,
        familyId,
        type,
        balance: 0,
      });
    }

    return { success: true };
  },
});
