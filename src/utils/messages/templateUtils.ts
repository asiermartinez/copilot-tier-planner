/**
 * Template Utilities
 *
 * Shared utilities for replacing placeholders in message templates.
 */

import type { TemplateValues } from "@/types/messages/customMessages";

/**
 * Replace template placeholders in a message string with actual values
 *
 * @param template - Message template with {placeholder} syntax
 * @param values - Object mapping placeholder names to values
 * @returns Message with placeholders replaced
 *
 * @example
 * replaceTemplate("You have used {percentage}% of your quota", { percentage: 75 })
 * // Returns: "You have used 75% of your quota"
 *
 * @example
 * replaceTemplate("Using {current} of {limit} requests", { current: 1500, limit: 2000 })
 * // Returns: "Using 1,500 of 2,000 requests"
 */
export function replaceTemplate(
  template: string,
  values: TemplateValues
): string {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      // Format numbers with commas for readability
      const formattedValue =
        typeof value === "number" && Number.isInteger(value)
          ? value.toLocaleString("en-US")
          : String(value);

      // Replace all occurrences of {key} with the formatted value
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, formattedValue);
    }
  }

  return result;
}
