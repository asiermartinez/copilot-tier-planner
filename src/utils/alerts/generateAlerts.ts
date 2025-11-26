/**
 * Alert Generation Utility
 *
 * Analyzes UserState and generates the highest priority alert to display.
 * Only one alert is shown at a time, prioritized by severity and importance.
 */

import type { UserState } from "@/types/userState";
import {
  AlertSeverityLevel,
  getLastCrossedThreshold,
} from "@/data/alertThresholds";
import {
  BLOCK_REASONS,
  BUDGET_WARNINGS,
  CTA_MESSAGES,
} from "@/data/messages/blockReasons";
import { SKU_MAP } from "@/data/skus";
import type {
  CustomMessages,
  CustomThresholds,
} from "@/types/messages/customMessages";
import { replaceTemplate } from "@/utils/messages/templateUtils";
import { getDefaultThresholds } from "@/utils/messages/defaultMessages";

/**
 * Alert to be displayed to the user
 */
export interface Alert {
  /** Unique identifier for this alert */
  id: string;
  /** Alert severity level */
  severity: AlertSeverityLevel;
  /** Alert message */
  message: string;
  /** Alert type for categorization */
  type: AlertType;
  /** Priority for ordering (higher = show first) */
  priority: number;
}

/**
 * Alert type categories
 */
export enum AlertType {
  BLOCKING = "blocking",
  QUOTA_EXCEEDED = "quota_exceeded",
  QUOTA_WARNING = "quota_warning",
  BUDGET_EXCEEDED = "budget_exceeded",
  BUDGET_WARNING = "budget_warning",
  TRIAL_EXPIRING = "trial_expiring",
  INFO = "info",
}

/**
 * Priority levels for alert ordering
 */
const PRIORITY = {
  BLOCKING: 100,
  EXCEEDED: 90,
  CRITICAL: 80,
  WARNING: 70,
  INFO: 60,
};

/**
 * Generate the highest priority alert for a given user state.
 * Returns only ONE alert to display at a time.
 */
export function generateAlerts(
  userState: UserState,
  customMessages?: CustomMessages,
  customThresholds?: CustomThresholds
): Alert[] {
  // Check alerts in priority order and return the first match

  // 1. HIGHEST PRIORITY: Blocking alerts
  const blockingAlert = checkBlockingAlert(userState, customMessages);
  if (blockingAlert) {
    return [blockingAlert];
  }

  // 2. Budget critical (90%+) or exceeded
  const budgetCriticalAlert = checkBudgetCritical(
    userState,
    customMessages,
    customThresholds
  );
  if (budgetCriticalAlert) {
    return [budgetCriticalAlert];
  }

  // 3. Quota critical (90%+) - approaching limit
  const quotaCriticalAlert = checkQuotaCritical(
    userState,
    customMessages,
    customThresholds
  );
  if (quotaCriticalAlert) {
    return [quotaCriticalAlert];
  }

  // 4. Budget warning (75%+)
  const budgetWarningAlert = checkBudgetWarning(
    userState,
    customMessages,
    customThresholds
  );
  if (budgetWarningAlert) {
    return [budgetWarningAlert];
  }

  // 5. Quota warning (75%+)
  const quotaWarningAlert = checkQuotaWarning(
    userState,
    customMessages,
    customThresholds
  );
  if (quotaWarningAlert) {
    return [quotaWarningAlert];
  }

  // 6. Trial expiring
  const trialAlert = checkTrialExpiring(userState, customMessages);
  if (trialAlert) {
    return [trialAlert];
  }

  // 7. Using overage budget (informational)
  const usingOverageAlert = checkUsingOverage(userState, customMessages);
  if (usingOverageAlert) {
    return [usingOverageAlert];
  }

  // 8. Suggest overage budget setup
  const suggestBudgetAlert = checkSuggestOverageBudget(
    userState,
    customMessages
  );
  if (suggestBudgetAlert) {
    return [suggestBudgetAlert];
  }

  // No alerts to show
  return [];
}

/**
 * Check for blocking alerts (usage is blocked)
 */
function checkBlockingAlert(
  userState: UserState,
  customMessages?: CustomMessages
): Alert | null {
  const { premiumRequests } = userState.usage;
  const { overageBudget } = userState;
  const sku = SKU_MAP[userState.subscription.skuId];

  if (!premiumRequests.isBlocked) {
    return null;
  }

  const allowsOverages = sku.limits.premiumRequestsOveragePolicy.allowBudgetCap;
  const hasBudget = overageBudget !== null;

  // Determine blocking scenario and message
  let message: string;
  let id: string;

  if (!allowsOverages) {
    id = "blocking-quota-no-overages";
    message =
      customMessages?.blockReasons.quotaExceededNoOverages?.trim() ||
      BLOCK_REASONS.QUOTA_EXCEEDED_NO_OVERAGES;
  } else if (!hasBudget) {
    id = "blocking-limit-reached";
    message =
      customMessages?.blockReasons.limitReached?.trim() ||
      BLOCK_REASONS.LIMIT_REACHED;
  } else {
    id = "blocking-budget-exhausted";
    message =
      customMessages?.blockReasons.budgetExhausted?.trim() ||
      BLOCK_REASONS.BUDGET_EXHAUSTED;
  }

  return {
    id,
    severity: AlertSeverityLevel.EXCEEDED,
    message,
    type: AlertType.BLOCKING,
    priority: PRIORITY.BLOCKING,
  };
}

/**
 * Check for budget critical/exceeded alerts (90%+ or 100%)
 */
function checkBudgetCritical(
  userState: UserState,
  customMessages?: CustomMessages,
  customThresholds?: CustomThresholds
): Alert | null {
  const { overageBudget } = userState;

  if (!overageBudget) {
    return null;
  }

  const thresholds = customThresholds?.thresholds ?? getDefaultThresholds();
  const lastCrossed = getLastCrossedThreshold(
    overageBudget.percentageConsumed,
    thresholds
  );

  if (!lastCrossed) {
    return null;
  }

  // Budget exceeded (100%)
  if (lastCrossed >= 100) {
    const message =
      customMessages?.budgetWarnings.exhausted?.trim() ||
      BUDGET_WARNINGS.EXHAUSTED;
    return {
      id: "budget-exceeded",
      severity: AlertSeverityLevel.EXCEEDED,
      message,
      type: AlertType.BUDGET_EXCEEDED,
      priority: PRIORITY.EXCEEDED,
    };
  }

  // Budget critical (90%+)
  if (lastCrossed >= 90) {
    const remaining = overageBudget.remainingBudgetUsd;
    const template =
      customMessages?.budgetWarnings.nearlyExhausted?.trim() ||
      "Only {remaining} remaining in overage budget";
    const message = replaceTemplate(template, {
      remaining: remaining.toFixed(2),
    });
    return {
      id: "budget-critical",
      severity: AlertSeverityLevel.CRITICAL,
      message,
      type: AlertType.BUDGET_WARNING,
      priority: PRIORITY.CRITICAL,
    };
  }

  return null;
}

/**
 * Check for quota critical alerts (90%+ of quota)
 */
function checkQuotaCritical(
  userState: UserState,
  customMessages?: CustomMessages,
  customThresholds?: CustomThresholds
): Alert | null {
  const { premiumRequests } = userState.usage;

  // Don't show if already blocked
  if (premiumRequests.isBlocked || premiumRequests.isOverQuota) {
    return null;
  }

  const thresholds = customThresholds?.thresholds ?? getDefaultThresholds();
  const lastCrossed = getLastCrossedThreshold(
    premiumRequests.percentageUsed,
    thresholds
  );

  // Quota critical (90%+) but not yet at 100%
  if (lastCrossed && lastCrossed >= 90) {
    const current = premiumRequests.current;
    const limit = premiumRequests.limit!;
    const template =
      customMessages?.quotaWarnings.approachingLimit?.trim() ||
      "Approaching your quota limit ({current} of {limit})";
    const message = replaceTemplate(template, {
      current,
      limit,
    });
    return {
      id: "quota-critical",
      severity: AlertSeverityLevel.CRITICAL,
      message,
      type: AlertType.QUOTA_WARNING,
      priority: PRIORITY.CRITICAL,
    };
  }

  return null;
}

/**
 * Check for budget warning alerts (75%+)
 */
function checkBudgetWarning(
  userState: UserState,
  customMessages?: CustomMessages,
  customThresholds?: CustomThresholds
): Alert | null {
  const { overageBudget } = userState;

  if (!overageBudget) {
    return null;
  }

  const thresholds = customThresholds?.thresholds ?? getDefaultThresholds();
  const lastCrossed = getLastCrossedThreshold(
    overageBudget.percentageConsumed,
    thresholds
  );

  // Budget warning (75%+) but not critical yet
  if (lastCrossed && lastCrossed >= 75 && lastCrossed < 90) {
    const percentage = Math.round(overageBudget.percentageConsumed);
    const template =
      customMessages?.budgetWarnings.thresholdReached?.trim() ||
      "You have used {percentage}% of your overage budget";
    const message = replaceTemplate(template, { percentage });
    return {
      id: "budget-warning",
      severity: AlertSeverityLevel.WARNING,
      message,
      type: AlertType.BUDGET_WARNING,
      priority: PRIORITY.WARNING,
    };
  }

  return null;
}

/**
 * Check for quota warning alerts (75%+)
 */
function checkQuotaWarning(
  userState: UserState,
  customMessages?: CustomMessages,
  customThresholds?: CustomThresholds
): Alert | null {
  const { premiumRequests } = userState.usage;

  // Don't show if already blocked or over quota
  if (premiumRequests.isBlocked || premiumRequests.isOverQuota) {
    return null;
  }

  const thresholds = customThresholds?.thresholds ?? getDefaultThresholds();
  const lastCrossed = getLastCrossedThreshold(
    premiumRequests.percentageUsed,
    thresholds
  );

  // Quota warning (75%+) but not critical yet
  if (lastCrossed && lastCrossed >= 75 && lastCrossed < 90) {
    const percentage = Math.round(premiumRequests.percentageUsed!);
    const template =
      customMessages?.quotaWarnings.thresholdReached?.trim() ||
      "You have used {percentage}% of your quota";
    const message = replaceTemplate(template, { percentage });
    return {
      id: "quota-warning",
      severity: AlertSeverityLevel.WARNING,
      message,
      type: AlertType.QUOTA_WARNING,
      priority: PRIORITY.WARNING,
    };
  }

  return null;
}

/**
 * Check for trial expiring alert
 */
function checkTrialExpiring(
  userState: UserState,
  customMessages?: CustomMessages
): Alert | null {
  const { subscription } = userState;

  if (subscription.status !== "trial" || !subscription.trialDaysRemaining) {
    return null;
  }

  const daysRemaining = subscription.trialDaysRemaining;

  // Only show alert if 7 days or less remaining
  if (daysRemaining > 7) {
    return null;
  }

  const severity =
    daysRemaining <= 3 ? AlertSeverityLevel.WARNING : AlertSeverityLevel.INFO;

  const template =
    customMessages?.infoMessages.trialActive?.trim() ||
    "Trial: {daysRemaining} day(s) remaining";
  const message = replaceTemplate(template, { daysRemaining });

  return {
    id: "trial-expiring",
    severity,
    message,
    type: AlertType.TRIAL_EXPIRING,
    priority:
      severity === AlertSeverityLevel.WARNING
        ? PRIORITY.WARNING
        : PRIORITY.INFO,
  };
}

/**
 * Check if user is using overage budget (informational)
 */
function checkUsingOverage(
  userState: UserState,
  customMessages?: CustomMessages
): Alert | null {
  const { premiumRequests } = userState.usage;

  // Only show if over quota but not blocked (actively using overage budget)
  if (!premiumRequests.isOverQuota || premiumRequests.isBlocked) {
    return null;
  }

  const overage = premiumRequests.overage;
  const template =
    customMessages?.quotaWarnings.usingOverageBudget?.trim() ||
    "Using {overage} overage requests from your budget";
  const message = replaceTemplate(template, {
    overage,
  });

  return {
    id: "using-overage",
    severity: AlertSeverityLevel.INFO,
    message,
    type: AlertType.INFO,
    priority: PRIORITY.INFO,
  };
}

/**
 * Check if we should suggest setting up overage budget
 */
function checkSuggestOverageBudget(
  userState: UserState,
  customMessages?: CustomMessages
): Alert | null {
  const { premiumRequests } = userState.usage;
  const { overageBudget } = userState;
  const sku = SKU_MAP[userState.subscription.skuId];

  // Suggest setting up overage budget if:
  // 1. Plan supports it
  // 2. No budget configured
  // 3. Usage is above 50% but not yet blocking
  if (
    sku.limits.premiumRequestsOveragePolicy.allowBudgetCap &&
    !overageBudget &&
    premiumRequests.percentageUsed &&
    premiumRequests.percentageUsed >= 50 &&
    !premiumRequests.isBlocked
  ) {
    const message =
      customMessages?.ctaMessages.setupOverageBudget?.trim() ||
      CTA_MESSAGES.SETUP_OVERAGE_BUDGET;
    return {
      id: "suggest-overage-budget",
      severity: AlertSeverityLevel.INFO,
      message,
      type: AlertType.INFO,
      priority: PRIORITY.INFO,
    };
  }

  return null;
}
