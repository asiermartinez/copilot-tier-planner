/**
 * User State Type Definitions
 *
 * Defines the structure for representing a user's current GitHub Copilot
 * license state, including subscription details, usage tracking, and billing information.
 */

import { SkuId } from "./sku";

/**
 * Billing period tracking
 */
export interface BillingPeriod {
  /** Start date of the current billing period (ISO 8601) */
  startDate: string;
  /** End date of the current billing period (ISO 8601) */
  endDate: string;
  /** Whether this is a pro-rated period (e.g., after mid-cycle plan change) */
  isProRated: boolean;
  /** Number of days in the billing period */
  daysInPeriod: number;
  /** Number of days remaining in the period */
  daysRemaining: number;
}

/**
 * Usage tracking for a specific resource type
 */
export interface ResourceUsage {
  /** Current usage count in the billing period */
  current: number;
  /** Quota limit for this resource (null for unlimited) */
  limit: number | null;
  /** Amount over the quota (0 if under quota) */
  overage: number;
  /** Cost of overage in USD */
  overageCostUsd: number;
  /** Percentage of quota used (0-100, null if unlimited) */
  percentageUsed: number | null;
  /** Whether the quota has been exceeded */
  isOverQuota: boolean;
  /** Whether usage is currently blocked due to quota/budget limits */
  isBlocked: boolean;
  /** Reason for blocking (if blocked) */
  blockReason?: string | null;
  /** Warning threshold percentage (e.g., 80 for 80%) */
  warningThreshold: number;
  /** Whether the warning threshold has been reached */
  hasReachedWarning: boolean;
  /** Last usage timestamp (ISO 8601) */
  lastUsedAt?: string | null;
}

/**
 * Premium request usage with additional purchased requests
 */
export interface PremiumRequestUsage extends ResourceUsage {
  /** Number of additional premium requests purchased */
  additionalPurchased: number;
  /** Expiration date for purchased requests (ISO 8601, null if no expiration) */
  purchasedExpiresAt: string | null;
  /** Usage from base quota */
  usedFromBaseQuota: number;
  /** Usage from purchased additional requests */
  usedFromPurchased: number;
}

/**
 * Overage budget tracking
 */
export interface OverageBudget {
  /** Maximum budget allocated for overages in USD */
  maxBudgetUsd: number;
  /** Current amount spent on overages in the billing period in USD */
  currentSpentUsd: number;
  /** Remaining budget in USD */
  remainingBudgetUsd: number;
  /** Percentage of budget consumed (0-100) */
  percentageConsumed: number;
  /** Whether to block usage when budget is exceeded */
  blockWhenExceeded: boolean;
  /** Whether the budget has been exceeded */
  isBudgetExceeded: boolean;
  /** Alert thresholds (percentages, e.g., [50, 75, 90, 100]) */
  alertThresholds: number[];
  /** Thresholds that have been crossed */
  crossedThresholds: number[];
  /** Whether alerts are enabled */
  enableAlerts: boolean;
}

/**
 * Cost breakdown for the current billing period
 */
export interface CostBreakdown {
  /** Base subscription cost in USD */
  baseSubscriptionUsd: number;
  /** Cost of overages in USD */
  overageCostsUsd: number;
  /** Cost of additional purchased requests in USD */
  additionalPurchasesUsd: number;
  /** Total cost for the period in USD */
  totalCostUsd: number;
  /** Projected cost for the full billing period based on current usage */
  projectedTotalUsd: number;
}

/**
 * Account information
 */
export interface AccountInfo {
  /** User ID or account identifier */
  userId: string;
  /** Username or display name */
  username: string;
  /** Account type */
  accountType: "individual" | "organization" | "enterprise";
  /** Email address */
  email?: string;
  /** Organization name (for org/enterprise accounts) */
  organizationName?: string;
  /** Number of seats (for organization plans) */
  seats?: number;
}

/**
 * Subscription details
 */
export interface Subscription {
  /** Current SKU ID */
  skuId: SkuId;
  /** Subscription start date (ISO 8601) */
  startDate: string;
  /** Subscription status */
  status: "active" | "trial" | "suspended" | "cancelled" | "expired";
  /** Whether this is an annual or monthly subscription */
  billingFrequency: "monthly" | "annual";
  /** Whether auto-renewal is enabled */
  autoRenew: boolean;
  /** Next renewal date (ISO 8601, null if not auto-renewing) */
  nextRenewalDate: string | null;
  /** Trial end date (ISO 8601, null if not on trial) */
  trialEndsAt: string | null;
  /** Days remaining in trial (null if not on trial) */
  trialDaysRemaining: number | null;
}

/**
 * Main user state interface
 *
 * Represents the complete state of a user's GitHub Copilot license,
 * including subscription details, usage tracking, and billing information.
 */
export interface UserState {
  /** Unique identifier for this state snapshot */
  id: string;
  /** Timestamp when this state was captured (ISO 8601) */
  timestamp: string;
  /** Version of the state schema (for future compatibility) */
  version: string;

  /** Account information */
  account: AccountInfo;

  /** Current subscription details */
  subscription: Subscription;

  /** Current billing period */
  billingPeriod: BillingPeriod;

  /** Usage tracking */
  usage: {
    /** Premium request usage with purchased additional requests */
    premiumRequests: PremiumRequestUsage;
    /** Chat message usage */
    chatMessages: ResourceUsage;
    /** Code completion usage */
    codeCompletions: ResourceUsage;
  };

  /** Overage budget (null if overage billing not supported or not configured) */
  overageBudget: OverageBudget | null;

  /** Cost breakdown for the current period */
  costs: CostBreakdown;

  /** Custom metadata for extensions */
  metadata?: Record<string, unknown>;
}

/**
 * Simplified user state for initial setup or URL sharing
 */
export interface SimpleUserState {
  /** Current SKU ID */
  skuId: SkuId;
  /** Account type */
  accountType: "individual" | "organization" | "enterprise";
  /** Number of seats (for org plans) */
  seats?: number;
  /** Premium requests used this period */
  premiumRequestsUsed: number;
  /** Chat messages used this period (null for unlimited) */
  chatMessagesUsed?: number | null;
  /** Code completions used this period (null for unlimited) */
  codeCompletionsUsed?: number | null;
  /** Overage budget in USD (null if not configured) */
  overageBudgetUsd?: number | null;
  /** Days into the billing period */
  daysIntoPeriod?: number;
}

/**
 * Type guard to check if a user state is valid
 */
export function isValidUserState(state: unknown): state is UserState {
  if (typeof state !== "object" || state === null) return false;

  const s = state as Partial<UserState>;

  return !!(
    s.id &&
    s.timestamp &&
    s.version &&
    s.account &&
    s.subscription &&
    s.billingPeriod &&
    s.usage &&
    s.costs
  );
}

/**
 * Alert types for user notifications
 */
export enum AlertType {
  /** Quota warning threshold reached */
  QUOTA_WARNING = "quota_warning",
  /** Quota limit reached or exceeded */
  QUOTA_EXCEEDED = "quota_exceeded",
  /** Budget warning threshold reached */
  BUDGET_WARNING = "budget_warning",
  /** Budget limit exceeded */
  BUDGET_EXCEEDED = "budget_exceeded",
  /** Usage is blocked */
  USAGE_BLOCKED = "usage_blocked",
  /** Upgrade recommended */
  UPGRADE_RECOMMENDED = "upgrade_recommended",
  /** Trial expiring soon */
  TRIAL_EXPIRING = "trial_expiring",
  /** Renewal upcoming */
  RENEWAL_UPCOMING = "renewal_upcoming",
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * User alert notification
 */
export interface UserAlert {
  /** Alert type */
  type: AlertType;
  /** Severity level */
  severity: AlertSeverity;
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Timestamp when alert was generated (ISO 8601) */
  timestamp: string;
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
  /** Suggested actions */
  actions?: Array<{
    /** Action label */
    label: string;
    /** Action type */
    type: "upgrade" | "purchase" | "configure" | "dismiss";
    /** Action metadata */
    metadata?: Record<string, unknown>;
  }>;
}
