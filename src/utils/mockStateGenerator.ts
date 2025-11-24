/**
 * Mock State Generator
 *
 * Utilities to generate UserState objects from SKU definitions,
 * eliminating hardcoded values and ensuring consistency with SKU data.
 */

import type {
  UserState,
  ResourceUsage,
  PremiumRequestUsage,
  OverageBudget,
} from "@/types/userState";
import type { SkuId } from "@/types/sku";
import { getSkuById } from "@/data/skus";

interface UsageOverrides {
  premiumRequests?: number;
  chatMessages?: number;
  codeCompletions?: number;
  additionalPurchasedPremiumRequests?: number;
  purchasedExpiresAt?: string | null;
}

interface AccountInfo {
  userId: string;
  username: string;
  accountType: "individual" | "organization" | "enterprise";
  email?: string;
  organizationName?: string;
  seats?: number;
}

interface BillingInfo {
  startDate: string;
  status: "active" | "trial" | "suspended" | "cancelled" | "expired";
  billingFrequency?: "monthly" | "annual";
  autoRenew?: boolean;
  nextRenewalDate?: string | null;
  trialEndsAt?: string | null;
  trialDaysRemaining?: number | null;
}

interface BillingPeriodInfo {
  startDate: string;
  endDate: string;
  isProRated?: boolean;
  daysRemaining: number;
}

interface OverageBudgetConfig {
  maxBudgetUsd?: number;
  blockWhenExceeded?: boolean;
  enableAlerts?: boolean;
  alertThresholds?: number[];
}

interface GenerateUserStateOptions {
  id: string;
  timestamp: string;
  skuId: SkuId;
  account: AccountInfo;
  billing: BillingInfo;
  billingPeriod: BillingPeriodInfo;
  usage: UsageOverrides;
  overageBudget?: OverageBudgetConfig | null;
}

/**
 * Calculate percentage used and whether warning threshold is reached
 */
function calculateUsageMetrics(
  current: number,
  limit: number | null,
  warningThreshold: number
): {
  percentageUsed: number;
  hasReachedWarning: boolean;
} {
  if (limit === null || limit === 0) {
    return {
      percentageUsed: 0,
      hasReachedWarning: false,
    };
  }

  const percentageUsed = Math.round((current / limit) * 100 * 10) / 10;
  const hasReachedWarning = percentageUsed >= warningThreshold;

  return { percentageUsed, hasReachedWarning };
}

/**
 * Calculate overage amount and cost
 */
function calculateOverage(
  current: number,
  limit: number | null,
  baseQuotaUsed: number,
  pricePerUnit: number | null
): {
  overage: number;
  overageCostUsd: number;
} {
  if (limit === null) {
    return { overage: 0, overageCostUsd: 0 };
  }

  const overage = Math.max(0, current - limit);
  const overageCostUsd =
    pricePerUnit !== null ? Math.round(overage * pricePerUnit * 100) / 100 : 0;

  return { overage, overageCostUsd };
}

/**
 * Generate a ResourceUsage or PremiumRequestUsage object from SKU data and current usage
 */
function generateResourceUsage(
  resourceType: "premiumRequests" | "chatMessages" | "codeCompletions",
  current: number,
  limit: number | null,
  warningThreshold: number,
  pricePerUnit: number | null,
  blockOnOverage: boolean,
  additionalPurchased: number = 0,
  purchasedExpiresAt: string | null = null
): ResourceUsage | PremiumRequestUsage {
  const effectiveLimit =
    limit !== null && additionalPurchased > 0
      ? limit + additionalPurchased
      : limit;

  const usedFromBaseQuota = limit !== null ? Math.min(current, limit) : current;
  const usedFromPurchased = Math.max(0, current - (limit ?? 0));

  const { percentageUsed, hasReachedWarning } = calculateUsageMetrics(
    current,
    effectiveLimit,
    warningThreshold
  );

  const { overage, overageCostUsd } = calculateOverage(
    current,
    effectiveLimit,
    usedFromBaseQuota,
    pricePerUnit
  );

  const isOverQuota = effectiveLimit !== null && current > effectiveLimit;
  const isBlocked = isOverQuota && blockOnOverage;

  if (resourceType === "premiumRequests") {
    const premiumUsage: PremiumRequestUsage = {
      current,
      limit: effectiveLimit,
      overage,
      overageCostUsd,
      percentageUsed,
      isOverQuota,
      isBlocked,
      warningThreshold,
      hasReachedWarning,
      additionalPurchased,
      purchasedExpiresAt,
      usedFromBaseQuota,
      usedFromPurchased,
    };

    if (isBlocked) {
      premiumUsage.blockReason = blockOnOverage
        ? "Quota exceeded. No overage allowed on this plan."
        : "Budget cap exceeded. Upgrade plan or increase budget to continue.";
    }

    return premiumUsage;
  }

  const usage: ResourceUsage = {
    current,
    limit: effectiveLimit,
    overage,
    overageCostUsd,
    percentageUsed,
    isOverQuota,
    isBlocked,
    warningThreshold,
    hasReachedWarning,
  };

  if (isBlocked) {
    usage.blockReason = blockOnOverage
      ? "Quota exceeded. No overage allowed on this plan."
      : "Budget cap exceeded. Upgrade plan or increase budget to continue.";
  }

  return usage;
}

/**
 * Generate an OverageBudget object from configuration
 */
function generateOverageBudget(
  config: OverageBudgetConfig,
  currentOverageSpent: number
): OverageBudget {
  const maxBudgetUsd = config.maxBudgetUsd ?? 100;
  const remainingBudgetUsd = Math.max(0, maxBudgetUsd - currentOverageSpent);
  const percentageConsumed =
    Math.round((currentOverageSpent / maxBudgetUsd) * 100 * 10) / 10;
  const isBudgetExceeded = currentOverageSpent >= maxBudgetUsd;

  const alertThresholds = config.alertThresholds ?? [50, 75, 90, 100];
  const crossedThresholds = alertThresholds.filter(
    threshold => percentageConsumed >= threshold
  );

  return {
    maxBudgetUsd,
    currentSpentUsd: currentOverageSpent,
    remainingBudgetUsd,
    percentageConsumed,
    blockWhenExceeded: config.blockWhenExceeded ?? true,
    isBudgetExceeded,
    alertThresholds,
    crossedThresholds,
    enableAlerts: config.enableAlerts ?? true,
  };
}

/**
 * Generate a complete UserState from SKU data and scenario-specific overrides
 */
export function generateUserState(
  options: GenerateUserStateOptions
): UserState {
  const sku = getSkuById(options.skuId);

  const premiumRequestsCurrent = options.usage.premiumRequests ?? 0;
  const chatMessagesCurrent = options.usage.chatMessages ?? 0;
  const codeCompletionsCurrent = options.usage.codeCompletions ?? 0;
  const additionalPurchased =
    options.usage.additionalPurchasedPremiumRequests ?? 0;

  const premiumRequestsUsage = generateResourceUsage(
    "premiumRequests",
    premiumRequestsCurrent,
    sku.limits.premiumRequestsPerMonth,
    sku.limits.premiumRequestsOveragePolicy?.warningThreshold ?? 80,
    sku.limits.premiumRequestsOveragePolicy?.pricePerUnit ?? null,
    sku.limits.premiumRequestsOveragePolicy?.behavior === "block",
    additionalPurchased,
    options.usage.purchasedExpiresAt ?? null
  ) as PremiumRequestUsage;

  const chatMessagesUsage = generateResourceUsage(
    "chatMessages",
    chatMessagesCurrent,
    sku.limits.chatMessagesPerMonth,
    sku.limits.chatMessagesOveragePolicy?.warningThreshold ?? 80,
    sku.limits.chatMessagesOveragePolicy?.pricePerUnit ?? null,
    sku.limits.chatMessagesOveragePolicy?.behavior === "block"
  );

  const codeCompletionsUsage = generateResourceUsage(
    "codeCompletions",
    codeCompletionsCurrent,
    sku.limits.codeCompletionsPerMonth,
    sku.limits.codeCompletionsOveragePolicy?.warningThreshold ?? 80,
    sku.limits.codeCompletionsOveragePolicy?.pricePerUnit ?? null,
    sku.limits.codeCompletionsOveragePolicy?.behavior === "block"
  );

  const totalOverageCost =
    premiumRequestsUsage.overageCostUsd +
    chatMessagesUsage.overageCostUsd +
    codeCompletionsUsage.overageCostUsd;

  const overageBudget =
    options.overageBudget !== null && options.overageBudget !== undefined
      ? generateOverageBudget(options.overageBudget, totalOverageCost)
      : null;

  const baseSubscriptionUsd = sku.pricing.perSeat
    ? sku.pricing.monthlyUsd * (options.account.seats ?? 1)
    : options.billing.billingFrequency === "annual"
      ? (sku.pricing.annualUsd ?? sku.pricing.monthlyUsd * 12)
      : sku.pricing.monthlyUsd;

  const additionalPurchasesUsd =
    additionalPurchased > 0
      ? Math.round(
          additionalPurchased *
            (sku.pricing.additionalPremiumRequestPrice ?? 0) *
            100
        ) / 100
      : 0;

  const daysInPeriod = Math.round(
    (new Date(options.billingPeriod.endDate).getTime() -
      new Date(options.billingPeriod.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const daysElapsed = daysInPeriod - options.billingPeriod.daysRemaining;
  const projectedTotalUsd =
    daysElapsed > 0
      ? Math.round(
          (baseSubscriptionUsd +
            additionalPurchasesUsd +
            (totalOverageCost / daysElapsed) * daysInPeriod) *
            100
        ) / 100
      : baseSubscriptionUsd + additionalPurchasesUsd;

  const userState: UserState = {
    id: options.id,
    timestamp: options.timestamp,
    version: "1.0",
    account: options.account,
    subscription: {
      skuId: options.skuId,
      startDate: options.billing.startDate,
      status: options.billing.status,
      billingFrequency: options.billing.billingFrequency ?? "monthly",
      autoRenew: options.billing.autoRenew ?? true,
      nextRenewalDate: options.billing.nextRenewalDate ?? null,
      trialEndsAt: options.billing.trialEndsAt ?? null,
      trialDaysRemaining: options.billing.trialDaysRemaining ?? null,
    },
    billingPeriod: {
      startDate: options.billingPeriod.startDate,
      endDate: options.billingPeriod.endDate,
      isProRated: options.billingPeriod.isProRated ?? false,
      daysInPeriod,
      daysRemaining: options.billingPeriod.daysRemaining,
    },
    usage: {
      premiumRequests: premiumRequestsUsage,
      chatMessages: chatMessagesUsage,
      codeCompletions: codeCompletionsUsage,
    },
    overageBudget,
    costs: {
      baseSubscriptionUsd,
      overageCostsUsd: totalOverageCost,
      additionalPurchasesUsd,
      totalCostUsd:
        baseSubscriptionUsd + totalOverageCost + additionalPurchasesUsd,
      projectedTotalUsd,
    },
  };

  return userState;
}
