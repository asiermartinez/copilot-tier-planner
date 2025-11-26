/**
 * Alert to Threshold Mapping
 *
 * Maps threshold IDs to the threshold configuration index for focusing/editing.
 * With the new configurable threshold system, alerts are generated dynamically
 * based on user-defined thresholds.
 */

/**
 * Get the threshold index for a given alert ID (threshold ID)
 * Returns the threshold ID itself since alerts now use threshold IDs
 */
export function getThresholdIdForAlert(alertId: string | null): string | null {
  // With the new system, the alert ID IS the threshold ID
  return alertId;
}
