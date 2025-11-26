/**
 * Alert to Message Field Mapping
 *
 * Maps alert IDs to their corresponding message field keys in the MessageEditor.
 * This allows us to focus/highlight the relevant message field when an alert is displayed.
 */

/**
 * Message field identifier for focusing in the MessageEditor
 */
export type MessageFieldId =
  | "blockReasons.quotaExceededNoOverages"
  | "blockReasons.limitReached"
  | "blockReasons.budgetExhausted"
  | "quotaWarnings.thresholdReached"
  | "quotaWarnings.approachingLimit"
  | "quotaWarnings.usingOverageBudget"
  | "budgetWarnings.thresholdReached"
  | "budgetWarnings.nearlyExhausted"
  | "budgetWarnings.exhausted"
  | "infoMessages.noOverageBudget"
  | "infoMessages.trialActive"
  | "ctaMessages.setupOverageBudget"
  | "ctaMessages.upgradeForMore";

/**
 * Map alert IDs to their corresponding message field IDs
 */
export const ALERT_TO_FIELD_MAP: Record<string, MessageFieldId> = {
  // Blocking alerts (specific to each scenario)
  "blocking-quota-no-overages": "blockReasons.quotaExceededNoOverages",
  "blocking-limit-reached": "blockReasons.limitReached",
  "blocking-budget-exhausted": "blockReasons.budgetExhausted",

  // Budget alerts
  "budget-exceeded": "budgetWarnings.exhausted",
  "budget-critical": "budgetWarnings.nearlyExhausted",
  "budget-warning": "budgetWarnings.thresholdReached",

  // Quota alerts
  "quota-critical": "quotaWarnings.approachingLimit",
  "quota-warning": "quotaWarnings.thresholdReached",

  // Trial alerts
  "trial-expiring": "infoMessages.trialActive",

  // Info alerts
  "using-overage": "quotaWarnings.usingOverageBudget",
  "suggest-overage-budget": "ctaMessages.setupOverageBudget",
};

/**
 * Get the message field ID for a given alert ID
 */
export function getMessageFieldForAlert(
  alertId: string | null
): MessageFieldId | null {
  if (!alertId) return null;
  return ALERT_TO_FIELD_MAP[alertId] ?? null;
}
