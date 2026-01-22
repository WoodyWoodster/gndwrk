import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS = {
  // First actions
  first_save: {
    id: "first_save",
    name: "First Save",
    description: "Made your first deposit to your Save bucket",
    icon: "🏦",
    category: "saving",
    points: 50,
  },
  first_spend: {
    id: "first_spend",
    name: "First Purchase",
    description: "Made your first purchase with your Spend bucket",
    icon: "🛍️",
    category: "spending",
    points: 25,
  },
  first_give: {
    id: "first_give",
    name: "Giving Heart",
    description: "Made your first contribution to your Give bucket",
    icon: "💝",
    category: "giving",
    points: 75,
  },
  first_invest: {
    id: "first_invest",
    name: "Future Investor",
    description: "Made your first deposit to your Invest bucket",
    icon: "📈",
    category: "investing",
    points: 50,
  },
  first_chore: {
    id: "first_chore",
    name: "First Earner",
    description: "Completed your first chore",
    icon: "✅",
    category: "earning",
    points: 50,
  },
  first_loan: {
    id: "first_loan",
    name: "Loan Legend",
    description: "Paid off your first loan",
    icon: "🏆",
    category: "loans",
    points: 100,
  },

  // Streak achievements
  week_warrior: {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Used the app 7 days in a row",
    icon: "🔥",
    category: "engagement",
    points: 100,
  },
  month_master: {
    id: "month_master",
    name: "Month Master",
    description: "Used the app 30 days in a row",
    icon: "⚡",
    category: "engagement",
    points: 300,
  },
  savings_streak_7: {
    id: "savings_streak_7",
    name: "Saving Streak",
    description: "Saved money 7 weeks in a row",
    icon: "🎯",
    category: "saving",
    points: 150,
  },
  chore_streak_10: {
    id: "chore_streak_10",
    name: "Chore Champion",
    description: "Completed 10 chores in a row on time",
    icon: "🌟",
    category: "earning",
    points: 200,
  },

  // Milestone achievements
  goal_getter: {
    id: "goal_getter",
    name: "Goal Getter",
    description: "Reached your first savings goal",
    icon: "🎉",
    category: "saving",
    points: 150,
  },
  goal_crusher: {
    id: "goal_crusher",
    name: "Goal Crusher",
    description: "Reached 5 savings goals",
    icon: "💪",
    category: "saving",
    points: 400,
  },
  trust_builder_600: {
    id: "trust_builder_600",
    name: "Trust Builder",
    description: "Reached a Trust Score of 600",
    icon: "⭐",
    category: "trust",
    points: 200,
  },
  trust_builder_700: {
    id: "trust_builder_700",
    name: "Trust Star",
    description: "Reached a Trust Score of 700",
    icon: "🌟",
    category: "trust",
    points: 300,
  },
  trust_builder_800: {
    id: "trust_builder_800",
    name: "Trust Master",
    description: "Reached a Trust Score of 800",
    icon: "👑",
    category: "trust",
    points: 500,
  },
  early_bird_loan: {
    id: "early_bird_loan",
    name: "Early Bird",
    description: "Paid off a loan before the due date",
    icon: "🐦",
    category: "loans",
    points: 150,
  },
  chore_master_50: {
    id: "chore_master_50",
    name: "Chore Master",
    description: "Completed 50 chores",
    icon: "🏅",
    category: "earning",
    points: 300,
  },
  generous_giver: {
    id: "generous_giver",
    name: "Generous Giver",
    description: "Donated to charity 5 times",
    icon: "🌈",
    category: "giving",
    points: 250,
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENT_DEFINITIONS;

// Get all achievements for a user
export const getMyAchievements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Enrich with definition data
    return achievements.map((a) => ({
      ...a,
      definition: ACHIEVEMENT_DEFINITIONS[a.achievementId as AchievementId],
    }));
  },
});

// Get achievement progress (which achievements are unlocked vs locked)
export const getAchievementProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { unlocked: [], locked: [], totalPoints: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return { unlocked: [], locked: [], totalPoints: 0 };

    const userAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const unlockedIds = new Set(userAchievements.map((a) => a.achievementId));

    const unlocked = userAchievements.map((a) => ({
      ...ACHIEVEMENT_DEFINITIONS[a.achievementId as AchievementId],
      unlockedAt: a.unlockedAt,
      metadata: a.metadata,
    }));

    const locked = Object.values(ACHIEVEMENT_DEFINITIONS).filter(
      (def) => !unlockedIds.has(def.id)
    );

    const totalPoints = unlocked.reduce((sum, a) => sum + (a.points || 0), 0);

    return { unlocked, locked, totalPoints };
  },
});

// Check if user has a specific achievement
export const hasAchievement = query({
  args: { achievementId: v.string() },
  handler: async (ctx, { achievementId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return false;

    const achievement = await ctx.db
      .query("achievements")
      .withIndex("by_user_achievement", (q) =>
        q.eq("userId", user._id).eq("achievementId", achievementId)
      )
      .unique();

    return achievement !== null;
  },
});

// Internal mutation to unlock an achievement (called from other mutations)
export const unlock = internalMutation({
  args: {
    userId: v.id("users"),
    achievementId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { userId, achievementId, metadata }) => {
    // Check if already unlocked
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user_achievement", (q) =>
        q.eq("userId", userId).eq("achievementId", achievementId)
      )
      .unique();

    if (existing) return null; // Already unlocked

    // Unlock the achievement
    const achievementDoc = await ctx.db.insert("achievements", {
      userId,
      achievementId,
      unlockedAt: Date.now(),
      metadata,
    });

    return achievementDoc;
  },
});

// Public mutation to manually unlock (for testing/admin)
export const unlockAchievement = mutation({
  args: {
    achievementId: v.string(),
  },
  handler: async (ctx, { achievementId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if already unlocked
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user_achievement", (q) =>
        q.eq("userId", user._id).eq("achievementId", achievementId)
      )
      .unique();

    if (existing) return { alreadyUnlocked: true };

    // Unlock the achievement
    await ctx.db.insert("achievements", {
      userId: user._id,
      achievementId,
      unlockedAt: Date.now(),
    });

    return { alreadyUnlocked: false };
  },
});

// Get recently unlocked achievements (for notifications)
export const getRecentAchievements = query({
  args: { since: v.optional(v.number()) },
  handler: async (ctx, { since }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    // Default to last 24 hours if no timestamp provided
    const sinceTimestamp = since ?? Date.now() - 24 * 60 * 60 * 1000;

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("unlockedAt"), sinceTimestamp))
      .collect();

    return achievements.map((a) => ({
      ...a,
      definition: ACHIEVEMENT_DEFINITIONS[a.achievementId as AchievementId],
    }));
  },
});
