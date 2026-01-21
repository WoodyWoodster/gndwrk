import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current user's trust score
export const getMyCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const latestScore = await ctx.db
      .query("trustScores")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return latestScore;
  },
});

// Get user's trust score factors with tips
export const getMyFactors = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const latestScore = await ctx.db
      .query("trustScores")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (!latestScore) {
      return {
        loanRepayment: 50,
        savingsConsistency: 50,
        choreCompletion: 50,
        budgetAdherence: 50,
        givingBehavior: 50,
        accountAge: 0,
        parentEndorsements: 50,
        tips: [
          "Complete chores on time to earn points",
          "Save consistently each week",
          "Pay back loans on time",
        ],
      };
    }

    // Generate tips based on lowest factors
    const factors = latestScore.factors;
    const tips: string[] = [];

    const sortedFactors = Object.entries(factors).sort(([, a], [, b]) => a - b);

    for (const [factor, value] of sortedFactors.slice(0, 3)) {
      if (value < 70) {
        switch (factor) {
          case "loanRepayment":
            tips.push("Make your loan payments on time each week");
            break;
          case "savingsConsistency":
            tips.push("Try to save a little bit each week");
            break;
          case "choreCompletion":
            tips.push("Complete chores when you claim them");
            break;
          case "budgetAdherence":
            tips.push("Stay within your spending limits");
            break;
          case "givingBehavior":
            tips.push("Set aside some money to share with others");
            break;
          case "accountAge":
            tips.push("Keep using Gndwrk - your score improves over time!");
            break;
          case "parentEndorsements":
            tips.push("Ask your parent to endorse your good financial habits");
            break;
        }
      }
    }

    if (tips.length === 0) {
      tips.push("Great job! Keep up the good financial habits!");
    }

    return { ...factors, tips };
  },
});

// Get recent trust score events
export const getRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const events = await ctx.db
      .query("trustScoreEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return events.map((e) => ({
      id: e._id,
      event: e.event,
      points: e.points,
      date: e.createdAt,
    }));
  },
});

// Recalculate trust score for a user
export const recalculate = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Get all trust score events
    const events = await ctx.db
      .query("trustScoreEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Calculate factors based on events
    const eventsByType = events.reduce(
      (acc, e) => {
        acc[e.eventType] = acc[e.eventType] || [];
        acc[e.eventType].push(e);
        return acc;
      },
      {} as Record<string, typeof events>
    );

    // Loan repayment factor (25% weight)
    const loanEvents = [
      ...(eventsByType["loan_payment_on_time"] || []),
      ...(eventsByType["loan_payment_late"] || []),
      ...(eventsByType["loan_paid_early"] || []),
    ];
    const loanOnTime = loanEvents.filter((e) => e.points > 0).length;
    const loanRepayment = loanEvents.length > 0
      ? Math.min(100, Math.round((loanOnTime / loanEvents.length) * 100))
      : 50;

    // Savings consistency (20% weight)
    const savingsEvents = [
      ...(eventsByType["savings_goal_reached"] || []),
      ...(eventsByType["savings_streak"] || []),
    ];
    const savingsConsistency = Math.min(100, 50 + savingsEvents.length * 5);

    // Chore completion (15% weight)
    const choreEvents = eventsByType["chore_completed"] || [];
    const choreCompletion = Math.min(100, 50 + choreEvents.length * 2);

    // Budget adherence (15% weight)
    const overspentEvents = eventsByType["overspent_budget"] || [];
    const budgetAdherence = Math.max(0, 100 - overspentEvents.length * 10);

    // Giving behavior (10% weight)
    const givingEvents = eventsByType["giving_donation"] || [];
    const givingBehavior = Math.min(100, 50 + givingEvents.length * 5);

    // Account age (10% weight)
    const accountCreated = user._creationTime;
    const daysOld = Math.floor((Date.now() - accountCreated) / (1000 * 60 * 60 * 24));
    const accountAge = Math.min(100, Math.round(daysOld / 3.65)); // Max at 1 year

    // Parent endorsements (5% weight)
    const endorsementEvents = eventsByType["parent_endorsement"] || [];
    const parentEndorsements = Math.min(100, 50 + endorsementEvents.length * 10);

    // Calculate weighted score (300-850 range, like FICO)
    const weightedSum =
      loanRepayment * 0.25 +
      savingsConsistency * 0.20 +
      choreCompletion * 0.15 +
      budgetAdherence * 0.15 +
      givingBehavior * 0.10 +
      accountAge * 0.10 +
      parentEndorsements * 0.05;

    // Map 0-100 to 300-850
    const score = Math.round(300 + (weightedSum / 100) * 550);

    // Store new score snapshot
    await ctx.db.insert("trustScores", {
      userId,
      score,
      factors: {
        loanRepayment,
        savingsConsistency,
        choreCompletion,
        budgetAdherence,
        givingBehavior,
        accountAge,
        parentEndorsements,
      },
      calculatedAt: Date.now(),
    });

    return { score };
  },
});

// Parent endorsement
export const endorse = mutation({
  args: {
    kidId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { kidId, message }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const kid = await ctx.db.get(kidId);
    if (!kid || kid.familyId !== user.familyId) {
      throw new Error("Kid not found in your family");
    }

    await ctx.db.insert("trustScoreEvents", {
      userId: kidId,
      familyId: user.familyId!,
      event: message || "Parent endorsement for good financial habits",
      eventType: "parent_endorsement",
      points: 5,
      metadata: { endorsedBy: user._id },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
