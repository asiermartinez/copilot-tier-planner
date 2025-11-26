/**
 * Configurable Threshold System Types
 *
 * Defines the structure for user-configurable alert thresholds.
 * Users can define when alerts appear, what severity they have, and what message to show.
 */

/**
 * What metric the threshold applies to
 */
export type ThresholdMetric = "quota" | "overage" | "both";

/**
 * Which plans this threshold applies to
 */
export type ThresholdPlanFilter =
  | "all" // Applies to all plans
  | "free-only" // Only for Free tier
  | "paid-only"; // Only for Pro, Pro+, Business, Enterprise

/**
 * Alert severity levels for banners (maps to Primer Banner variants)
 */
export type ThresholdSeverity =
  | "info"
  | "warning"
  | "critical"
  | "success"
  | "upsell";

/**
 * A single threshold configuration
 */
export interface ThresholdConfig {
  /** Unique identifier for this threshold */
  id: string;
  /** Percentage level that triggers this threshold (0-100) */
  percentage: number;
  /** Which metric this threshold applies to */
  appliesTo: ThresholdMetric;
  /** Which plans this threshold applies to (optional, defaults to "all") */
  planFilter?: ThresholdPlanFilter;
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
}

/**
 * Collection of all user-configured thresholds
 */
export interface ThresholdsConfig {
  /** List of threshold configurations */
  thresholds: ThresholdConfig[];
}

/**
 * Default threshold configurations
 */
export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  {
    id: "quota-warning-75",
    percentage: 75,
    appliesTo: "quota",
    planFilter: "all",
    severity: "warning",
    message: "You've used {percentage}% of your quota",
    enabled: true,
    dismissable: true,
    static: false,
  },
  {
    id: "quota-critical-90",
    percentage: 90,
    appliesTo: "quota",
    planFilter: "all",
    severity: "critical",
    message: "Approaching quota limit: {current} of {limit} requests used",
    enabled: true,
    dismissable: true,
    static: false,
  },
  {
    id: "quota-exceeded-free-tier",
    percentage: 100,
    appliesTo: "quota",
    planFilter: "free-only",
    severity: "critical",
    message: "Quota limit reached. Upgrade to {nextPlan} for more requests.",
    enabled: true,
    dismissable: false,
    static: true,
    cta: {
      label: "Upgrade to {nextPlan}",
    },
  },
  {
    id: "quota-exceeded-no-budget",
    percentage: 100,
    appliesTo: "quota",
    planFilter: "paid-only",
    severity: "critical",
    message: "Quota limit reached. Set up an overage budget to continue.",
    enabled: true,
    dismissable: false,
    static: true,
    cta: {
      label: "Set up overage budget",
    },
  },
  {
    id: "quota-reached-with-budget",
    percentage: 100,
    appliesTo: "quota",
    planFilter: "paid-only",
    severity: "info",
    message:
      "Quota limit reached. Now using overage budget ({overage} overage requests)",
    enabled: true,
    dismissable: true,
    static: false,
  },
  {
    id: "overage-warning-75",
    percentage: 75,
    appliesTo: "overage",
    planFilter: "paid-only",
    severity: "warning",
    message: "You've used {budgetPercentage}% of your overage budget",
    enabled: true,
    dismissable: true,
    static: false,
  },
  {
    id: "overage-critical-90",
    percentage: 90,
    appliesTo: "overage",
    planFilter: "paid-only",
    severity: "critical",
    message: "Overage budget nearly exhausted: ${budgetRemaining} remaining",
    enabled: true,
    dismissable: true,
    static: false,
  },
  {
    id: "overage-exceeded-100",
    percentage: 100,
    appliesTo: "overage",
    planFilter: "paid-only",
    severity: "critical",
    message: "Overage budget limit reached",
    enabled: true,
    dismissable: false,
    static: true,
    cta: {
      label: "Upgrade to {nextPlan}",
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

  // Time-related
  daysRemaining: number;
  daysInPeriod: number;
}
