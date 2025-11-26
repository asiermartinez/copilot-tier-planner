/**
 * Custom Messages Type Definitions
 *
 * Shared types for customizable banner messages and alert thresholds.
 * Used across the message editor, alert generation, and context system.
 */

/**
 * Custom alert thresholds configuration
 */
export interface CustomThresholds {
  /** Alert threshold percentages (e.g., [50, 75, 90, 100]) */
  thresholds: number[];
}

/**
 * Custom messages for all banner types
 */
export interface CustomMessages {
  blockReasons: BlockReasonMessages;
  quotaWarnings: QuotaWarningMessages;
  budgetWarnings: BudgetWarningMessages;
  infoMessages: InfoMessages;
  ctaMessages: CtaMessages;
}

/**
 * Block reason messages (when usage is restricted)
 */
export interface BlockReasonMessages {
  /** FREE plan at quota limit - no overages allowed */
  quotaExceededNoOverages: string;
  /** Quota reached without overage budget configured */
  limitReached: string;
  /** Overage budget fully consumed */
  budgetExhausted: string;
}

/**
 * Quota warning messages
 * Support template placeholders: {percentage}, {current}, {limit}, {overage}
 */
export interface QuotaWarningMessages {
  /** Warning threshold reached - uses {percentage} */
  thresholdReached: string;
  /** Approaching quota limit - uses {current} and {limit} */
  approachingLimit: string;
  /** Using overage budget - uses {overage} */
  usingOverageBudget: string;
}

/**
 * Budget warning messages
 * Support template placeholders: {percentage}, {remaining}
 */
export interface BudgetWarningMessages {
  /** Budget threshold reached - uses {percentage} */
  thresholdReached: string;
  /** Budget nearly exhausted - uses {remaining} */
  nearlyExhausted: string;
  /** Budget fully exhausted */
  exhausted: string;
}

/**
 * Informational messages
 * Support template placeholders: {daysRemaining}
 */
export interface InfoMessages {
  /** Suggestion to set up overage budget */
  noOverageBudget: string;
  /** Trial period active - uses {daysRemaining} */
  trialActive: string;
}

/**
 * Call-to-action messages
 * Support template placeholders: {nextPlan}
 */
export interface CtaMessages {
  /** Prompt to configure overage budget */
  setupOverageBudget: string;
  /** Encourage upgrade - uses {nextPlan} */
  upgradeForMore: string;
}

/**
 * Template placeholder types for type safety
 */
export type TemplatePlaceholder =
  | "percentage"
  | "current"
  | "limit"
  | "overage"
  | "remaining"
  | "daysRemaining"
  | "nextPlan";

/**
 * Template values for placeholder replacement
 */
export type TemplateValues = Partial<Record<TemplatePlaceholder, string | number>>;
