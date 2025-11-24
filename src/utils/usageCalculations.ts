/**
 * Usage Calculation Utilities
 *
 * Functions for calculating quota usage, overage costs, budget tracking,
 * and decision support for plan changes.
 */

import {
  ResourceType,
  OverageCalculation,
  BudgetAllocationSummary,
  UsageDecisionPoint,
  DEFAULT_OVERAGE_COSTS,
  BlockReason,
  QuotaReset,
  UsageThreshold,
} from "@/types/usage";

/**
 * Calculate percentage of quota used
 */
export function calculateQuotaPercentage(
  currentUsage: number,
  totalQuota: number,
  isUnlimited: boolean
): number | null {
  if (isUnlimited || totalQuota === 0) {
    return null;
  }
  return Math.min(100, (currentUsage / totalQuota) * 100);
}

/**
 * Calculate overage amount
 */
export function calculateOverageAmount(
  currentUsage: number,
  totalQuota: number,
  isUnlimited: boolean
): number {
  if (isUnlimited || currentUsage <= totalQuota) {
    return 0;
  }
  return currentUsage - totalQuota;
}

/**
 * Calculate overage cost
 */
export function calculateOverageCost(
  overageAmount: number,
  costPerUnit: number | null
): number {
  if (overageAmount === 0 || costPerUnit === null) {
    return 0;
  }
  return overageAmount * costPerUnit;
}

/**
 * Calculate total quota including base and additional
 */
export function calculateTotalQuota(
  baseQuota: number,
  additionalQuota: number = 0
): number {
  return baseQuota + additionalQuota;
}

/**
 * Check if usage is over quota
 */
export function isOverQuota(
  currentUsage: number,
  totalQuota: number,
  isUnlimited: boolean
): boolean {
  if (isUnlimited) {
    return false;
  }
  return currentUsage > totalQuota;
}

/**
 * Determine if usage should be blocked
 */
export function shouldBlockUsage(
  isOverQuota: boolean,
  allowOverage: boolean,
  overageBudgetExhausted: boolean,
  maxOverageReached: boolean
): boolean {
  // Block if over quota and overage not allowed
  if (isOverQuota && !allowOverage) {
    return true;
  }

  // Block if overage budget is exhausted
  if (overageBudgetExhausted) {
    return true;
  }

  // Block if maximum overage limit is reached
  if (maxOverageReached) {
    return true;
  }

  return false;
}

/**
 * Determine the reason for blocking
 */
export function determineBlockReason(
  isOverQuota: boolean,
  allowOverage: boolean,
  overageBudgetExhausted: boolean,
  maxOverageReached: boolean
): BlockReason | null {
  if (
    !shouldBlockUsage(
      isOverQuota,
      allowOverage,
      overageBudgetExhausted,
      maxOverageReached
    )
  ) {
    return null;
  }

  if (isOverQuota && !allowOverage) {
    return BlockReason.QUOTA_EXCEEDED_NO_OVERAGE;
  }

  if (overageBudgetExhausted) {
    return BlockReason.OVERAGE_BUDGET_EXHAUSTED;
  }

  if (maxOverageReached) {
    return BlockReason.MAX_OVERAGE_REACHED;
  }

  return null;
}

/**
 * Calculate overage details for a resource
 */
export function calculateOverageDetails(
  resourceType: ResourceType,
  currentUsage: number,
  totalQuota: number,
  isUnlimited: boolean,
  costPerUnit: number | null,
  availableBudget: number,
  daysIntoPeriod: number,
  daysInPeriod: number
): OverageCalculation {
  const overageAmount = calculateOverageAmount(
    currentUsage,
    totalQuota,
    isUnlimited
  );
  const totalCost = calculateOverageCost(overageAmount, costPerUnit);
  const fitsInBudget = totalCost <= availableBudget;

  // Project overage for full billing period
  const usageRate = daysIntoPeriod > 0 ? currentUsage / daysIntoPeriod : 0;
  const projectedTotalUsage = usageRate * daysInPeriod;
  const projectedOverage = Math.max(0, projectedTotalUsage - totalQuota);
  const projectedCost = calculateOverageCost(projectedOverage, costPerUnit);

  return {
    resourceType,
    unitsOverQuota: overageAmount,
    costPerUnit: costPerUnit || 0,
    totalCost,
    fitsInBudget,
    budgetConsumed: Math.min(totalCost, availableBudget),
    projectedUnits: projectedOverage,
    projectedCost,
  };
}

/**
 * Calculate budget allocation state
 */
export function calculateBudgetAllocation(
  totalBudgetUsd: number,
  overageCalculations: OverageCalculation[],
  blockWhenExhausted: boolean
): BudgetAllocationSummary {
  const consumedUsd = overageCalculations.reduce(
    (sum, calc) => sum + calc.totalCost,
    0
  );
  const remainingUsd = Math.max(0, totalBudgetUsd - consumedUsd);
  const percentageConsumed =
    totalBudgetUsd > 0 ? (consumedUsd / totalBudgetUsd) * 100 : 0;
  const isExhausted = remainingUsd === 0;

  const breakdown = overageCalculations.map(calc => ({
    resourceType: calc.resourceType,
    allocatedUsd: calc.budgetConsumed,
    consumedUsd: calc.totalCost,
    percentageOfTotal:
      totalBudgetUsd > 0 ? (calc.totalCost / totalBudgetUsd) * 100 : 0,
  }));

  const projectedConsumptionUsd = overageCalculations.reduce(
    (sum, calc) => sum + calc.projectedCost,
    0
  );
  const willExceedBudget = projectedConsumptionUsd > totalBudgetUsd;

  return {
    totalBudgetUsd,
    consumedUsd,
    remainingUsd,
    percentageConsumed,
    isExhausted,
    blockWhenExhausted,
    breakdown,
    projectedConsumptionUsd,
    willExceedBudget,
  };
}

/**
 * Calculate next quota reset
 */
export function calculateQuotaReset(
  resourceType: ResourceType,
  billingPeriodStart: Date,
  billingPeriodEnd: Date,
  isProRated: boolean = false,
  proRatedQuota: number | null = null
): QuotaReset {
  const now = new Date();
  const lastResetAt = billingPeriodStart;
  const nextResetAt = billingPeriodEnd;

  const msUntilReset = nextResetAt.getTime() - now.getTime();
  const daysUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60 * 24));
  const hoursUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60));

  return {
    resourceType,
    lastResetAt: lastResetAt.toISOString(),
    nextResetAt: nextResetAt.toISOString(),
    daysUntilReset: Math.max(0, daysUntilReset),
    hoursUntilReset: Math.max(0, hoursUntilReset),
    isProRated,
    proRatedQuota,
  };
}

/**
 * Evaluate usage decision point
 */
export function evaluateDecisionPoint(
  currentUsage: number,
  totalQuota: number,
  isUnlimited: boolean,
  currentOverageCost: number,
  projectedOverageCost: number,
  currentPlanCostUsd: number,
  nextPlanCostUsd: number | null,
  nextPlanQuota: number | null,
  budgetRemaining: number
): UsageDecisionPoint {
  const percentageUsed = calculateQuotaPercentage(
    currentUsage,
    totalQuota,
    isUnlimited
  );

  let currentState: UsageDecisionPoint["currentState"];
  if (budgetRemaining === 0 && currentOverageCost > 0) {
    currentState = "blocked";
  } else if (isUnlimited || (percentageUsed !== null && percentageUsed < 75)) {
    currentState = "under_quota";
  } else if (percentageUsed !== null && percentageUsed < 100) {
    currentState = "near_quota";
  } else {
    currentState = "over_quota";
  }

  // Calculate costs
  const costOfStayingUsd = currentPlanCostUsd + projectedOverageCost;
  const costOfUpgradingUsd = nextPlanCostUsd || Infinity;
  const costSavingsWithUpgradeUsd = costOfStayingUsd - costOfUpgradingUsd;

  // Determine recommendation
  let recommendedAction: UsageDecisionPoint["recommendedAction"] = "continue";
  let reasoning = "";
  let confidence = 50;
  const alternatives: UsageDecisionPoint["alternatives"] = [];

  if (currentState === "blocked") {
    if (costSavingsWithUpgradeUsd > 0 && nextPlanQuota !== null) {
      recommendedAction = "upgrade_plan";
      reasoning =
        "Usage is blocked due to budget exhaustion. Upgrading will be more cost-effective than increasing overage budget.";
      confidence = 90;
    } else {
      recommendedAction = "increase_budget";
      reasoning =
        "Usage is blocked. Increasing overage budget is the most cost-effective option.";
      confidence = 85;
    }
  } else if (currentState === "over_quota") {
    if (costSavingsWithUpgradeUsd > 0) {
      recommendedAction = "upgrade_plan";
      reasoning = `Upgrading will save $${costSavingsWithUpgradeUsd.toFixed(2)}/month compared to paying for overages.`;
      confidence = 85;
    } else if (projectedOverageCost < budgetRemaining) {
      recommendedAction = "continue";
      reasoning = "Current overage costs are manageable within budget.";
      confidence = 70;
    } else {
      recommendedAction = "increase_budget";
      reasoning =
        "Projected overage costs exceed budget. Consider increasing budget allocation.";
      confidence = 75;
    }
  } else if (currentState === "near_quota") {
    if (projectedOverageCost > 0 && costSavingsWithUpgradeUsd > 0) {
      recommendedAction = "upgrade_plan";
      reasoning =
        "Projected to exceed quota. Upgrading will be more cost-effective than overages.";
      confidence = 70;
    } else {
      recommendedAction = "continue";
      reasoning =
        "Usage is near quota but manageable. Monitor closely for the remainder of the billing period.";
      confidence = 65;
    }
  } else {
    recommendedAction = "continue";
    reasoning = "Current usage is well within quota limits.";
    confidence = 80;
  }

  // Build alternatives
  if (recommendedAction !== "continue") {
    alternatives.push({
      action: "Continue on current plan",
      estimatedCostUsd: costOfStayingUsd,
      pros: ["No immediate changes required", "Familiar plan"],
      cons: ["May incur overage charges", "Risk of hitting limits"],
    });
  }

  if (nextPlanCostUsd !== null && recommendedAction !== "upgrade_plan") {
    alternatives.push({
      action: "Upgrade to next tier",
      estimatedCostUsd: costOfUpgradingUsd,
      pros: ["Higher quota limits", "No overage concerns", "More features"],
      cons: costSavingsWithUpgradeUsd < 0 ? ["More expensive upfront"] : [],
    });
  }

  if (currentOverageCost > 0 && recommendedAction !== "increase_budget") {
    alternatives.push({
      action: "Increase overage budget",
      estimatedCostUsd: costOfStayingUsd,
      pros: ["Stay on current plan", "Flexible spending"],
      cons: ["Variable costs", "Doesn't prevent overages"],
    });
  }

  // Calculate break-even point for upgrade
  let breakEvenUsage: number | null = null;
  if (nextPlanCostUsd !== null && nextPlanQuota !== null) {
    const costDiff = nextPlanCostUsd - currentPlanCostUsd;
    const overageCostPerUnit =
      DEFAULT_OVERAGE_COSTS[ResourceType.PREMIUM_REQUESTS] ?? 0;
    if (overageCostPerUnit > 0) {
      breakEvenUsage = totalQuota + costDiff / overageCostPerUnit;
    }
  }

  return {
    currentState,
    recommendedAction,
    reasoning,
    costSavingsWithUpgradeUsd,
    costOfStayingUsd,
    breakEvenUsage,
    confidence,
    alternatives,
  };
}

/**
 * Check if a usage threshold has been crossed
 */
export function checkThresholdCrossed(
  currentUsage: number,
  totalQuota: number,
  thresholdPercentage: number,
  isUnlimited: boolean
): boolean {
  if (isUnlimited) {
    return false;
  }
  const percentageUsed = calculateQuotaPercentage(
    currentUsage,
    totalQuota,
    isUnlimited
  );
  return percentageUsed !== null && percentageUsed >= thresholdPercentage;
}

/**
 * Create usage thresholds for a resource
 */
export function createUsageThresholds(
  resourceType: ResourceType,
  currentUsage: number,
  totalQuota: number,
  isUnlimited: boolean,
  thresholdPercentages: readonly number[],
  currentTime: Date
): UsageThreshold[] {
  return thresholdPercentages.map(percentage => {
    const isCrossed = checkThresholdCrossed(
      currentUsage,
      totalQuota,
      percentage,
      isUnlimited
    );
    const absoluteValue = isUnlimited
      ? null
      : Math.floor((totalQuota * percentage) / 100);

    let action: UsageThreshold["action"] = "notify";
    if (percentage >= 90) {
      action = "warn";
    }
    if (percentage >= 100) {
      action = "block";
    }

    return {
      resourceType,
      percentage,
      absoluteValue,
      isCrossed,
      crossedAt: isCrossed ? currentTime.toISOString() : null,
      action,
      alertEnabled: true,
    };
  });
}

/**
 * Calculate pro-rated quota for mid-cycle plan changes
 */
export function calculateProRatedQuota(
  baseQuota: number,
  daysRemainingInPeriod: number,
  totalDaysInPeriod: number
): number {
  if (totalDaysInPeriod === 0) {
    return baseQuota;
  }
  return Math.floor((baseQuota * daysRemainingInPeriod) / totalDaysInPeriod);
}

/**
 * Calculate days remaining in billing period
 */
export function calculateDaysRemaining(billingPeriodEnd: Date): number {
  const now = new Date();
  const msRemaining = billingPeriodEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate days elapsed in billing period
 */
export function calculateDaysElapsed(billingPeriodStart: Date): number {
  const now = new Date();
  const msElapsed = now.getTime() - billingPeriodStart.getTime();
  return Math.max(0, Math.floor(msElapsed / (1000 * 60 * 60 * 24)));
}
