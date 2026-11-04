import type { UserState, SimpleUserState } from "@/types/userState";
import type { Sku } from "@/types/sku";
import type { SkuVariation } from "@/types/scenario";
import { getSkuById } from "@/data/skus";
import { generateUserState } from "@/utils/mockStateGenerator";
import { DEFAULT_ALERT_THRESHOLDS } from "@/data/alertThresholds";

/**
 * Default simple state (FREE individual user, no usage)
 */
export function getDefaultSimpleState(): SimpleUserState {
  const now = new Date();
  const currentDay = now.getDate();

  return {
    skuId: "free",
    accountType: "individual",
    premiumRequestsUsed: 0,
    chatMessagesUsed: 0,
    codeCompletionsUsed: 0,
    overageBudgetUsd: null,
    daysIntoPeriod: currentDay,
    currentTimestamp: now.toISOString(),
  };
}

/**
 * State for the first render only.
 *
 * The page is prerendered at build time, so the first client render has to
 * match it exactly. This uses a fixed date instead of the clock, and
 * PlannerProvider loads the real state right after hydration. The mid-month
 * midday timestamp keeps the billing calculations the same in every time zone.
 */
export function getFirstRenderSimpleState(): SimpleUserState {
  return {
    ...getDefaultSimpleState(),
    daysIntoPeriod: 14,
    currentTimestamp: "2025-12-15T12:00:00.000Z",
  };
}

/**
 * Generate full UserState from SimpleUserState
 */
export function generateStateFromSimple(
  simple: SimpleUserState,
  skuVariation?: SkuVariation,
  customSkus?: Sku[]
): UserState {
  const accountType = simple.accountType;

  // Get base SKU from built-in SKUs or custom SKUs
  let baseSku: Sku | undefined = getSkuById(simple.skuId);

  // If not found in built-in SKUs, check custom SKUs
  if (!baseSku && customSkus) {
    baseSku = customSkus.find(sku => sku.id === simple.skuId);
  }

  // If still not found, default to FREE plan (guaranteed to exist in built-in SKUs)
  if (!baseSku) {
    // Silently default to FREE - custom SKUs may not be loaded yet during state transitions
    baseSku = getSkuById("free")!;
  }

  const sku: Sku = {
    ...baseSku,
    ...(skuVariation || {}),
    pricing: skuVariation?.pricing
      ? { ...baseSku.pricing, ...skuVariation.pricing }
      : baseSku.pricing,
    limits: skuVariation?.limits
      ? { ...baseSku.limits, ...skuVariation.limits }
      : baseSku.limits,
  };

  const allowsOverageBudget =
    sku.limits.premiumRequestsOveragePolicy?.allowBudgetCap ?? false;

  // Use fixed timestamp if available, otherwise create new one
  const now = simple.currentTimestamp
    ? new Date(simple.currentTimestamp)
    : new Date();

  // Calculate billing dates based on days into period
  const daysIntoPeriod = simple.daysIntoPeriod ?? now.getDate();

  // Calculate billing start by subtracting days into period from today
  // Use timestamp arithmetic to avoid month boundary issues
  const billingStart = new Date(
    now.getTime() - daysIntoPeriod * 24 * 60 * 60 * 1000
  );
  billingStart.setHours(0, 0, 0, 0);

  // Calculate billing end (exactly one month from billing start)
  const billingEnd = new Date(billingStart);
  billingEnd.setMonth(billingEnd.getMonth() + 1);
  billingEnd.setHours(0, 0, 0, 0);

  // Calculate total days in period
  const totalDays = Math.round(
    (billingEnd.getTime() - billingStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, totalDays - daysIntoPeriod);

  return generateUserState({
    id: `state-${Date.now()}`,
    timestamp: new Date().toISOString(), // Always use current time for timestamp
    skuId: simple.skuId,
    sku, // Pass merged SKU with variations
    account: {
      userId: "user-playground",
      username: "playground-user",
      accountType,
      email: "user@example.com",
      organizationName:
        accountType === "organization" || accountType === "enterprise"
          ? "Example Org"
          : undefined,
      seats: simple.seats ?? (accountType === "individual" ? undefined : 10),
    },
    billing: {
      startDate: billingStart.toISOString(),
      status: "active",
      billingFrequency: "monthly",
      autoRenew: true,
      nextRenewalDate: billingEnd.toISOString(),
    },
    billingPeriod: {
      startDate: billingStart.toISOString(),
      endDate: billingEnd.toISOString(),
      daysRemaining,
    },
    usage: {
      premiumRequests: simple.premiumRequestsUsed,
      chatMessages: simple.chatMessagesUsed ?? 0,
      codeCompletions: simple.codeCompletionsUsed ?? 0,
    },
    overageBudget:
      allowsOverageBudget &&
      simple.overageBudgetUsd !== null &&
      simple.overageBudgetUsd !== undefined
        ? {
            maxBudgetUsd: simple.overageBudgetUsd,
            alertThresholds: DEFAULT_ALERT_THRESHOLDS,
          }
        : null,
  });
}

/**
 * Convert UserState to SimpleUserState for URL encoding
 */
export function toSimpleState(state: UserState): SimpleUserState {
  const simpleState: SimpleUserState = {
    skuId: state.subscription.skuId,
    accountType: state.account.accountType,
    premiumRequestsUsed: state.usage.premiumRequests.current,
    chatMessagesUsed: state.usage.chatMessages.current,
    codeCompletionsUsed: state.usage.codeCompletions.current,
    overageBudgetUsd: state.overageBudget?.maxBudgetUsd ?? null,
    daysIntoPeriod:
      state.billingPeriod.daysInPeriod - state.billingPeriod.daysRemaining,
    currentTimestamp: state.timestamp,
  };

  // Only include seats for organization and enterprise accounts
  if (state.account.accountType !== "individual" && state.account.seats) {
    simpleState.seats = state.account.seats;
  }

  return simpleState;
}
