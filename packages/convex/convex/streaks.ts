import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const STREAK_TYPES = ["daily_login", "savings_streak", "chore_streak"] as const;
type StreakType = (typeof STREAK_TYPES)[number];

// Timeouts for different streak types
const STREAK_TIMEOUT_MS: Record<StreakType, number> = {
  daily_login: 48 * 60 * 60 * 1000, // 48 hours (miss a day = reset)
  savings_streak: 8 * 24 * 60 * 60 * 1000, // 8 days (weekly saves, with buffer)
  chore_streak: 48 * 60 * 60 * 1000, // 48 hours between chores
};

// Get all streaks for current user
export const getMyStreaks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const streaks = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();

    // Check if streaks are still active
    return streaks.map((streak) => {
      const timeout = STREAK_TIMEOUT_MS[streak.streakType];
      const isActive = now - streak.lastActivityAt < timeout;

      return {
        ...streak,
        isActive,
        daysRemaining: isActive
          ? Math.ceil((streak.lastActivityAt + timeout - now) / (24 * 60 * 60 * 1000))
          : 0,
      };
    });
  },
});

// Get a specific streak
export const getStreak = query({
  args: { streakType: v.union(v.literal("daily_login"), v.literal("savings_streak"), v.literal("chore_streak")) },
  handler: async (ctx, { streakType }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("streakType", streakType)
      )
      .unique();

    if (!streak) {
      return {
        streakType,
        currentCount: 0,
        longestCount: 0,
        isActive: false,
        daysRemaining: 0,
      };
    }

    const timeout = STREAK_TIMEOUT_MS[streakType];
    const now = Date.now();
    const isActive = now - streak.lastActivityAt < timeout;

    return {
      ...streak,
      isActive,
      daysRemaining: isActive
        ? Math.ceil((streak.lastActivityAt + timeout - now) / (24 * 60 * 60 * 1000))
        : 0,
    };
  },
});

// Record daily login streak
export const recordDailyLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const streakType = "daily_login" as const;
    const timeout = STREAK_TIMEOUT_MS[streakType];

    // Get existing streak
    const existing = await ctx.db
      .query("streaks")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("streakType", streakType)
      )
      .unique();

    if (!existing) {
      // Create new streak
      await ctx.db.insert("streaks", {
        userId: user._id,
        streakType,
        currentCount: 1,
        longestCount: 1,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { currentStreak: 1, isNewRecord: true };
    }

    // Check if we should continue the streak
    const timeSinceLastActivity = now - existing.lastActivityAt;

    // If within the same day (roughly), don't increment
    const sameDay = timeSinceLastActivity < 12 * 60 * 60 * 1000; // 12 hours
    if (sameDay) {
      return { currentStreak: existing.currentCount, isNewRecord: false };
    }

    // If streak expired, reset
    if (timeSinceLastActivity > timeout) {
      await ctx.db.patch(existing._id, {
        currentCount: 1,
        lastActivityAt: now,
        updatedAt: now,
      });
      return { currentStreak: 1, isNewRecord: false };
    }

    // Continue streak
    const newCount = existing.currentCount + 1;
    const isNewRecord = newCount > existing.longestCount;

    await ctx.db.patch(existing._id, {
      currentCount: newCount,
      longestCount: isNewRecord ? newCount : existing.longestCount,
      lastActivityAt: now,
      updatedAt: now,
    });

    // Check for streak achievements
    if (newCount === 7) {
      await ctx.runMutation(internal.achievements.unlock, {
        userId: user._id,
        achievementId: "week_warrior",
        metadata: { streakDays: 7 },
      });
    } else if (newCount === 30) {
      await ctx.runMutation(internal.achievements.unlock, {
        userId: user._id,
        achievementId: "month_master",
        metadata: { streakDays: 30 },
      });
    }

    return { currentStreak: newCount, isNewRecord };
  },
});

// Internal mutation to record streak activity (called from other mutations)
export const recordActivity = internalMutation({
  args: {
    userId: v.id("users"),
    streakType: v.union(v.literal("daily_login"), v.literal("savings_streak"), v.literal("chore_streak")),
  },
  handler: async (ctx, { userId, streakType }) => {
    const now = Date.now();
    const timeout = STREAK_TIMEOUT_MS[streakType];

    // Get existing streak
    const existing = await ctx.db
      .query("streaks")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", userId).eq("streakType", streakType)
      )
      .unique();

    if (!existing) {
      // Create new streak
      await ctx.db.insert("streaks", {
        userId,
        streakType,
        currentCount: 1,
        longestCount: 1,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { currentStreak: 1, isNewRecord: true };
    }

    // Check if streak expired
    const timeSinceLastActivity = now - existing.lastActivityAt;

    if (timeSinceLastActivity > timeout) {
      // Reset streak
      await ctx.db.patch(existing._id, {
        currentCount: 1,
        lastActivityAt: now,
        updatedAt: now,
      });
      return { currentStreak: 1, isNewRecord: false };
    }

    // Continue streak
    const newCount = existing.currentCount + 1;
    const isNewRecord = newCount > existing.longestCount;

    await ctx.db.patch(existing._id, {
      currentCount: newCount,
      longestCount: isNewRecord ? newCount : existing.longestCount,
      lastActivityAt: now,
      updatedAt: now,
    });

    // Check for streak achievements
    if (streakType === "savings_streak" && newCount === 7) {
      await ctx.runMutation(internal.achievements.unlock, {
        userId,
        achievementId: "savings_streak_7",
        metadata: { weeks: 7 },
      });
    } else if (streakType === "chore_streak" && newCount === 10) {
      await ctx.runMutation(internal.achievements.unlock, {
        userId,
        achievementId: "chore_streak_10",
        metadata: { chores: 10 },
      });
    }

    return { currentStreak: newCount, isNewRecord };
  },
});

// Get leaderboard of top streaks in a family
export const getFamilyStreakLeaderboard = query({
  args: { streakType: v.union(v.literal("daily_login"), v.literal("savings_streak"), v.literal("chore_streak")) },
  handler: async (ctx, { streakType }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || !user.familyId) return [];

    // Get all family members
    const familyMembers = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", user.familyId!))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get streaks for each member
    const leaderboard = await Promise.all(
      familyMembers.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        if (!memberUser) return null;

        const streak = await ctx.db
          .query("streaks")
          .withIndex("by_user_type", (q) =>
            q.eq("userId", member.userId).eq("streakType", streakType)
          )
          .unique();

        return {
          userId: member.userId,
          firstName: memberUser.firstName,
          currentStreak: streak?.currentCount ?? 0,
          longestStreak: streak?.longestCount ?? 0,
        };
      })
    );

    // Sort by current streak, then longest streak
    return leaderboard
      .filter(Boolean)
      .sort((a, b) => {
        if (b!.currentStreak !== a!.currentStreak) {
          return b!.currentStreak - a!.currentStreak;
        }
        return b!.longestStreak - a!.longestStreak;
      });
  },
});
