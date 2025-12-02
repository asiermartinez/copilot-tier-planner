/**
 * Threshold Export/Import Utilities
 *
 * Utilities to help convert exported threshold configurations
 * into the format needed for DEFAULT_THRESHOLDS in the codebase.
 */

import type { ThresholdConfig } from "@/types/thresholds";

/**
 * Export format for threshold configurations
 */
export interface ThresholdExport {
  thresholds: ThresholdConfig[];
  exportedAt: string;
  version: string;
}

/**
 * Converts exported JSON to TypeScript code for DEFAULT_THRESHOLDS
 *
 * This is useful when you want to take an exported configuration
 * and use it as the new defaults in the codebase.
 *
 * @param exportedJson - The exported JSON string
 * @returns TypeScript code string that can be pasted into thresholds.ts
 */
export function exportToTypeScriptCode(exportedJson: string): string {
  try {
    const parsed: ThresholdExport = JSON.parse(exportedJson);

    if (!parsed.thresholds || !Array.isArray(parsed.thresholds)) {
      throw new Error("Invalid threshold export format");
    }

    const thresholdsCode = JSON.stringify(parsed.thresholds, null, 2);

    return `/**
 * Default threshold configurations
 *
 * Generated from export on ${parsed.exportedAt}
 */
export const DEFAULT_THRESHOLDS: ThresholdConfig[] = ${thresholdsCode};`;
  } catch (error) {
    throw new Error(
      `Failed to convert to TypeScript: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validates an exported threshold configuration
 *
 * @param exportedJson - The exported JSON string
 * @returns Validation result with any errors
 */
export function validateExport(exportedJson: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(exportedJson);

    if (!parsed.thresholds) {
      errors.push("Missing 'thresholds' property");
    } else if (!Array.isArray(parsed.thresholds)) {
      errors.push("'thresholds' must be an array");
    } else {
      // Validate each threshold
      parsed.thresholds.forEach((threshold: unknown, index: number) => {
        const t = threshold as Record<string, unknown>;
        if (!t.id) {
          errors.push(`Threshold ${index}: missing 'id'`);
        }
        if (typeof t.percentage !== "number") {
          errors.push(`Threshold ${index}: 'percentage' must be a number`);
        }
        if (
          typeof t.percentage === "number" &&
          (t.percentage < 0 || t.percentage > 100)
        ) {
          errors.push(
            `Threshold ${index}: 'percentage' must be between 0 and 100`
          );
        }
        if (!t.plans || !Array.isArray(t.plans)) {
          errors.push(`Threshold ${index}: 'plans' must be an array`);
        } else if (t.plans.length === 0) {
          errors.push(`Threshold ${index}: 'plans' cannot be empty`);
        }
        if (!t.areas || !Array.isArray(t.areas)) {
          errors.push(`Threshold ${index}: 'areas' must be an array`);
        } else if (t.areas.length === 0) {
          errors.push(`Threshold ${index}: 'areas' cannot be empty`);
        }
        if (!t.severity) {
          errors.push(`Threshold ${index}: missing 'severity'`);
        }
        if (!t.message) {
          errors.push(`Threshold ${index}: missing 'message'`);
        }
        if (typeof t.enabled !== "boolean") {
          errors.push(`Threshold ${index}: 'enabled' must be a boolean`);
        }
        if (typeof t.dismissable !== "boolean") {
          errors.push(`Threshold ${index}: 'dismissable' must be a boolean`);
        }
        if (typeof t.static !== "boolean") {
          errors.push(`Threshold ${index}: 'static' must be a boolean`);
        }
      });
    }

    if (!parsed.version) {
      errors.push("Missing 'version' property");
    }
  } catch (error) {
    errors.push(
      `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a clean export from threshold configurations
 *
 * @param thresholds - Array of threshold configurations
 * @returns Export object ready to be stringified
 */
export function createExport(thresholds: ThresholdConfig[]): ThresholdExport {
  return {
    thresholds,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
}

/**
 * Imports and validates threshold configuration
 *
 * @param exportedJson - The exported JSON string
 * @returns Parsed threshold configurations or throws error
 */
export function importThresholds(exportedJson: string): ThresholdConfig[] {
  const validation = validateExport(exportedJson);

  if (!validation.valid) {
    throw new Error(
      `Invalid threshold configuration:\n${validation.errors.join("\n")}`
    );
  }

  const parsed: ThresholdExport = JSON.parse(exportedJson);
  return parsed.thresholds;
}
