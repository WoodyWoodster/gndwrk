import { v } from "convex/values";
import { mutation, internalMutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

// System account codes
export const SYSTEM_ACCOUNTS = {
  STRIPE_TREASURY: "SYS_STRIPE_TREASURY",
  PARENT_DEPOSIT: "SYS_PARENT_DEPOSIT",
  CHORE_POOL: "SYS_CHORE_POOL",
  LOAN_POOL: "SYS_LOAN_POOL",
  CARD_PURCHASES: "SYS_CARD_PURCHASES",
  REFUND_SOURCE: "SYS_REFUND_SOURCE",
  SUSPENSE: "SYS_SUSPENSE",
} as const;

type BucketType = "spend" | "save" | "give" | "invest";

// Generate a UUID-like string
function generateEntryId(): string {
  const hex = () => Math.random().toString(16).substring(2, 10);
  return `${hex()}-${hex().substring(0, 4)}-${hex().substring(0, 4)}-${hex().substring(0, 4)}-${hex()}${hex().substring(0, 4)}`;
}

// Get next monotonic sequence number
export async function getNextSequenceNumber(ctx: MutationCtx): Promise<number> {
  const seqDoc = await ctx.db.query("ledgerSequence").first();
  if (!seqDoc) {
    await ctx.db.insert("ledgerSequence", { currentSequence: 1 });
    return 1;
  }
  const next = seqDoc.currentSequence + 1;
  await ctx.db.patch(seqDoc._id, { currentSequence: next });
  return next;
}

// Get system account by code
export async function getSystemAccount(
  ctx: MutationCtx,
  code: string
): Promise<Id<"ledgerAccounts">> {
  const account = await ctx.db
    .query("ledgerAccounts")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();

  if (!account) {
    throw new Error(`System account not found: ${code}. Run seedSystemAccounts first.`);
  }
  return account._id;
}

// Create a single journal entry, updating cached balances on both accounts
export async function createJournalEntry(
  ctx: MutationCtx,
  args: {
    debitAccountId: Id<"ledgerAccounts">;
    creditAccountId: Id<"ledgerAccounts">;
    amount: number;
    description: string;
    category: string;
    sourceType: string;
    sourceId?: string;
    groupId: string;
    createdBy?: Id<"users">;
    choreId?: Id<"chores">;
    loanId?: Id<"loans">;
    stripeTransactionId?: string;
    stripeAuthorizationId?: string;
    isReversal?: boolean;
    reversesEntryId?: string;
  }
): Promise<Id<"journalEntries">> {
  if (args.amount <= 0) {
    throw new Error("Journal entry amount must be positive");
  }

  const debitAccount = await ctx.db.get(args.debitAccountId);
  const creditAccount = await ctx.db.get(args.creditAccountId);

  if (!debitAccount || !creditAccount) {
    throw new Error("Ledger account not found");
  }

  if (!debitAccount.isActive || !creditAccount.isActive) {
    throw new Error("Cannot create entry targeting inactive account");
  }

  // Calculate new balances based on account types
  // For asset accounts: debit increases, credit decreases
  // For equity/expense accounts: debit decreases, credit increases
  let newDebitBalance: number;
  let newCreditBalance: number;

  if (debitAccount.accountType === "asset") {
    newDebitBalance = debitAccount.cachedBalance + args.amount;
  } else {
    // equity, liability, expense: debit decreases
    newDebitBalance = debitAccount.cachedBalance - args.amount;
  }

  if (creditAccount.accountType === "asset") {
    newCreditBalance = creditAccount.cachedBalance - args.amount;
    // Guard: reject if asset account would go below 0
    if (newCreditBalance < 0) {
      throw new Error(
        `Insufficient funds in account ${creditAccount.code}: balance ${creditAccount.cachedBalance}, attempted deduction ${args.amount}`
      );
    }
  } else {
    // equity, liability, expense: credit increases
    newCreditBalance = creditAccount.cachedBalance + args.amount;
  }

  const now = Date.now();
  const sequenceNumber = await getNextSequenceNumber(ctx);
  const entryId = generateEntryId();

  // Create the journal entry
  const id = await ctx.db.insert("journalEntries", {
    entryId,
    sequenceNumber,
    debitAccountId: args.debitAccountId,
    creditAccountId: args.creditAccountId,
    amount: args.amount,
    description: args.description,
    category: args.category,
    sourceType: args.sourceType,
    sourceId: args.sourceId,
    groupId: args.groupId,
    createdAt: now,
    createdBy: args.createdBy,
    choreId: args.choreId,
    loanId: args.loanId,
    stripeTransactionId: args.stripeTransactionId,
    stripeAuthorizationId: args.stripeAuthorizationId,
    isReversal: args.isReversal,
    reversesEntryId: args.reversesEntryId,
  });

  // Update cached balances
  await ctx.db.patch(args.debitAccountId, {
    cachedBalance: newDebitBalance,
    updatedAt: now,
  });
  await ctx.db.patch(args.creditAccountId, {
    cachedBalance: newCreditBalance,
    updatedAt: now,
  });

  return id;
}

// Create multiple entries atomically with the same groupId
export async function createJournalEntryGroup(
  ctx: MutationCtx,
  entries: Array<{
    debitAccountId: Id<"ledgerAccounts">;
    creditAccountId: Id<"ledgerAccounts">;
    amount: number;
    description: string;
    category: string;
    sourceType: string;
    sourceId?: string;
    createdBy?: Id<"users">;
    choreId?: Id<"chores">;
    loanId?: Id<"loans">;
    stripeTransactionId?: string;
  }>
): Promise<Id<"journalEntries">[]> {
  const groupId = generateEntryId();
  const results: Id<"journalEntries">[] = [];

  for (const entry of entries) {
    const id = await createJournalEntry(ctx, {
      ...entry,
      groupId,
    });
    results.push(id);
  }

  return results;
}

// Create a reversing entry (swaps debit/credit, links bidirectionally)
export async function reverseJournalEntry(
  ctx: MutationCtx,
  entryId: string,
  reason: string
): Promise<Id<"journalEntries">> {
  const original = await ctx.db
    .query("journalEntries")
    .withIndex("by_entry_id", (q) => q.eq("entryId", entryId))
    .unique();

  if (!original) {
    throw new Error(`Journal entry not found: ${entryId}`);
  }

  if (original.reversedByEntryId) {
    throw new Error(`Entry ${entryId} has already been reversed`);
  }

  const groupId = generateEntryId();

  // Swap debit and credit to reverse
  const reversalId = await createJournalEntry(ctx, {
    debitAccountId: original.creditAccountId,
    creditAccountId: original.debitAccountId,
    amount: original.amount,
    description: `Reversal: ${reason}`,
    category: original.category,
    sourceType: "reversal",
    sourceId: original.entryId,
    groupId,
    createdBy: original.createdBy,
    isReversal: true,
    reversesEntryId: original.entryId,
  });

  // Link the original to the reversal
  const reversalEntry = await ctx.db.get(reversalId);
  if (reversalEntry) {
    await ctx.db.patch(original._id, {
      reversedByEntryId: reversalEntry.entryId,
    });
  }

  return reversalId;
}

// Compute balance from journal entries (for reconciliation)
export async function computeBalance(
  ctx: MutationCtx,
  ledgerAccountId: Id<"ledgerAccounts">
): Promise<number> {
  const account = await ctx.db.get(ledgerAccountId);
  if (!account) throw new Error("Account not found");

  // Get all debits to this account
  const debits = await ctx.db
    .query("journalEntries")
    .withIndex("by_debit_account", (q) => q.eq("debitAccountId", ledgerAccountId))
    .collect();

  // Get all credits to this account
  const credits = await ctx.db
    .query("journalEntries")
    .withIndex("by_credit_account", (q) => q.eq("creditAccountId", ledgerAccountId))
    .collect();

  let balance = 0;

  if (account.accountType === "asset") {
    // Asset: debits increase, credits decrease
    for (const entry of debits) balance += entry.amount;
    for (const entry of credits) balance -= entry.amount;
  } else {
    // Equity/liability/expense: credits increase, debits decrease
    for (const entry of credits) balance += entry.amount;
    for (const entry of debits) balance -= entry.amount;
  }

  return balance;
}

// Get or create user's bucket ledger accounts
export async function ensureUserAccounts(
  ctx: MutationCtx,
  userId: Id<"users">,
  familyId: Id<"families">,
  bucketTypes: BucketType[]
): Promise<Record<BucketType, Id<"ledgerAccounts">>> {
  const result = {} as Record<BucketType, Id<"ledgerAccounts">>;
  const now = Date.now();

  for (const bucket of bucketTypes) {
    const code = `USR_${userId}_${bucket}`;

    const existing = await ctx.db
      .query("ledgerAccounts")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (existing) {
      result[bucket] = existing._id;
    } else {
      const id = await ctx.db.insert("ledgerAccounts", {
        code,
        name: `${bucket.charAt(0).toUpperCase() + bucket.slice(1)} Account`,
        accountType: "asset",
        category: "user_bucket",
        userId,
        familyId,
        bucketType: bucket,
        cachedBalance: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      result[bucket] = id;
    }
  }

  return result;
}

// Seed system accounts (idempotent)
export const seedSystemAccounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const systemAccounts = [
      {
        code: SYSTEM_ACCOUNTS.STRIPE_TREASURY,
        name: "Stripe Treasury",
        accountType: "equity" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.PARENT_DEPOSIT,
        name: "Parent Deposits",
        accountType: "equity" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.CHORE_POOL,
        name: "Chore Pool",
        accountType: "equity" as const,
        category: "system_internal" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.LOAN_POOL,
        name: "Loan Pool",
        accountType: "equity" as const,
        category: "system_internal" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.CARD_PURCHASES,
        name: "Card Purchases",
        accountType: "expense" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.REFUND_SOURCE,
        name: "Refund Source",
        accountType: "equity" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.SUSPENSE,
        name: "Suspense",
        accountType: "equity" as const,
        category: "system_suspense" as const,
      },
    ];

    const now = Date.now();
    let created = 0;

    for (const acct of systemAccounts) {
      const existing = await ctx.db
        .query("ledgerAccounts")
        .withIndex("by_code", (q) => q.eq("code", acct.code))
        .unique();

      if (!existing) {
        await ctx.db.insert("ledgerAccounts", {
          code: acct.code,
          name: acct.name,
          accountType: acct.accountType,
          category: acct.category,
          cachedBalance: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return { created, total: systemAccounts.length };
  },
});

// Public mutation to seed system accounts (for initial setup)
export const initSystemAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    const systemAccounts = [
      {
        code: SYSTEM_ACCOUNTS.STRIPE_TREASURY,
        name: "Stripe Treasury",
        accountType: "equity" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.PARENT_DEPOSIT,
        name: "Parent Deposits",
        accountType: "equity" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.CHORE_POOL,
        name: "Chore Pool",
        accountType: "equity" as const,
        category: "system_internal" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.LOAN_POOL,
        name: "Loan Pool",
        accountType: "equity" as const,
        category: "system_internal" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.CARD_PURCHASES,
        name: "Card Purchases",
        accountType: "expense" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.REFUND_SOURCE,
        name: "Refund Source",
        accountType: "equity" as const,
        category: "system_external" as const,
      },
      {
        code: SYSTEM_ACCOUNTS.SUSPENSE,
        name: "Suspense",
        accountType: "equity" as const,
        category: "system_suspense" as const,
      },
    ];

    const now = Date.now();
    let created = 0;

    for (const acct of systemAccounts) {
      const existing = await ctx.db
        .query("ledgerAccounts")
        .withIndex("by_code", (q) => q.eq("code", acct.code))
        .unique();

      if (!existing) {
        await ctx.db.insert("ledgerAccounts", {
          code: acct.code,
          name: acct.name,
          accountType: acct.accountType,
          category: acct.category,
          cachedBalance: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return { created, total: systemAccounts.length };
  },
});

// Query: get ledger account balance
export const getAccountBalance = query({
  args: { ledgerAccountId: v.id("ledgerAccounts") },
  handler: async (ctx, { ledgerAccountId }) => {
    const account = await ctx.db.get(ledgerAccountId);
    if (!account) return null;
    return {
      code: account.code,
      balance: account.cachedBalance,
      accountType: account.accountType,
    };
  },
});
