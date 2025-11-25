/**
 * Centralized Alert Thresholds Configuration
 *
 * Defines the alert threshold percentages used for both:
 * - Quota usage warnings (premium requests, chat messages, code completions)
 * - Overage budget consumption warnings
 *
 * These thresholds trigger different severity levels of alerts/messages.
 */

/**
 * Alert severity levels corresponding to threshold percentages
 */
export enum AlertSeverityLevel {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical",
  EXCEEDED = "exceeded",
}

/**
 * Standard alert thresholds as percentages (0-100)
 *
 * These percentages apply to both quota usage and budget consumption:
 * - 50%: Info/early awareness
 * - 75%: Warning/approaching limit
 * - 90%: Critical/urgent action needed
 * - 100%: Exceeded/limit reached
 */
export const ALERT_THRESHOLDS = [50, 75, 90, 100] as const;

/**
 * Default alert thresholds (mutable copy for dynamic use)
 */
export const DEFAULT_ALERT_THRESHOLDS: number[] = [...ALERT_THRESHOLDS];

/**
 * Map threshold percentages to their severity levels
 */
export const THRESHOLD_SEVERITY_MAP: Record<number, AlertSeverityLevel> = {
  50: AlertSeverityLevel.INFO,
  75: AlertSeverityLevel.WARNING,
  90: AlertSeverityLevel.CRITICAL,
  100: AlertSeverityLevel.EXCEEDED,
};

/**
 * Get the severity level for a given percentage
 * Returns the highest severity level that has been crossed
 */
export function getSeverityForPercentage(
  percentage: number | null
): AlertSeverityLevel | null {
  if (percentage === null) return null;

  // Find the highest threshold that has been crossed
  const crossedThreshold = ALERT_THRESHOLDS.slice()
    .reverse()
    .find(threshold => percentage >= threshold);

  return crossedThreshold !== undefined
    ? THRESHOLD_SEVERITY_MAP[crossedThreshold]
    : null;
}

/**
 * Get the last crossed threshold value for a given percentage
 * Returns null if no thresholds have been crossed
 */
export function getLastCrossedThreshold(
  percentage: number | null,
  thresholds: number[] = DEFAULT_ALERT_THRESHOLDS
): number | null {
  if (percentage === null) return null;

  // Find the highest threshold that has been crossed
  const crossedThreshold = thresholds
    .slice()
    .sort((a, b) => b - a) // Sort descending
    .find(threshold => percentage >= threshold);

  return crossedThreshold ?? null;
}

/**
 * Check if a specific threshold has been crossed
 */
export function hasReachedThreshold(
  percentage: number | null,
  threshold: number
): boolean {
  if (percentage === null) return false;
  return percentage >= threshold;
}
