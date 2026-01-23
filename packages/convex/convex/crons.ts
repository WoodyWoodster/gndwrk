import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Internal reconciliation: verify cached balances match computed balances
crons.interval(
  "internal-reconciliation",
  { hours: 1 },
  internal.reconciliation.runInternal
);

// Stripe reconciliation: compare ledger vs Stripe Treasury balances
crons.interval(
  "stripe-reconciliation",
  { hours: 6 },
  internal.reconciliation.runStripe
);

export default crons;
