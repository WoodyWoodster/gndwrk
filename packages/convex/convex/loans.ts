import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all loans for a family
export const getFamilyLoans = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .order("desc")
      .collect();

    // Get borrower names
    const borrowerIds = [...new Set(loans.map((l) => l.borrowerId))];
    const borrowers = await Promise.all(borrowerIds.map((id) => ctx.db.get(id)));
    const borrowerMap = new Map(borrowers.map((u) => [u?._id, u]));

    return loans.map((loan) => ({
      ...loan,
      principal: loan.principal / 100,
      weeklyPayment: loan.weeklyPayment / 100,
      remainingBalance: loan.remainingBalance / 100,
      borrowerName: borrowerMap.get(loan.borrowerId)?.firstName ?? "Unknown",
    }));
  },
});

// Get active loans for a family
export const getActiveLoans = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, { familyId }) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return loans.map((loan) => ({
      ...loan,
      principal: loan.principal / 100,
      weeklyPayment: loan.weeklyPayment / 100,
      remainingBalance: loan.remainingBalance / 100,
    }));
  },
});

// Get loans for current user (kid view)
export const getMyLoans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", user._id))
      .order("desc")
      .collect();

    return loans.map((loan) => ({
      ...loan,
      principal: loan.principal / 100,
      weeklyPayment: loan.weeklyPayment / 100,
      remainingBalance: loan.remainingBalance / 100,
    }));
  },
});

// Request a loan (kid only)
export const request = mutation({
  args: {
    amount: v.number(), // In dollars
    purpose: v.string(),
    termWeeks: v.number(),
  },
  handler: async (ctx, { amount, purpose, termWeeks }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "kid" || !user.familyId) {
      throw new Error("Not authorized");
    }

    const amountCents = Math.round(amount * 100);

    // Get family to find owner (parent)
    const family = await ctx.db.get(user.familyId);
    if (!family) throw new Error("Family not found");

    // Calculate weekly payment (simple calculation, no interest for now)
    const weeklyPayment = Math.ceil(amountCents / termWeeks);

    const loanId = await ctx.db.insert("loans", {
      familyId: user.familyId,
      lenderId: family.ownerId,
      borrowerId: user._id,
      principal: amountCents,
      interestRate: 0, // Parent can set this on approval
      termWeeks,
      weeklyPayment,
      purpose,
      status: "pending",
      remainingBalance: amountCents,
      gracePeriodDays: 3,
      createdAt: Date.now(),
    });

    return loanId;
  },
});

// Approve a loan (parent only)
export const approve = mutation({
  args: {
    loanId: v.id("loans"),
    interestRate: v.optional(v.number()), // Annual rate
  },
  handler: async (ctx, { loanId, interestRate = 0 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const loan = await ctx.db.get(loanId);
    if (!loan || loan.lenderId !== user._id) {
      throw new Error("Loan not found");
    }

    if (loan.status !== "pending") {
      throw new Error("Loan is not pending");
    }

    // Recalculate with interest if provided
    let totalAmount = loan.principal;
    if (interestRate > 0) {
      const weeklyRate = interestRate / 100 / 52;
      totalAmount = Math.round(
        loan.principal * Math.pow(1 + weeklyRate, loan.termWeeks)
      );
    }
    const weeklyPayment = Math.ceil(totalAmount / loan.termWeeks);

    // Update loan
    const now = Date.now();
    await ctx.db.patch(loanId, {
      status: "active",
      interestRate,
      weeklyPayment,
      remainingBalance: totalAmount,
      approvedAt: now,
      nextPaymentDate: now + 7 * 24 * 60 * 60 * 1000, // 1 week from now
    });

    // Transfer money to kid's spend account
    const kidSpendAccount = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", loan.borrowerId).eq("type", "spend")
      )
      .unique();

    // Parallelize independent operations
    const operations: Promise<unknown>[] = [
      // Create first scheduled payment
      ctx.db.insert("loanPayments", {
        loanId,
        userId: loan.borrowerId,
        amount: weeklyPayment,
        principal: Math.round(loan.principal / loan.termWeeks),
        interest: weeklyPayment - Math.round(loan.principal / loan.termWeeks),
        dueDate: now + 7 * 24 * 60 * 60 * 1000,
        status: "scheduled",
      }),
    ];

    if (kidSpendAccount) {
      operations.push(
        ctx.db.patch(kidSpendAccount._id, {
          balance: kidSpendAccount.balance + loan.principal,
        }),
        ctx.db.insert("transactions", {
          userId: loan.borrowerId,
          accountId: kidSpendAccount._id,
          familyId: loan.familyId,
          amount: loan.principal,
          type: "credit",
          category: "Loan",
          description: `Loan: ${loan.purpose}`,
          loanId: loanId,
          status: "completed",
          createdAt: now,
        })
      );
    }

    await Promise.all(operations);

    return { success: true };
  },
});

// Reject a loan (parent only)
export const reject = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.role !== "parent") {
      throw new Error("Not authorized");
    }

    const loan = await ctx.db.get(loanId);
    if (!loan || loan.lenderId !== user._id) {
      throw new Error("Loan not found");
    }

    // Delete the loan request
    await ctx.db.delete(loanId);

    return { success: true };
  },
});

// Make a loan payment
export const makePayment = mutation({
  args: {
    loanId: v.id("loans"),
    amount: v.optional(v.number()), // If not specified, uses scheduled amount
  },
  handler: async (ctx, { loanId, amount }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const loan = await ctx.db.get(loanId);
    if (!loan || loan.borrowerId !== user._id) {
      throw new Error("Loan not found");
    }

    if (loan.status !== "active") {
      throw new Error("Loan is not active");
    }

    const paymentAmount = amount ? Math.round(amount * 100) : loan.weeklyPayment;

    // Get kid's spend account
    const spendAccount = await ctx.db
      .query("accounts")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", user._id).eq("type", "spend")
      )
      .unique();

    if (!spendAccount || spendAccount.balance < paymentAmount) {
      throw new Error("Insufficient funds");
    }

    const now = Date.now();
    const newBalance = loan.remainingBalance - paymentAmount;

    // Build transaction record (used in both branches)
    const transactionInsert = ctx.db.insert("transactions", {
      userId: user._id,
      accountId: spendAccount._id,
      familyId: loan.familyId,
      amount: -paymentAmount,
      type: "debit",
      category: "Loan Payment",
      description: `Payment: ${loan.purpose}`,
      loanId: loanId,
      status: "completed",
      createdAt: now,
    });

    // Update loan and related records
    if (newBalance <= 0) {
      // Loan fully paid - parallelize all independent operations
      await Promise.all([
        ctx.db.patch(spendAccount._id, {
          balance: spendAccount.balance - paymentAmount,
        }),
        ctx.db.patch(loanId, {
          status: "paid",
          remainingBalance: 0,
          paidOffAt: now,
        }),
        ctx.db.insert("trustScoreEvents", {
          userId: user._id,
          familyId: loan.familyId,
          event: `Paid off loan: ${loan.purpose}`,
          eventType: newBalance < 0 ? "loan_paid_early" : "loan_payment_on_time",
          points: newBalance < 0 ? 15 : 10,
          createdAt: now,
        }),
        ctx.db.patch(user._id, {
          loansRepaid: (user.loansRepaid ?? 0) + 1,
        }),
        transactionInsert,
      ]);
    } else {
      // Check if payment is on time (need this before inserting trust event)
      const scheduledPayment = await ctx.db
        .query("loanPayments")
        .withIndex("by_loan", (q) => q.eq("loanId", loanId))
        .filter((q) => q.eq(q.field("status"), "scheduled"))
        .first();

      const onTime = scheduledPayment ? now <= scheduledPayment.dueDate : true;

      // Parallelize remaining operations
      await Promise.all([
        ctx.db.patch(spendAccount._id, {
          balance: spendAccount.balance - paymentAmount,
        }),
        ctx.db.patch(loanId, {
          remainingBalance: newBalance,
          nextPaymentDate: now + 7 * 24 * 60 * 60 * 1000,
        }),
        ctx.db.insert("trustScoreEvents", {
          userId: user._id,
          familyId: loan.familyId,
          event: `Loan payment: ${loan.purpose}`,
          eventType: onTime ? "loan_payment_on_time" : "loan_payment_late",
          points: onTime ? 5 : -10,
          createdAt: now,
        }),
        transactionInsert,
      ]);
    }

    return { success: true, remaining: newBalance / 100 };
  },
});
