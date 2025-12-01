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
 * Clear all static banner states
 * Should be called when user dismisses alerts or resets thresholds
 */
export function clearStaticBannerStates(): void {
  staticBannerStates.clear();
}

/**
 * Calculate priority based on metric type and percentage
 * Severity is just a visual choice and doesn't affect priority
 */
function calculatePriority(
  metricType: ThresholdMetric,
  percentage: number,
  maxDaysIntoPeriod: number | null
): number {
  // Overage is more urgent than quota (you're spending real money)
  const basePriority = {
    overage: 1000, // Most urgent - spending money beyond quota
    both: 500, // Medium priority - could be either
    quota: 0, // Base priority - just usage limits
  }[metricType];

  // Billing period constraints make thresholds more specific
  // Lower maxDaysIntoPeriod = more specific (narrower time window) = higher priority
  // Subtract days to invert priority (fewer days = higher priority)
  const billingPeriodBonus =
    maxDaysIntoPeriod !== null ? 10000 - maxDaysIntoPeriod : 0;

  // Add percentage - higher percentage = higher priority
  return billingPeriodBonus + basePriority + percentage;
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

  // Format reset date (billing period end date) as "MMM D, YYYY"
  const resetDate = new Date(
    userState.billingPeriod.endDate
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
    resetDate,
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

  // Special case: 0% overage threshold triggers when user enters overage mode
  // (i.e., when quota is exceeded and overage budget exists)
  if (threshold.percentage === 0) {
    const quotaPercentage = userState.usage.premiumRequests.percentageUsed ?? 0;
    return quotaPercentage >= 100;
  }

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

  // Check billing period constraint if configured
  if (threshold.billingPeriod) {
    const daysIntoPeriod =
      userState.billingPeriod.daysInPeriod -
      userState.billingPeriod.daysRemaining;
    if (daysIntoPeriod > threshold.billingPeriod.maxDaysIntoPeriod) {
      return false;
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

  // Special case: Don't show 100% quota thresholds when user has overage budget
  // This allows 0% overage thresholds to take priority when entering overage mode
  if (
    threshold.appliesTo === "quota" &&
    threshold.percentage === 100 &&
    userState.overageBudget !== null &&
    userState.usage.premiumRequests.percentageUsed !== null &&
    userState.usage.premiumRequests.percentageUsed >= 100
  ) {
    return false;
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
      // OR when static is newly enabled (no frozen state exists yet)
      // OR when the threshold percentage has changed
      const existingFrozenState = staticBannerStates.get(threshold.id);
      const shouldUpdateFrozenState =
        threshold.static &&
        (!existingFrozenState ||
          (threshold.appliesTo === "quota" &&
            existingFrozenState.percentage !== threshold.percentage) ||
          (threshold.appliesTo === "overage" &&
            existingFrozenState.budgetPercentage !== threshold.percentage) ||
          (threshold.appliesTo === "both" &&
            (existingFrozenState.percentage !== threshold.percentage ||
              existingFrozenState.budgetPercentage !== threshold.percentage)));

      if (shouldUpdateFrozenState) {
        // Create a frozen context at the threshold crossing point
        const frozenContext = { ...context };

        // Override percentage-related values to reflect the threshold point
        if (threshold.appliesTo === "quota" || threshold.appliesTo === "both") {
          frozenContext.percentage = threshold.percentage;
          // Recalculate derived values based on threshold percentage
          const limit = context.limit;
          if (limit > 0) {
            const thresholdCurrent = Math.round(
              (threshold.percentage / 100) * limit
            );
            frozenContext.current = thresholdCurrent;
            frozenContext.remaining = Math.max(0, limit - thresholdCurrent);
          }
        }

        if (
          threshold.appliesTo === "overage" ||
          threshold.appliesTo === "both"
        ) {
          frozenContext.budgetPercentage = threshold.percentage;
          // Recalculate derived budget values based on threshold percentage
          const budget = context.budget;
          if (budget > 0) {
            const thresholdBudgetUsed = (threshold.percentage / 100) * budget;
            frozenContext.budgetUsed =
              Math.round(thresholdBudgetUsed * 100) / 100;
            frozenContext.budgetRemaining =
              Math.round((budget - thresholdBudgetUsed) * 100) / 100;
          }
        }

        staticBannerStates.set(threshold.id, frozenContext);
      }

      // Clear frozen state if static was disabled
      if (!threshold.static && staticBannerStates.has(threshold.id)) {
        staticBannerStates.delete(threshold.id);
      }

      // Use static context if threshold is static and has frozen state
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
      // Billing period constraints make thresholds more specific and take priority
      alerts.push({
        id: threshold.id,
        severity: threshold.severity,
        message: processedMessage,
        priority: calculatePriority(
          threshold.appliesTo,
          threshold.percentage,
          threshold.billingPeriod?.maxDaysIntoPeriod ?? null
        ),
        triggeredBy: threshold,
        dismissable: threshold.dismissable,
        staticContext: threshold.static ? messageContext : undefined,
        cta: processedCta,
      });
    }
    // Note: We don't clear static states when threshold becomes untriggered
    // to prevent losing frozen context during rapid state changes (e.g., fast slider movement)
    // Static states are cleared explicitly via clearStaticBannerStates()
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
