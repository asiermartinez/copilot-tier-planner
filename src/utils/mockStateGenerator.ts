/**
 * Mock State Generator
 *
 * Utilities to generate UserState objects from SKU definitions,
 * eliminating hardcoded values and ensuring consistency with SKU data.
 */

import type {
  UserState,
  ResourceUsage,
  OverageBudget,
} from "@/types/userState";
import type { SkuId, Sku } from "@/types/sku";
import { getSkuById } from "@/data/skus";
import { getOveragePricePerRequest } from "@/utils/skuHelpers";

import {
  DEFAULT_ALERT_THRESHOLDS,
  getLastCrossedThreshold,
} from "@/data/alertThresholds";

interface UsageOverrides {
  premiumRequests?: number;
  chatMessages?: number;
  codeCompletions?: number;
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
  alertThresholds?: number[];
}

interface GenerateUserStateOptions {
  id: string;
  timestamp: string;
  skuId: SkuId;
  /** Optional pre-merged SKU (for variations) - if not provided, will fetch from SKU_MAP */
  sku?: Sku;
  account: AccountInfo;
  billing: BillingInfo;
  billingPeriod: BillingPeriodInfo;
  usage: UsageOverrides;
  overageBudget?: OverageBudgetConfig | null;
  metadata?: Record<string, unknown>;
}

/**
 * Calculate percentage used
 */
function calculateUsageMetrics(
  current: number,
  limit: number | null
): {
  percentageUsed: number;
} {
  if (limit === null || limit === 0) {
    return {
      percentageUsed: 0,
    };
  }

  const percentageUsed = Math.round((current / limit) * 100 * 10) / 10;

  return { percentageUsed };
}

/**
 * Calculate overage amount and cost
 */
function calculateOverage(
  current: number,
  limit: number | null,
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
 * Generate a ResourceUsage object from SKU data and current usage
 */
function generateResourceUsage(
  resourceType: "premiumRequests" | "chatMessages" | "codeCompletions",
  current: number,
  limit: number | null,
  pricePerUnit: number | null,
  blockOnOverage: boolean,
  overageBudget: {
    maxBudgetUsd: number;
    currentSpentUsd: number;
  } | null = null,
  quotaAlertThresholds: number[] | null = [50, 75, 90, 100]
): ResourceUsage {
  const effectiveLimit = limit;

  const { percentageUsed } = calculateUsageMetrics(current, effectiveLimit);

  const { overage, overageCostUsd } = calculateOverage(
    current,
    effectiveLimit,
    pricePerUnit
  );

  // Calculate last crossed threshold (null if no limit or no thresholds)
  const alertThresholds = effectiveLimit === null ? null : quotaAlertThresholds;
  const lastCrossedThreshold =
    alertThresholds !== null
      ? getLastCrossedThreshold(percentageUsed, alertThresholds)
      : null;

  const isOverQuota = effectiveLimit !== null && current > effectiveLimit;
  const isAtLimit = effectiveLimit !== null && current >= effectiveLimit;

  // Determine if usage should be blocked
  let isBlocked = false;

  if (isAtLimit) {
    if (blockOnOverage) {
      // SKU doesn't allow overages at all (e.g., FREE plan)
      isBlocked = true;
    } else if (overageBudget === null) {
      // SKU allows overages but user hasn't enabled overage budget - block at limit
      isBlocked = true;
    } else {
      // SKU allows overages and user has enabled overage budget
      if (overageBudget.currentSpentUsd >= overageBudget.maxBudgetUsd) {
        isBlocked = true;
      }
      // Otherwise, billing continues (not blocked)
    }
  }

  const usage: ResourceUsage = {
    current,
    limit: effectiveLimit,
    overage,
    overageCostUsd,
    percentageUsed,
    isOverQuota,
    isBlocked,
    alertThresholds,
    lastCrossedThreshold,
  };

  return usage;
}

/**
 * Generate an OverageBudget object from configuration
 */
function generateOverageBudget(
  config: OverageBudgetConfig,
  currentOverageSpent: number,
  skuId: SkuId
): OverageBudget {
  const maxBudgetUsd = config.maxBudgetUsd ?? 100;
  const remainingBudgetUsd = Math.max(0, maxBudgetUsd - currentOverageSpent);
  const percentageConsumed =
    Math.round((currentOverageSpent / maxBudgetUsd) * 100 * 10) / 10;
  const isBudgetConsumed = currentOverageSpent >= maxBudgetUsd;

  // Calculate overage requests remaining based on pricing
  const pricePerOverageRequest = getOveragePricePerRequest(skuId);
  const overageRequestsRemaining =
    pricePerOverageRequest && remainingBudgetUsd > 0
      ? Math.floor(remainingBudgetUsd / pricePerOverageRequest)
      : 0;

  const alertThresholds = config.alertThresholds ?? DEFAULT_ALERT_THRESHOLDS;
  const lastCrossedThreshold = getLastCrossedThreshold(
    percentageConsumed,
    alertThresholds
  );

  return {
    maxBudgetUsd,
    currentSpentUsd: currentOverageSpent,
    remainingBudgetUsd,
    percentageConsumed,
    isBudgetConsumed,
    overageRequestsRemaining,
    alertThresholds,
    lastCrossedThreshold,
  };
}

/**
 * Generate a complete UserState from SKU data and scenario-specific overrides
 */
export function generateUserState(
  options: GenerateUserStateOptions
): UserState {
  // Use provided SKU (with variations) or fetch base SKU
  const sku = options.sku || getSkuById(options.skuId) || getSkuById("free")!;

  const premiumRequestsCurrent = options.usage.premiumRequests ?? 0;
  const chatMessagesCurrent = options.usage.chatMessages ?? 0;
  const codeCompletionsCurrent = options.usage.codeCompletions ?? 0;

  // First, calculate overage costs to determine budget state
  const tempPremiumRequestsUsage = generateResourceUsage(
    "premiumRequests",
    premiumRequestsCurrent,
    sku.limits.premiumRequestsPerMonth,
    sku.limits.premiumRequestsOveragePolicy?.pricePerUnit ?? null,
    sku.limits.premiumRequestsOveragePolicy?.behavior === "block",
    null,
    DEFAULT_ALERT_THRESHOLDS
  );

  const tempChatMessagesUsage = generateResourceUsage(
    "chatMessages",
    chatMessagesCurrent,
    sku.limits.chatMessagesPerMonth,
    sku.limits.chatMessagesOveragePolicy?.pricePerUnit ?? null,
    sku.limits.chatMessagesOveragePolicy?.behavior === "block",
    null,
    DEFAULT_ALERT_THRESHOLDS
  );

  const tempCodeCompletionsUsage = generateResourceUsage(
    "codeCompletions",
    codeCompletionsCurrent,
    sku.limits.codeCompletionsPerMonth,
    sku.limits.codeCompletionsOveragePolicy?.pricePerUnit ?? null,
    sku.limits.codeCompletionsOveragePolicy?.behavior === "block",
    null,
    DEFAULT_ALERT_THRESHOLDS
  );

  const totalOverageCost =
    tempPremiumRequestsUsage.overageCostUsd +
    tempChatMessagesUsage.overageCostUsd +
    tempCodeCompletionsUsage.overageCostUsd;

  const overageBudget =
    options.overageBudget !== null && options.overageBudget !== undefined
      ? generateOverageBudget(
          options.overageBudget,
          totalOverageCost,
          options.skuId
        )
      : null;

  // Now generate the final usage objects with budget information
  const budgetInfo = overageBudget
    ? {
        maxBudgetUsd: overageBudget.maxBudgetUsd,
        currentSpentUsd: overageBudget.currentSpentUsd,
      }
    : null;

  const premiumRequestsUsage = generateResourceUsage(
    "premiumRequests",
    premiumRequestsCurrent,
    sku.limits.premiumRequestsPerMonth,
    sku.limits.premiumRequestsOveragePolicy?.pricePerUnit ?? null,
    sku.limits.premiumRequestsOveragePolicy?.behavior === "block",
    budgetInfo,
    DEFAULT_ALERT_THRESHOLDS
  );

  const chatMessagesUsage = generateResourceUsage(
    "chatMessages",
    chatMessagesCurrent,
    sku.limits.chatMessagesPerMonth,
    sku.limits.chatMessagesOveragePolicy?.pricePerUnit ?? null,
    sku.limits.chatMessagesOveragePolicy?.behavior === "block",
    null,
    DEFAULT_ALERT_THRESHOLDS
  );

  const codeCompletionsUsage = generateResourceUsage(
    "codeCompletions",
    codeCompletionsCurrent,
    sku.limits.codeCompletionsPerMonth,
    sku.limits.codeCompletionsOveragePolicy?.pricePerUnit ?? null,
    sku.limits.codeCompletionsOveragePolicy?.behavior === "block",
    null,
    DEFAULT_ALERT_THRESHOLDS
  );

  const baseSubscriptionUsd = sku.pricing.perSeat
    ? sku.pricing.monthlyUsd * (options.account.seats ?? 1)
    : options.billing.billingFrequency === "annual"
      ? (sku.pricing.annualUsd ?? sku.pricing.monthlyUsd * 12)
      : sku.pricing.monthlyUsd;

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
            (totalOverageCost / daysElapsed) * daysInPeriod) *
            100
        ) / 100
      : baseSubscriptionUsd;

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
      totalCostUsd: baseSubscriptionUsd + totalOverageCost,
      projectedTotalUsd,
    },
    metadata: options.metadata,
  };

  return userState;
}
