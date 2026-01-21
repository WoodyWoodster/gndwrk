export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    priceLookupKey: null,
    maxKids: 1,
    features: [
      "1 child account",
      "2 buckets (Spend & Save)",
      "1 debit card ($5 shipping)",
      "Basic chore tracking",
      "Basic Trust Score",
      "Parent dashboard",
    ],
  },
  family: {
    id: "family",
    name: "Family",
    price: 799,
    priceLookupKey: "family_monthly",
    maxKids: 5,
    features: [
      "Up to 5 kids",
      "All 4 buckets",
      "Debit cards included",
      "AI Money Coach",
      "Full Trust Score",
      "Kid loans",
      "Advanced chores",
    ],
  },
  familyplus: {
    id: "familyplus",
    name: "Family+",
    price: 1299,
    priceLookupKey: "familyplus_monthly",
    maxKids: -1, // unlimited
    features: [
      "Unlimited kids",
      "Everything in Family",
      "Investment simulation",
      "Premium card designs",
      "Priority support",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

/**
 * Format price in cents as a display string
 */
export function formatPlanPrice(priceInCents: number): string {
  if (priceInCents === 0) return "Free";
  return `$${(priceInCents / 100).toFixed(2)}`;
}

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

/**
 * Subscription status types
 */
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete";

/**
 * Subscription tier types (matches PlanId)
 */
export type SubscriptionTier = PlanId;
