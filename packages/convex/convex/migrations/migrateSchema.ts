import { internalMutation, internalQuery } from "../_generated/server";

/**
 * SCHEMA MIGRATION DOCUMENTATION
 *
 * This file documents the migration from the old schema (with denormalized fields on users/accounts)
 * to the new normalized schema. Since the deprecated fields have been removed, these migrations
 * would need to be run against a backup or raw database export if needed.
 *
 * Migration Overview:
 * 1. stripeIdentities - Created from user stripe fields
 * 2. subscriptions - Created from user subscription fields
 * 3. kycVerifications - Created from user KYC fields
 * 4. onboardingSessions - Created from user onboarding fields
 * 5. familyMembers - Created from users with familyId
 * 6. kidProfiles - Created for users with role="kid"
 *
 * To run migrations against existing data:
 * - Use the Convex dashboard or npx convex data to export data
 * - Process the exported data to create new table records
 * - Import the processed data
 */

// Helper to check migration status (counts of new tables)
export const checkMigrationStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [
      stripeIdentities,
      subscriptions,
      familyMembers,
      onboardingSessions,
      kycVerifications,
      kidProfiles,
    ] = await Promise.all([
      ctx.db.query("stripeIdentities").collect(),
      ctx.db.query("subscriptions").collect(),
      ctx.db.query("familyMembers").collect(),
      ctx.db.query("onboardingSessions").collect(),
      ctx.db.query("kycVerifications").collect(),
      ctx.db.query("kidProfiles").collect(),
    ]);

    return {
      stripeIdentities: stripeIdentities.length,
      subscriptions: subscriptions.length,
      familyMembers: familyMembers.length,
      onboardingSessions: onboardingSessions.length,
      kycVerifications: kycVerifications.length,
      kidProfiles: kidProfiles.length,
    };
  },
});

// Add updatedAt to families that don't have it
export const addUpdatedAtToFamilies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const families = await ctx.db.query("families").collect();
    let updated = 0;

    for (const family of families) {
      if (!family.updatedAt) {
        await ctx.db.patch(family._id, {
          updatedAt: family.createdAt,
        });
        updated++;
      }
    }

    return { updated };
  },
});

// Ensure all users with familyId have familyMembers records
export const syncFamilyMembers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const families = await ctx.db.query("families").collect();
    const familyOwnerMap = new Map(families.map((f) => [f._id, f.ownerId]));
    const now = Date.now();
    let created = 0;

    for (const user of users) {
      if (!user.familyId) continue;

      // Check if familyMember exists
      const existing = await ctx.db
        .query("familyMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      if (existing) continue;

      // Determine role
      let role: "owner" | "parent" | "kid" = "kid";
      if (familyOwnerMap.get(user.familyId) === user._id) {
        role = "owner";
      } else if (user.role === "parent") {
        role = "parent";
      }

      await ctx.db.insert("familyMembers", {
        familyId: user.familyId,
        userId: user._id,
        role,
        status: "active",
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return { created };
  },
});

// Ensure all kids have kidProfiles records
export const syncKidProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    let created = 0;

    for (const user of users) {
      if (user.role !== "kid") continue;

      // Check if kidProfile exists
      const existing = await ctx.db
        .query("kidProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();

      if (existing) continue;

      await ctx.db.insert("kidProfiles", {
        userId: user._id,
        isManagedAccount: false,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return { created };
  },
});

// Run sync migrations
export const runSyncMigrations = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Run these migrations in sequence:");
    console.log("1. npx convex run migrations/migrateSchema:addUpdatedAtToFamilies");
    console.log("2. npx convex run migrations/migrateSchema:syncFamilyMembers");
    console.log("3. npx convex run migrations/migrateSchema:syncKidProfiles");
    console.log("");
    console.log("Then verify with: npx convex run migrations/migrateSchema:checkMigrationStatus");

    return { message: "See console for instructions" };
  },
});
