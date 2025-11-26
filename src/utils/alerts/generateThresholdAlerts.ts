/**
 * Threshold-Based Alert Generation
 *
 * Generates alerts based on user-configurable thresholds.
 * This replaces the hardcoded alert logic with a flexible, threshold-driven system.
 */

import type { UserState } from "@/types/userState";
import type {
  ThresholdConfig,
  ThresholdsConfig,
  ThresholdTemplateContext,
  ThresholdSeverity,
  ThresholdMetric,
} from "@/types/thresholds";
import { SKU_MAP, getSkuById } from "@/data/skus";
import { replaceTemplate } from "@/utils/messages/templateUtils";

/**
 * Alert to be displayed to the user
 */
export interface ThresholdAlert {
  /** Unique identifier for this alert */
  id: string;
  /** Alert severity level (Primer Banner variant) */
  severity: ThresholdSeverity;
  /** Alert message */
  message: string;
  /** Priority for ordering (higher = show first) */
  priority: number;
  /** The threshold that triggered this alert */
  triggeredBy: ThresholdConfig;
  /** Whether the banner can be dismissed */
  dismissable: boolean;
  /** Static template context (for static banners) */
  staticContext?: ThresholdTemplateContext;
  /** CTA button configuration */
  cta?: {
    label: string;
  };
}

/**
 * Storage for static banner states
 * Maps threshold ID to the frozen template context when it was first triggered
 */
const staticBannerStates = new Map<string, ThresholdTemplateContext>();

/**
 * Calculate priority based on metric type and percentage
 * Severity is just a visual choice and doesn't affect priority
 */
function calculatePriority(
  metricType: ThresholdMetric,
  percentage: number
): number {
  // Overage is more urgent than quota (you're spending real money)
  const basePriority = {
    overage: 1000, // Most urgent - spending money beyond quota
    both: 500, // Medium priority - could be either
    quota: 0, // Base priority - just usage limits
  }[metricType];

  // Add percentage - higher percentage = higher priority
  return basePriority + percentage;
}

/**
 * Build template context from user state
 */
function buildTemplateContext(userState: UserState): ThresholdTemplateContext {
  const { premiumRequests } = userState.usage;
  const { overageBudget } = userState;
  const sku = SKU_MAP[userState.subscription.skuId];

  // Quota-related values
  const current = premiumRequests.current;
  const limit = premiumRequests.limit;
  const percentage = premiumRequests.percentageUsed ?? 0;
  const remaining = limit ? Math.max(0, limit - current) : 0;
  const overage = premiumRequests.overage;

  // Get overage requests remaining from budget (already calculated in state)
  const overageRemaining = overageBudget?.overageRequestsRemaining ?? 0;

  // Budget-related values (rounded to 2 decimal places to avoid floating point issues)
  const budget = Math.round((overageBudget?.maxBudgetUsd ?? 0) * 100) / 100;
  const budgetUsed =
    Math.round((overageBudget?.currentSpentUsd ?? 0) * 100) / 100;
  const budgetRemaining =
    Math.round((overageBudget?.remainingBudgetUsd ?? 0) * 100) / 100;
  const budgetPercentage = overageBudget?.percentageConsumed ?? 0;

  // Plan-related values
  const planName = sku.name;

  // Determine next plan in upgrade path
  let nextPlan = "";
  const currentSkuId = userState.subscription.skuId;

  // Define upgrade paths using SKU_MAP for full display names
  if (currentSkuId === "free") {
    nextPlan = SKU_MAP.pro.name;
  } else if (currentSkuId === "pro") {
    nextPlan = SKU_MAP["pro-plus"].name;
  } else if (currentSkuId === "pro-plus") {
    nextPlan = SKU_MAP.business.name;
  } else if (currentSkuId === "business") {
    nextPlan = SKU_MAP.enterprise.name;
  } else if (currentSkuId === "enterprise") {
    nextPlan = ""; // Already at highest tier
  }

  // Time-related values
  const daysRemaining = userState.billingPeriod.daysRemaining;
  const daysInPeriod = userState.billingPeriod.daysInPeriod;

  return {
    current,
    limit: limit ?? 0,
    percentage: Math.round(percentage),
    remaining,
    overage,
    overageRemaining,
    budget,
    budgetUsed,
    budgetRemaining,
    budgetPercentage: Math.round(budgetPercentage),
    planName,
    nextPlan: nextPlan ?? "",
    daysRemaining,
    daysInPeriod,
  };
}

/**
 * Check if a threshold is triggered for the quota metric
 */
function isQuotaThresholdTriggered(
  threshold: ThresholdConfig,
  userState: UserState
): boolean {
  const { premiumRequests } = userState.usage;
  const percentageUsed = premiumRequests.percentageUsed ?? 0;

  return percentageUsed >= threshold.percentage;
}

/**
 * Check if a threshold is triggered for the overage budget metric
 */
function isOverageThresholdTriggered(
  threshold: ThresholdConfig,
  userState: UserState
): boolean {
  const { overageBudget } = userState;

  // No overage budget configured
  if (!overageBudget) {
    return false;
  }

  const percentageConsumed = overageBudget.percentageConsumed;
  return percentageConsumed >= threshold.percentage;
}

/**
 * Check if a threshold is triggered
 */
function isThresholdTriggered(
  threshold: ThresholdConfig,
  userState: UserState
): boolean {
  if (!threshold.enabled) {
    return false;
  }

  // Get SKU to check plan filter
  const sku = getSkuById(userState.subscription.skuId);
  const skuId = userState.subscription.skuId;
  const allowsOverageBudget =
    sku.limits.premiumRequestsOveragePolicy?.allowBudgetCap ?? false;

  // Check plan filter
  if (threshold.planFilter) {
    switch (threshold.planFilter) {
      case "free-only":
        if (skuId !== "free") {
          return false;
        }
        break;
      case "paid-only":
        if (skuId === "free") {
          return false;
        }
        break;
      case "all":
      default:
        // No filter, applies to all plans
        break;
    }
  }

  // If threshold applies to overage, automatically filter to overage-capable plans
  if (
    (threshold.appliesTo === "overage" || threshold.appliesTo === "both") &&
    !allowsOverageBudget
  ) {
    return false;
  }

  // Special case: Don't show "quota exceeded no budget" threshold if user HAS overage budget
  if (
    threshold.id === "quota-exceeded-no-budget" &&
    userState.overageBudget !== null
  ) {
    return false;
  }

  // Special case: Don't show "quota reached with budget" threshold if user has NO overage budget
  if (
    threshold.id === "quota-reached-with-budget" &&
    userState.overageBudget === null
  ) {
    return false;
  }

  // Special case: Don't show quota thresholds when user has exceeded quota and has overage budget
  // They should only see overage budget thresholds at that point
  if (
    threshold.appliesTo === "quota" &&
    userState.overageBudget !== null &&
    userState.usage.premiumRequests.percentageUsed !== null &&
    userState.usage.premiumRequests.percentageUsed > 100
  ) {
    // Allow the "quota-reached-with-budget" info message to show at exactly 100%
    if (threshold.id !== "quota-reached-with-budget") {
      return false;
    }
  }

  switch (threshold.appliesTo) {
    case "quota":
      return isQuotaThresholdTriggered(threshold, userState);
    case "overage":
      return isOverageThresholdTriggered(threshold, userState);
    case "both":
      return (
        isQuotaThresholdTriggered(threshold, userState) ||
        isOverageThresholdTriggered(threshold, userState)
      );
    default:
      return false;
  }
}

/**
 * Generate alerts based on configurable thresholds
 */
export function generateThresholdAlerts(
  userState: UserState,
  thresholdsConfig: ThresholdsConfig
): ThresholdAlert[] {
  const context = buildTemplateContext(userState);
  const alerts: ThresholdAlert[] = [];

  // Check each threshold
  for (const threshold of thresholdsConfig.thresholds) {
    const isTriggered = isThresholdTriggered(threshold, userState);

    if (isTriggered) {
      // For static banners, freeze the context when first triggered
      if (threshold.static && !staticBannerStates.has(threshold.id)) {
        staticBannerStates.set(threshold.id, { ...context });
      }

      // Use static context if available, otherwise use current context
      const messageContext =
        threshold.static && staticBannerStates.has(threshold.id)
          ? staticBannerStates.get(threshold.id)!
          : context;

      // Replace template variables in message
      const message =
        threshold.message.trim() ||
        `${threshold.percentage}% threshold reached`;

      const processedMessage = replaceTemplate(message, messageContext);

      // Process CTA label if present
      const processedCta = threshold.cta
        ? {
            label: replaceTemplate(threshold.cta.label, messageContext),
          }
        : undefined;

      // Calculate priority based on threshold's configured percentage
      // This ensures higher thresholds always have higher priority
      alerts.push({
        id: threshold.id,
        severity: threshold.severity,
        message: processedMessage,
        priority: calculatePriority(threshold.appliesTo, threshold.percentage),
        triggeredBy: threshold,
        dismissable: threshold.dismissable,
        staticContext: threshold.static ? messageContext : undefined,
        cta: processedCta,
      });
    } else {
      // Clear static state when threshold is no longer triggered
      if (staticBannerStates.has(threshold.id)) {
        staticBannerStates.delete(threshold.id);
      }
    }
  }

  // Sort by priority (highest first)
  alerts.sort((a, b) => b.priority - a.priority);

  return alerts;
}

/**
 * Get the highest priority alert (for displaying a single alert)
 */
export function getHighestPriorityAlert(
  userState: UserState,
  thresholdsConfig: ThresholdsConfig
): ThresholdAlert | null {
  const alerts = generateThresholdAlerts(userState, thresholdsConfig);
  return alerts[0] ?? null;
}
