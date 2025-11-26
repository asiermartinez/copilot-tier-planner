/**
 * Default Messages Generator
 *
 * Generates default CustomMessages from the centralized message dictionary.
 * This ensures we're always using the dictionary as the source of truth.
 */

import {
  BLOCK_REASONS,
  BUDGET_WARNINGS,
  INFO_MESSAGES,
  CTA_MESSAGES,
} from "@/data/messages/blockReasons";
import type { CustomMessages } from "@/types/messages/customMessages";
import { DEFAULT_ALERT_THRESHOLDS } from "@/data/alertThresholds";

/**
 * Get default custom messages from the dictionary
 *
 * Note: For messages that use functions in the dictionary (e.g., QUOTA_WARNINGS.THRESHOLD_REACHED),
 * we convert them to template strings for editing in the UI.
 */
export function getDefaultMessages(): CustomMessages {
  return {
    blockReasons: {
      quotaExceededNoOverages: BLOCK_REASONS.QUOTA_EXCEEDED_NO_OVERAGES,
      limitReached: BLOCK_REASONS.LIMIT_REACHED,
      budgetExhausted: BLOCK_REASONS.BUDGET_EXHAUSTED,
    },
    quotaWarnings: {
      // Convert from function to template string
      thresholdReached: "You have used {percentage}% of your quota",
      approachingLimit: "Approaching your quota limit ({current} of {limit})",
      usingOverageBudget: "Using {overage} overage requests from your budget",
    },
    budgetWarnings: {
      // Convert from function to template string
      thresholdReached: "You have used {percentage}% of your overage budget",
      nearlyExhausted: "Only {remaining} remaining in overage budget",
      exhausted: BUDGET_WARNINGS.EXHAUSTED,
    },
    infoMessages: {
      noOverageBudget: INFO_MESSAGES.NO_OVERAGE_BUDGET,
      // Convert from function to template string
      trialActive: "Trial: {daysRemaining} day(s) remaining",
    },
    ctaMessages: {
      setupOverageBudget: CTA_MESSAGES.SETUP_OVERAGE_BUDGET,
      // Convert from function to template string
      upgradeForMore: "Upgrade to {nextPlan} for higher quota limits",
    },
  };
}

/**
 * Get default alert thresholds
 */
export function getDefaultThresholds(): number[] {
  return [...DEFAULT_ALERT_THRESHOLDS];
}
