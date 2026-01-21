import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all chores for a family
export const getFamilyChores = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const chores = await ctx.db
      .query("chores")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();

    // Get assigned user names
    const assignedUserIds = chores
      .map((c) => c.assignedTo)
      .filter((id): id is NonNullable<typeof id> => Boolean(id));
    const users = await Promise.all(
      [...new Set(assignedUserIds)].map((id) => ctx.db.get(id))
    );
    const userMap = new Map(
      users.filter(Boolean).map((u) => [u!._id, u!] as const)
    );

    return chores.map((chore) => ({
      ...chore,
      payout: chore.payout / 100,
      assignedToName: chore.assignedTo
        ? userMap.get(chore.assignedTo)?.firstName
        : undefined,
    }));
  },
});

// Get pending approval chores for a family
export const getPendingApproval = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const chores = await ctx.db
      .query("chores")
      .withIndex("by_family_status", (q) =>
        q.eq("familyId", familyId).eq("status", "pending_approval")
      )
      .collect();

    return chores.map((chore) => ({
      ...chore,
      payout: chore.payout / 100,
    }));
  },
});

// Get available chores for a kid
export const getAvailableForKid = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const chores = await ctx.db
      .query("chores")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "open"),
          q.and(
            q.eq(q.field("assignedTo"), user._id),
            q.or(
              q.eq(q.field("status"), "claimed"),
              q.eq(q.field("status"), "pending_approval")
            )
          )
        )
      )
      .collect();

    return chores.map((chore) => ({
      ...chore,
      payout: chore.payout / 100,
      isMine: chore.assignedTo === user._id,
    }));
  },
});

// Create a new chore (parent only)
export const create = mutation({
  args: {
    familyId: v.id("families"),
    title: v.string(),
    description: v.string(),
    payout: v.number(), // In dollars
    frequency: v.union(v.literal("once"), v.literal("daily"), v.literal("weekly")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, { familyId, title, description, payout, frequency, dueDate }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const choreId = await ctx.db.insert("chores", {
      familyId,
      createdBy: user._id,
      title,
      description,
      payout: Math.round(payout * 100),
      frequency,
      status: "open",
      dueDate,
      createdAt: Date.now(),
    });

    return choreId;
  },
});

// Claim a chore (kid only)
export const claim = mutation({
  args: { choreId: v.id("chores") },
  handler: async (ctx, { choreId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "kid") {
      throw new Error("Not authorized");
    }

    const chore = await ctx.db.get(choreId);
    if (!chore || chore.familyId !== user.familyId) {
      throw new Error("Chore not found");
    }

    if (chore.status !== "open") {
      throw new Error("Chore is not available");
    }

    await ctx.db.patch(choreId, {
      status: "claimed",
      assignedTo: user._id,
    });

    return { success: true };
  },
});

// Mark chore as complete (kid only)
export const complete = mutation({
  args: {
    choreId: v.id("chores"),
    proofPhotoUrl: v.optional(v.string()),
  },
  handler: async (ctx, { choreId, proofPhotoUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const chore = await ctx.db.get(choreId);
    if (!chore || chore.assignedTo !== user._id) {
      throw new Error("Chore not found or not assigned to you");
    }

    if (chore.status !== "claimed") {
      throw new Error("Chore must be claimed first");
    }

    await ctx.db.patch(choreId, {
      status: "pending_approval",
      completedAt: Date.now(),
      proofPhotoUrl,
    });

    return { success: true };
  },
});

// Approve a completed chore (parent only)
export const approve = mutation({
  args: { choreId: v.id("chores") },
  handler: async (ctx, { choreId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const chore = await ctx.db.get(choreId);
    if (!chore || chore.familyId !== user.familyId) {
      throw new Error("Chore not found");
    }

    if (chore.status !== "pending_approval") {
      throw new Error("Chore is not pending approval");
    }

    // Get kid's spend account
    const kidAccount = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", chore.assignedTo!).eq("type", "spend")
      )
      .unique();

    if (!kidAccount) {
      throw new Error("Kid's account not found");
    }

    const now = Date.now();

    // Get kid for updating chore count, and parallelize all other operations
    const [kid] = await Promise.all([
      ctx.db.get(chore.assignedTo!),
      ctx.db.patch(choreId, {
        status: "paid",
        approvedAt: now,
      }),
      ctx.db.patch(kidAccount._id, {
        balance: kidAccount.balance + chore.payout,
      }),
      ctx.db.insert("transactions", {
        userId: chore.assignedTo!,
        accountId: kidAccount._id,
        familyId: chore.familyId,
        amount: chore.payout,
        type: "credit",
        category: "Chore",
        description: `Chore: ${chore.title}`,
        choreId: choreId,
        status: "completed",
        createdAt: now,
      }),
      ctx.db.insert("trustScoreEvents", {
        userId: chore.assignedTo!,
        familyId: chore.familyId,
        event: `Completed chore: ${chore.title}`,
        eventType: "chore_completed",
        points: 2,
        createdAt: now,
      }),
    ]);

    // Update kid's chores completed count
    if (kid) {
      await ctx.db.patch(kid._id, {
        choresCompleted: (kid.choresCompleted ?? 0) + 1,
      });
    }

    return { success: true };
  },
});

// Reject a completed chore (parent only)
export const reject = mutation({
  args: {
    choreId: v.id("chores"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { choreId, reason }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const chore = await ctx.db.get(choreId);
    if (!chore || chore.familyId !== user.familyId) {
      throw new Error("Chore not found");
    }

    // Reset to claimed so kid can try again
    await ctx.db.patch(choreId, {
      status: "claimed",
      completedAt: undefined,
    });

    return { success: true };
  },
});
