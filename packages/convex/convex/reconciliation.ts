import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { computeBalance } from "./ledger";

// Internal reconciliation: verify cached balances match computed balances
export const runInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const startedAt = Date.now();

    // Create reconciliation run record
    const runId = await ctx.db.insert("reconciliationRuns", {
      type: "internal",
      status: "running",
      startedAt,
    });

    try {
      // Get all active ledger accounts
      const accounts = await ctx.db
        .query("ledgerAccounts")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const discrepancies: Array<{
        ledgerAccountId: (typeof accounts)[0]["_id"];
        cachedBalance: number;
        computedBalance: number;
        difference: number;
        autoResolved: boolean;
      }> = [];

      for (const account of accounts) {
        const computed = await computeBalance(ctx, account._id);
        const difference = account.cachedBalance - computed;

        if (difference !== 0) {
          const autoResolved = Math.abs(difference) <= 1; // Auto-correct <= 1 cent

          if (autoResolved) {
            // Auto-correct small discrepancies
            await ctx.db.patch(account._id, {
              cachedBalance: computed,
              lastReconciled: Date.now(),
              updatedAt: Date.now(),
            });
          }

          discrepancies.push({
            ledgerAccountId: account._id,
            cachedBalance: account.cachedBalance,
            computedBalance: computed,
            difference,
            autoResolved,
          });
        } else {
          // Mark as reconciled
          await ctx.db.patch(account._id, {
            lastReconciled: Date.now(),
          });
        }
      }

      const hasUnresolved = discrepancies.some((d) => !d.autoResolved);

      await ctx.db.patch(runId, {
        status: hasUnresolved ? "discrepancy_found" : "passed",
        completedAt: Date.now(),
        accountsChecked: accounts.length,
        discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
      });

      return {
        accountsChecked: accounts.length,
        discrepancies: discrepancies.length,
        autoResolved: discrepancies.filter((d) => d.autoResolved).length,
      };
    } catch (error) {
      await ctx.db.patch(runId, {
        status: "failed",
        completedAt: Date.now(),
      });
      throw error;
    }
  },
});

// Stripe reconciliation: compare ledger balances to Stripe Treasury balances
// This is an action because it would call external Stripe API
export const runStripe = internalAction({
  args: {},
  handler: async (ctx): Promise<{ accountsChecked: number; discrepancies: number }> => {
    // Create reconciliation run
    const runId = await ctx.runMutation(
      internal.reconciliation.createStripeRun,
      {}
    ) as string;

    try {
      // Get all stripe identities with treasury accounts
      const result = await ctx.runMutation(
        internal.reconciliation.reconcileStripeAccounts,
        { runId }
      ) as { accountsChecked: number; discrepancies: number };

      return result;
    } catch (error) {
      await ctx.runMutation(internal.reconciliation.failRun, { runId });
      throw error;
    }
  },
});

// Helper mutation: create a stripe reconciliation run
export const createStripeRun = internalMutation({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.db.insert("reconciliationRuns", {
      type: "stripe",
      status: "running",
      startedAt: Date.now(),
    });
    return id.toString();
  },
});

// Helper mutation: reconcile stripe accounts (compares user bucket sums)
// In production, this would receive Stripe balances from the action
export const reconcileStripeAccounts = internalMutation({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    // Get all users with stripe treasury accounts
    const stripeIdentities = await ctx.db
      .query("stripeIdentities")
      .filter((q) => q.neq(q.field("stripeTreasuryAccountId"), undefined))
      .collect();

    const discrepancies: Array<{
      ledgerAccountId: any;
      cachedBalance: number;
      computedBalance: number;
      stripeBalance?: number;
      difference: number;
      autoResolved: boolean;
    }> = [];

    let accountsChecked = 0;

    for (const si of stripeIdentities) {
      // Get user's bucket accounts
      const userAccounts = await ctx.db
        .query("ledgerAccounts")
        .withIndex("by_user", (q) => q.eq("userId", si.userId))
        .filter((q) => q.eq(q.field("category"), "user_bucket"))
        .collect();

      const totalCachedBalance = userAccounts.reduce(
        (sum, acc) => sum + acc.cachedBalance,
        0
      );

      // Compute from journal entries
      let totalComputedBalance = 0;
      for (const acc of userAccounts) {
        totalComputedBalance += await computeBalance(ctx, acc._id);
        accountsChecked++;
      }

      // Note: In production, we'd compare against actual Stripe balance fetched in the action
      // For now, just verify internal consistency
      if (totalCachedBalance !== totalComputedBalance) {
        discrepancies.push({
          ledgerAccountId: userAccounts[0]?._id,
          cachedBalance: totalCachedBalance,
          computedBalance: totalComputedBalance,
          difference: totalCachedBalance - totalComputedBalance,
          autoResolved: false,
        });
      }
    }

    // Update the run record - find by creation time since we have string ID
    const runs = await ctx.db
      .query("reconciliationRuns")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .filter((q) => q.eq(q.field("type"), "stripe"))
      .collect();

    const run = runs[runs.length - 1];
    if (run) {
      await ctx.db.patch(run._id, {
        status: discrepancies.length > 0 ? "discrepancy_found" : "passed",
        completedAt: Date.now(),
        accountsChecked,
        discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
      });
    }

    return { accountsChecked, discrepancies: discrepancies.length };
  },
});

// Helper mutation: mark a run as failed
export const failRun = internalMutation({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    const runs = await ctx.db
      .query("reconciliationRuns")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();

    const run = runs[runs.length - 1];
    if (run) {
      await ctx.db.patch(run._id, {
        status: "failed",
        completedAt: Date.now(),
      });
    }
  },
});

