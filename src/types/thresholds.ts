/**
 * Configurable Threshold System Types
 *
 * Defines the structure for user-configurable alert thresholds.
 * Users can define when alerts appear, what severity they have, and what message to show.
 */

import type { SkuId } from "./sku";

/**
 * What area the threshold applies to
 */
export type ThresholdArea = "quota" | "overage";

/**
 * Alert severity levels for banners (maps to Primer Banner variants)
 */
export type ThresholdSeverity =
  "info" | "warning" | "critical" | "success" | "upsell";

/**
 * A single threshold configuration
 */
export interface ThresholdConfig {
  /** Unique identifier for this threshold */
  id: string;
  /** Percentage level that triggers this threshold (0-100) */
  percentage: number;
  /** Which SKU plans this threshold applies to (must have at least one) */
  plans: SkuId[];
  /** Which areas this threshold applies to (quota, overage, or both - must have at least one) */
  areas: ThresholdArea[];
  /** Banner severity when this threshold is triggered */
  severity: ThresholdSeverity;
  /** Message template to display (supports placeholders) */
  message: string;
  /** Whether this threshold is enabled */
  enabled: boolean;
  /** Whether the banner can be dismissed by the user */
  dismissable: boolean;
  /** Whether the banner is static (shows state when triggered) or dynamic (updates with current state) */
  static: boolean;
  /** Optional call-to-action button configuration */
  cta?: {
    /** Button text */
    label: string;
  };
  /** Optional billing period constraint configuration */
  billingPeriod?: {
    /** Maximum days into billing period for this threshold to apply */
    maxDaysIntoPeriod: number;
  };
}

/**
 * Collection of all user-configured thresholds
 */
export interface ThresholdsConfig {
  /** List of threshold configurations */
  thresholds: ThresholdConfig[];
  /** Last modified timestamp */
  modifiedAt?: string;
}

/**
 * Default threshold configurations
 */

export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  {
    id: "threshold-1764251183483",
    percentage: 50,
    plans: ["free"],
    areas: ["quota"],
    severity: "info",
    message: "You've used {percentage}% of your free requests this month",
    enabled: true,
    dismissable: true,
    static: true,
    cta: {
      label: "{actionType} {targetPlan}",
    },
  },
  {
    id: "threshold-1764251237111",
    percentage: 100,
    plans: ["free"],
    areas: ["quota"],
    severity: "upsell",
    message:
      "You have reached your free plan limit. Limit resets on {resetDate}",
    enabled: true,
    dismissable: false,
    static: false,
    cta: {
      label: "{actionType} {targetPlan}",
    },
  },
];

/**
 * Template variables available for threshold messages
 */
export interface ThresholdTemplateContext {
  // Quota-related
  current: number;
  limit: number;
  percentage: number;
  remaining: number;
  overage: number;
  overageRemaining: number;

  // Budget-related
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetPercentage: number;

  // Plan-related
  planName: string;
  nextPlan: string;

  // Desired path action (for CTAs)
  actionType: string;
  targetPlan: string;

  // Time-related
  daysRemaining: number;
  daysInPeriod: number;
  resetDate: string;
}
