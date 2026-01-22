/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as ai from "../ai.js";
import type * as chores from "../chores.js";
import type * as families from "../families.js";
import type * as loans from "../loans.js";
import type * as onboarding from "../onboarding.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as stripe from "../stripe.js";
import type * as transactions from "../transactions.js";
import type * as trustScore from "../trustScore.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  ai: typeof ai;
  chores: typeof chores;
  families: typeof families;
  loans: typeof loans;
  onboarding: typeof onboarding;
  savingsGoals: typeof savingsGoals;
  stripe: typeof stripe;
  transactions: typeof transactions;
  trustScore: typeof trustScore;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
