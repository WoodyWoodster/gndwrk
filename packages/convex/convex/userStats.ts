import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Computed statistics for users.
 * These replace the denormalized counters that were previously stored on the users table.
 */

// Get count of chores completed (paid) for a user
export const getChoresCompleted = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const paidChores = await ctx.db
      .query("chores")
      .withIndex("by_assigned", (q) => q.eq("assignedTo", userId))
      .filter((q) => q.eq(q.field("status"), "paid"))
      .collect();

    return paidChores.length;
  },
});

// Get count of loans repaid for a user
export const getLoansRepaid = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const paidLoans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", userId))
      .filter((q) => q.eq(q.field("status"), "paid"))
      .collect();

    return paidLoans.length;
  },
});

// Get savings streak from trust score events
export const getSavingStreak = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get all savings_streak events for the user, ordered by most recent
    const savingsEvents = await ctx.db
      .query("trustScoreEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("eventType"), "savings_streak"))
      .order("desc")
      .collect();

    // Count consecutive positive savings events
    let streak = 0;
    for (const event of savingsEvents) {
      if (event.points > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },
});

// Get spending for a specific period
export const getSpendingForPeriod = query({
  args: {
    userId: v.id("users"),
    period: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
  },
  handler: async (ctx, { userId, period }) => {
    const now = Date.now();
    let startTime: number;

    switch (period) {
      case "day":
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case "week":
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        startTime = startOfMonth.getTime();
        break;
    }

    // Get spend account for user
    const spendAccount = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", "spend"))
      .unique();

    if (!spendAccount) return 0;

    // Get debit transactions for the period
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", spendAccount._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startTime),
          q.eq(q.field("type"), "debit")
        )
      )
      .collect();

    // Sum absolute values of debit transactions
    const totalSpent = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    return totalSpent; // Returns cents
  },
});

// Get comprehensive stats for a user
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get all stats in parallel
    const [
      paidChores,
      paidLoans,
      savingsGoals,
      activeSavingsGoals,
      trustScore,
      savingsStreakEvents,
    ] = await Promise.all([
      // Chores completed
      ctx.db
        .query("chores")
        .withIndex("by_assigned", (q) => q.eq("assignedTo", userId))
        .filter((q) => q.eq(q.field("status"), "paid"))
        .collect(),
      // Loans repaid
      ctx.db
        .query("loans")
        .withIndex("by_borrower", (q) => q.eq("borrowerId", userId))
        .filter((q) => q.eq(q.field("status"), "paid"))
        .collect(),
      // All savings goals
      ctx.db
        .query("savingsGoals")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      // Active savings goals
      ctx.db
        .query("savingsGoals")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect(),
      // Latest trust score
      ctx.db
        .query("trustScores")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .first(),
      // Savings streak events
      ctx.db
        .query("trustScoreEvents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("eventType"), "savings_streak"))
        .order("desc")
        .collect(),
    ]);

    // Calculate savings progress
    const totalSavingsTarget = activeSavingsGoals.reduce(
      (sum, g) => sum + g.targetAmount,
      0
    );
    const totalSavingsProgress = activeSavingsGoals.reduce(
      (sum, g) => sum + g.currentAmount,
      0
    );
    const completedSavingsGoals = savingsGoals.filter(
      (g) => g.status === "completed"
    ).length;

    // Calculate savings streak from events
    let savingStreak = 0;
    for (const event of savingsStreakEvents) {
      if (event.points > 0) {
        savingStreak++;
      } else {
        break;
      }
    }

    return {
      choresCompleted: paidChores.length,
      loansRepaid: paidLoans.length,
      savingStreak,
      trustScore: trustScore?.score ?? 500,
      trustScoreFactors: trustScore?.factors,
      activeSavingsGoals: activeSavingsGoals.length,
      completedSavingsGoals,
      totalSavingsTarget: totalSavingsTarget / 100, // Convert to dollars
      totalSavingsProgress: totalSavingsProgress / 100,
      savingsProgressPercent:
        totalSavingsTarget > 0
          ? Math.round((totalSavingsProgress / totalSavingsTarget) * 100)
          : 0,
    };
  },
});

// Get account spending stats (for spend limits checking)
export const getAccountSpending = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, { accountId }) => {
    const now = Date.now();

    // Calculate time boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get all debit transactions for the account
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .filter((q) => q.eq(q.field("type"), "debit"))
      .collect();

    // Calculate spending for each period
    let dailySpent = 0;
    let weeklySpent = 0;
    let monthlySpent = 0;

    for (const t of transactions) {
      const amount = Math.abs(t.amount);

      if (t.createdAt >= startOfDay.getTime()) {
        dailySpent += amount;
      }
      if (t.createdAt >= startOfWeek.getTime()) {
        weeklySpent += amount;
      }
      if (t.createdAt >= startOfMonth.getTime()) {
        monthlySpent += amount;
      }
    }

    return {
      dailySpent,
      weeklySpent,
      monthlySpent,
    };
  },
});
