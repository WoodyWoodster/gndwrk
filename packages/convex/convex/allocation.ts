import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import {
  createJournalEntryGroup,
  getSystemAccount,
  SYSTEM_ACCOUNTS,
} from "./ledger";

type BucketType = "spend" | "save" | "give" | "invest";

interface AllocationPercentages {
  spend: number;
  save: number;
  give: number;
  invest: number;
}

/**
 * Allocate a deposit across a user's bucket accounts based on family allocation percentages.
 *
 * - Gets the family's defaultAllocation (defaults to spend:100 if unset)
 * - Only allocates to buckets that exist for the user (respects tier)
 * - Re-normalizes percentages to existing buckets
 * - Remainder cents go to spend
 */
export async function allocateDeposit(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    familyId: Id<"families">;
    totalAmount: number; // cents, positive
    sourceType: string;
    sourceId?: string;
    description: string;
    createdBy?: Id<"users">;
    stripeTransactionId?: string;
  }
): Promise<void> {
  if (args.totalAmount <= 0) {
    throw new Error("Deposit amount must be positive");
  }

  // Get family allocation settings
  const family = await ctx.db.get(args.familyId);
  const defaultAllocation: AllocationPercentages = family?.defaultAllocation ?? {
    spend: 100,
    save: 0,
    give: 0,
    invest: 0,
  };

  // Get user's existing ledger accounts (only active user_bucket accounts)
  const userAccounts = await ctx.db
    .query("ledgerAccounts")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .filter((q) =>
      q.and(
        q.eq(q.field("category"), "user_bucket"),
        q.eq(q.field("isActive"), true)
      )
    )
    .collect();

  if (userAccounts.length === 0) {
    throw new Error("No active bucket accounts found for user");
  }

  // Build a map of existing bucket types to account IDs
  const bucketMap = new Map<BucketType, Id<"ledgerAccounts">>();
  for (const acc of userAccounts) {
    if (acc.bucketType) {
      bucketMap.set(acc.bucketType, acc._id);
    }
  }

  // Re-normalize allocation percentages to only include existing buckets
  const existingBuckets = Array.from(bucketMap.keys());
  let totalPercentage = 0;
  const normalizedAllocation: Partial<Record<BucketType, number>> = {};

  for (const bucket of existingBuckets) {
    const pct = defaultAllocation[bucket] ?? 0;
    normalizedAllocation[bucket] = pct;
    totalPercentage += pct;
  }

  // If total is 0 (e.g., all percentages were on missing buckets), default to 100% spend
  if (totalPercentage === 0) {
    if (bucketMap.has("spend")) {
      normalizedAllocation.spend = 100;
      totalPercentage = 100;
    } else {
      // Fallback: split evenly across existing
      const pct = 100 / existingBuckets.length;
      for (const bucket of existingBuckets) {
        normalizedAllocation[bucket] = pct;
      }
      totalPercentage = 100;
    }
  }

  // Calculate per-bucket amounts using floor division
  const entries: Array<{
    debitAccountId: Id<"ledgerAccounts">;
    creditAccountId: Id<"ledgerAccounts">;
    amount: number;
    description: string;
    category: string;
    sourceType: string;
    sourceId?: string;
    createdBy?: Id<"users">;
    stripeTransactionId?: string;
  }> = [];

  let allocated = 0;

  // Determine source system account based on sourceType
  let sourceAccountCode: string;
  switch (args.sourceType) {
    case "stripe_inbound":
    case "stripe_received_credit":
      sourceAccountCode = SYSTEM_ACCOUNTS.STRIPE_TREASURY;
      break;
    case "parent_deposit":
      sourceAccountCode = SYSTEM_ACCOUNTS.PARENT_DEPOSIT;
      break;
    default:
      sourceAccountCode = SYSTEM_ACCOUNTS.PARENT_DEPOSIT;
  }

  const sourceAccountId = await getSystemAccount(ctx, sourceAccountCode);

  // Calculate amounts for each bucket (except spend, which gets remainder)
  const bucketAmounts: Array<{ bucket: BucketType; amount: number }> = [];

  for (const bucket of existingBuckets) {
    if (bucket === "spend") continue; // Handle spend last for remainder
    const pct = normalizedAllocation[bucket] ?? 0;
    const amount = Math.floor((args.totalAmount * pct) / totalPercentage);
    if (amount > 0) {
      bucketAmounts.push({ bucket, amount });
      allocated += amount;
    }
  }

  // Spend gets the remainder
  const spendAmount = args.totalAmount - allocated;
  if (spendAmount > 0 && bucketMap.has("spend")) {
    bucketAmounts.unshift({ bucket: "spend", amount: spendAmount });
  } else if (spendAmount > 0 && !bucketMap.has("spend")) {
    // If no spend bucket, add remainder to first available bucket
    if (bucketAmounts.length > 0) {
      bucketAmounts[0].amount += spendAmount;
    }
  }

  // Build journal entries
  for (const { bucket, amount } of bucketAmounts) {
    const accountId = bucketMap.get(bucket);
    if (!accountId || amount <= 0) continue;

    entries.push({
      debitAccountId: accountId,
      creditAccountId: sourceAccountId,
      amount,
      description: `${args.description} (${bucket})`,
      category: "deposit",
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      createdBy: args.createdBy,
      stripeTransactionId: args.stripeTransactionId,
    });
  }

  if (entries.length === 0) {
    throw new Error("No valid allocation entries could be created");
  }

  await createJournalEntryGroup(ctx, entries);
}
