import Stripe from "stripe";

/**
 * Shared Stripe client with explicit configuration.
 *
 * API Version: 2025-02-24.acacia (keeping current version for stability)
 * Note: Consider upgrading to 2025-12-15.clover after testing
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

/**
 * Amount conversion utilities.
 * Stripe amounts are always in the smallest currency unit (cents for USD).
 * Our database stores amounts in cents to maintain precision.
 */
export const amounts = {
  /**
   * Convert cents to dollars for display purposes
   */
  centsToDollars: (cents: number): number => cents / 100,

  /**
   * Convert dollars to cents for Stripe API calls
   */
  dollarsToCents: (dollars: number): number => Math.round(dollars * 100),

  /**
   * Format cents as a dollar string (e.g., "$12.50")
   */
  formatCents: (cents: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  },
};

/**
 * Type-safe webhook event handler signature
 */
export type StripeWebhookHandler<T extends Stripe.Event.Type> = (
  event: Stripe.Event & { type: T }
) => Promise<void>;

/**
 * Stripe webhook endpoint secret for signature verification
 */
export const getWebhookSecret = () => process.env.STRIPE_WEBHOOK_SECRET!;
