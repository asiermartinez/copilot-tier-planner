/**
 * Centralized Messages Dictionary
 *
 * This file contains all user-facing messages for various states in the SKU planner.
 * Centralizing messages makes it easier to maintain consistency and update copy.
 */

/**
 * Block reasons for when usage is restricted
 */
export const BLOCK_REASONS = {
  /** User has exceeded quota on a plan that doesn't allow overages (e.g., FREE) */
  QUOTA_EXCEEDED_NO_OVERAGES:
    "Quota exceeded. No overage allowed on this plan.",

  /** User has reached their quota limit but hasn't enabled overage budget */
  LIMIT_REACHED: "Limit reached. Set up an overage budget to continue.",

  /** User has exhausted their overage budget */
  BUDGET_EXHAUSTED:
    "Budget cap exceeded. Upgrade plan or increase budget to continue.",
} as const;

/**
 * Warning messages for quota usage
 */
export const QUOTA_WARNINGS = {
  /** Warning threshold reached (e.g., 80% of quota) */
  THRESHOLD_REACHED: (percentage: number) =>
    `You've used ${percentage}% of your quota`,

  /** Approaching quota limit */
  APPROACHING_LIMIT: (current: number, limit: number) =>
    `You're approaching your limit (${current.toLocaleString()} of ${limit.toLocaleString()})`,

  /** Quota exceeded with overages enabled */
  OVER_QUOTA_WITH_BUDGET: (overage: number) =>
    `You've exceeded your quota by ${overage.toLocaleString()} requests`,
} as const;

/**
 * Budget warning messages
 */
export const BUDGET_WARNINGS = {
  /** Budget threshold reached */
  THRESHOLD_REACHED: (percentage: number) =>
    `You've used ${percentage}% of your overage budget`,

  /** Budget nearly exhausted */
  NEARLY_EXHAUSTED: (remaining: number) =>
    `Only $${remaining.toFixed(2)} remaining in overage budget`,

  /** Budget fully exhausted */
  EXHAUSTED: "Your overage budget has been exhausted",
} as const;

/**
 * Informational messages
 */
export const INFO_MESSAGES = {
  /** Overage budget not configured */
  NO_OVERAGE_BUDGET:
    "Enable overage budget to continue using premium requests beyond your quota",

  /** Overage budget configured */
  OVERAGE_BUDGET_ENABLED: (budget: number, requests: number) =>
    `Overage budget: $${budget.toFixed(2)} (up to ${requests.toLocaleString()} additional requests)`,

  /** Trial period active */
  TRIAL_ACTIVE: (daysRemaining: number) =>
    `Trial: ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`,

  /** Subscription renewing soon */
  RENEWAL_UPCOMING: (date: string) => `Subscription renews on ${date}`,
} as const;

/**
 * Call-to-action messages
 */
export const CTA_MESSAGES = {
  /** Encourage upgrade when at quota */
  UPGRADE_FOR_MORE: (nextPlan: string) =>
    `Upgrade to ${nextPlan} for higher quota limits`,

  /** Encourage budget setup */
  SETUP_OVERAGE_BUDGET: "Set up an overage budget to avoid interruptions",

  /** Encourage budget increase */
  INCREASE_BUDGET: "Increase your overage budget to continue",

  /** View plan comparison */
  COMPARE_PLANS: "Compare plans to find the right fit",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  /** State copied to clipboard */
  STATE_COPIED: "State copied to clipboard",

  /** Budget updated */
  BUDGET_UPDATED: "Overage budget updated successfully",

  /** Plan changed */
  PLAN_CHANGED: (planName: string) => `Switched to ${planName}`,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  /** Invalid budget value */
  INVALID_BUDGET: "Budget must be at least $1",

  /** Invalid usage value */
  INVALID_USAGE: "Usage value is invalid",

  /** Failed to copy to clipboard */
  COPY_FAILED: "Failed to copy to clipboard",
} as const;

/**
 * Helper function to get block reason based on state
 */
export function getBlockReason(
  isOverQuota: boolean,
  allowsOverages: boolean,
  hasOverageBudget: boolean,
  isBudgetExhausted: boolean
): string | null {
  if (!isOverQuota && !isBudgetExhausted) {
    return null;
  }

  if (!allowsOverages) {
    return BLOCK_REASONS.QUOTA_EXCEEDED_NO_OVERAGES;
  }

  if (!hasOverageBudget) {
    return BLOCK_REASONS.LIMIT_REACHED;
  }

  if (isBudgetExhausted) {
    return BLOCK_REASONS.BUDGET_EXHAUSTED;
  }

  return null;
}

/**
 * Type exports for type safety
 */
export type BlockReason = (typeof BLOCK_REASONS)[keyof typeof BLOCK_REASONS];
export type QuotaWarning = string;
export type BudgetWarning = string;
