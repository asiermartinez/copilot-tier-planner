/**
 * Usage and Quota Tracking Structure
 *
 * Defines granular types and constants for tracking resource usage,
 * quota limits, and overage calculations across different
 * resource types in GitHub Copilot plans.
 */

/**
 * Resource types that can be tracked and limited
 */
export enum ResourceType {
  PREMIUM_REQUESTS = "premium_requests",
  CHAT_MESSAGES = "chat_messages",
  CODE_COMPLETIONS = "code_completions",
  CLI_COMPLETIONS = "cli_completions",
  API_CALLS = "api_calls",
}

/**
 * Quota limit configuration
 */
export interface QuotaLimit {
  /** Resource type */
  resourceType: ResourceType;
  /** Base quota included in the plan */
  baseQuota: number;
  /** Additional quota purchased */
  additionalQuota: number;
  /** Total quota (base + additional) */
  totalQuota: number;
  /** Whether the quota is unlimited */
  isUnlimited: boolean;
  /** Whether overage is allowed beyond quota */
  allowOverage: boolean;
  /** Cost per unit of overage (in USD) */
  overageCostPerUnit: number | null;
  /** Maximum overage allowed (null for unlimited overage if budget allows) */
  maxOverage: number | null;
}

/**
 * Reasons why usage might be blocked
 */
export enum BlockReason {
  /** Quota exceeded and no overage allowed */
  QUOTA_EXCEEDED_NO_OVERAGE = "quota_exceeded_no_overage",
  /** Overage budget exhausted */
  OVERAGE_BUDGET_EXHAUSTED = "overage_budget_exhausted",
  /** Maximum overage limit reached */
  MAX_OVERAGE_REACHED = "max_overage_reached",
  /** Subscription suspended or cancelled */
  SUBSCRIPTION_INACTIVE = "subscription_inactive",
  /** Payment method failed */
  PAYMENT_FAILED = "payment_failed",
  /** Manual administrative block */
  ADMIN_BLOCK = "admin_block",
}

/**
 * Overage calculation details
 */
export interface OverageCalculation {
  /** Resource type */
  resourceType: ResourceType;
  /** Units over quota */
  unitsOverQuota: number;
  /** Cost per unit */
  costPerUnit: number;
  /** Total overage cost */
  totalCost: number;
  /** Whether this overage fits within the budget */
  fitsInBudget: boolean;
  /** Budget consumed by this overage */
  budgetConsumed: number;
  /** Projected overage for the full billing period */
  projectedUnits: number;
  /** Projected cost for the full billing period */
  projectedCost: number;
}

/**
 * Budget allocation summary for overages
 * Provides detailed breakdown of overage budget consumption
 */
export interface BudgetAllocationSummary {
  /** Total budget allocated in USD */
  totalBudgetUsd: number;
  /** Amount consumed by current usage */
  consumedUsd: number;
  /** Amount remaining */
  remainingUsd: number;
  /** Percentage consumed (0-100) */
  percentageConsumed: number;
  /** Whether budget is exhausted */
  isExhausted: boolean;
  /** Whether to block when exhausted */
  blockWhenExhausted: boolean;
  /** Breakdown by resource type */
  breakdown: Array<{
    resourceType: ResourceType;
    allocatedUsd: number;
    consumedUsd: number;
    percentageOfTotal: number;
  }>;
  /** Projected budget consumption for full billing period */
  projectedConsumptionUsd: number;
  /** Whether projected consumption exceeds budget */
  willExceedBudget: boolean;
}

/**
 * Monthly quota reset tracking
 */
export interface QuotaReset {
  /** Resource type */
  resourceType: ResourceType;
  /** Last reset timestamp (ISO 8601) */
  lastResetAt: string;
  /** Next reset timestamp (ISO 8601) */
  nextResetAt: string;
  /** Days until next reset */
  daysUntilReset: number;
  /** Hours until next reset */
  hoursUntilReset: number;
  /** Whether the reset is pro-rated (e.g., mid-cycle plan change) */
  isProRated: boolean;
  /** Pro-rated quota amount (if applicable) */
  proRatedQuota: number | null;
}

/**
 * Decision point for plan changes
 */
export interface UsageDecisionPoint {
  /** Current state assessment */
  currentState: "under_quota" | "near_quota" | "over_quota" | "blocked";
  /** Recommended action */
  recommendedAction:
    | "continue"
    | "increase_budget"
    | "upgrade_plan"
    | "purchase_more";
  /** Reasoning for recommendation */
  reasoning: string;
  /** Potential cost savings with upgrade (negative = more expensive) */
  costSavingsWithUpgradeUsd: number;
  /** Potential cost of staying on current plan */
  costOfStayingUsd: number;
  /** Break-even usage point for upgrade */
  breakEvenUsage: number | null;
  /** Confidence in recommendation (0-100) */
  confidence: number;
  /** Alternative options */
  alternatives: Array<{
    action: string;
    estimatedCostUsd: number;
    pros: string[];
    cons: string[];
  }>;
}

/**
 * Usage threshold configuration
 */
export interface UsageThreshold {
  /** Resource type */
  resourceType: ResourceType;
  /** Threshold percentage (0-100) */
  percentage: number;
  /** Threshold value (absolute units) */
  absoluteValue: number | null;
  /** Whether this threshold has been crossed */
  isCrossed: boolean;
  /** Timestamp when crossed (ISO 8601, null if not crossed) */
  crossedAt: string | null;
  /** Action to take when crossed */
  action: "notify" | "warn" | "block" | "auto_upgrade";
  /** Whether alerts are enabled for this threshold */
  alertEnabled: boolean;
}

/**
 * Comprehensive usage and quota tracking state
 */
export interface UsageTrackingState {
  /** Timestamp of this tracking snapshot (ISO 8601) */
  timestamp: string;
  /** Billing period ID this tracking applies to */
  billingPeriodId: string;
  /** Overage calculations */
  overages: OverageCalculation[];
  /** Budget allocation tracking */
  budgetAllocation: BudgetAllocationSummary | null;
  /** Quota reset schedules */
  quotaResets: Record<ResourceType, QuotaReset>;
  /** Usage thresholds */
  thresholds: UsageThreshold[];
  /** Decision point analysis */
  decisionPoint: UsageDecisionPoint;
  /** Whether any resource is currently blocked */
  hasBlockedResources: boolean;
  /** Resources that are currently blocked */
  blockedResources: ResourceType[];
}

/**
 * Constants for standard warning thresholds
 */
export const STANDARD_QUOTA_THRESHOLDS = [50, 75, 85, 90, 95, 100] as const;

/**
 * Constants for standard budget alert thresholds
 */
export const STANDARD_BUDGET_THRESHOLDS = [50, 75, 90, 100] as const;

/**
 * Default overage costs per unit (in USD)
 * Based on GitHub Copilot pricing: https://docs.github.com/en/copilot/get-started/plans
 *
 * Note: Only premium requests have documented overage pricing.
 * Chat messages and code completions are either hard-blocked (Free tier)
 * or unlimited (paid tiers) with no per-unit overage charges.
 */
export const DEFAULT_OVERAGE_COSTS: Partial<Record<ResourceType, number>> = {
  [ResourceType.PREMIUM_REQUESTS]: 0.04, // $0.04 per premium request (documented)
};

/**
 * Type guard to check if a resource type is valid
 */
export function isValidResourceType(type: string): type is ResourceType {
  return Object.values(ResourceType).includes(type as ResourceType);
}
