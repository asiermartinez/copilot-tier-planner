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
      const formattedValue = typeof value === "number" && Number.isInteger(value)
        ? value.toLocaleString()
        : String(value);

      // Replace all occurrences of {key} with the formatted value
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, formattedValue);
    }
  }

  return result;
}

/**
 * Extract placeholders from a template string
 *
 * @param template - Message template
 * @returns Array of placeholder names found in the template
 *
 * @example
 * extractPlaceholders("You have {current} of {limit} requests")
 * // Returns: ["current", "limit"]
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];

  return matches.map(match => match.slice(1, -1)); // Remove { and }
}

/**
 * Validate that all required placeholders are provided
 *
 * @param template - Message template
 * @param values - Provided values
 * @returns True if all placeholders have values
 */
export function validateTemplate(
  template: string,
  values: TemplateValues
): boolean {
  const placeholders = extractPlaceholders(template);
  return placeholders.every(placeholder => {
    const value = values[placeholder as keyof TemplateValues];
    return value !== undefined && value !== null;
  });
}
