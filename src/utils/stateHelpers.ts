/**
 * State Helper Utilities
 *
 * Validation, serialization/deserialization, and formatting utilities
 * for user state management. Complements the existing calculation
 * utilities in usageCalculations.ts.
 */

import type {
  UserState,
  SimpleUserState,
  AccountInfo,
  Subscription,
  BillingPeriod,
  ResourceUsage,
  PremiumRequestUsage,
  OverageBudget,
  UserAlert,
} from "@/types/userState";
import type { SkuId } from "@/types/sku";

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates account information
 */
export function validateAccountInfo(account: unknown): account is AccountInfo {
  if (typeof account !== "object" || account === null) return false;

  const a = account as Partial<AccountInfo>;

  if (!a.userId || typeof a.userId !== "string") return false;
  if (!a.username || typeof a.username !== "string") return false;
  if (
    !["individual", "organization", "enterprise"].includes(
      a.accountType as string
    )
  ) {
    return false;
  }

  // Optional fields validation
  if (a.email !== undefined && typeof a.email !== "string") return false;
  if (
    a.organizationName !== undefined &&
    typeof a.organizationName !== "string"
  ) {
    return false;
  }
  if (a.seats !== undefined && (typeof a.seats !== "number" || a.seats < 1)) {
    return false;
  }

  return true;
}

/**
 * Validates subscription details
 */
export function validateSubscription(
  subscription: unknown
): subscription is Subscription {
  if (typeof subscription !== "object" || subscription === null) return false;

  const s = subscription as Partial<Subscription>;

  if (!s.skuId || typeof s.skuId !== "string") return false;
  if (!s.startDate || !isValidISODate(s.startDate)) return false;
  if (
    !["active", "trial", "suspended", "cancelled", "expired"].includes(
      s.status as string
    )
  ) {
    return false;
  }
  if (!["monthly", "annual"].includes(s.billingFrequency as string))
    return false;
  if (typeof s.autoRenew !== "boolean") return false;

  // Optional fields
  if (s.nextRenewalDate !== null && s.nextRenewalDate !== undefined) {
    if (!isValidISODate(s.nextRenewalDate)) return false;
  }
  if (s.trialEndsAt !== null && s.trialEndsAt !== undefined) {
    if (!isValidISODate(s.trialEndsAt)) return false;
  }
  if (s.trialDaysRemaining !== null && s.trialDaysRemaining !== undefined) {
    if (typeof s.trialDaysRemaining !== "number" || s.trialDaysRemaining < 0)
      return false;
  }

  return true;
}

/**
 * Validates billing period
 */
export function validateBillingPeriod(
  period: unknown
): period is BillingPeriod {
  if (typeof period !== "object" || period === null) return false;

  const p = period as Partial<BillingPeriod>;

  if (!p.startDate || !isValidISODate(p.startDate)) return false;
  if (!p.endDate || !isValidISODate(p.endDate)) return false;
  if (typeof p.isProRated !== "boolean") return false;
  if (typeof p.daysInPeriod !== "number" || p.daysInPeriod < 1) return false;
  if (typeof p.daysRemaining !== "number" || p.daysRemaining < 0) return false;

  // End date should be after start date
  if (new Date(p.endDate) <= new Date(p.startDate)) return false;

  return true;
}

/**
 * Validates resource usage
 */
export function validateResourceUsage(usage: unknown): usage is ResourceUsage {
  if (typeof usage !== "object" || usage === null) return false;

  const u = usage as Partial<ResourceUsage>;

  if (typeof u.current !== "number" || u.current < 0) return false;
  if (u.limit !== null && (typeof u.limit !== "number" || u.limit < 0))
    return false;
  if (typeof u.overage !== "number" || u.overage < 0) return false;
  if (typeof u.overageCostUsd !== "number" || u.overageCostUsd < 0)
    return false;
  if (
    u.percentageUsed !== null &&
    (typeof u.percentageUsed !== "number" || u.percentageUsed < 0)
  ) {
    return false;
  }
  if (typeof u.isOverQuota !== "boolean") return false;
  if (typeof u.isBlocked !== "boolean") return false;
  if (
    typeof u.warningThreshold !== "number" ||
    u.warningThreshold < 0 ||
    u.warningThreshold > 100
  ) {
    return false;
  }
  if (typeof u.hasReachedWarning !== "boolean") return false;

  // Optional fields
  if (
    u.blockReason !== undefined &&
    u.blockReason !== null &&
    typeof u.blockReason !== "string"
  ) {
    return false;
  }
  if (
    u.lastUsedAt !== undefined &&
    u.lastUsedAt !== null &&
    !isValidISODate(u.lastUsedAt)
  ) {
    return false;
  }

  return true;
}

/**
 * Validates premium request usage (extends ResourceUsage)
 */
export function validatePremiumRequestUsage(
  usage: unknown
): usage is PremiumRequestUsage {
  if (!validateResourceUsage(usage)) return false;

  const u = usage as Partial<PremiumRequestUsage>;

  if (typeof u.additionalPurchased !== "number" || u.additionalPurchased < 0)
    return false;
  if (
    u.purchasedExpiresAt !== null &&
    u.purchasedExpiresAt !== undefined &&
    !isValidISODate(u.purchasedExpiresAt)
  )
    return false;
  if (typeof u.usedFromBaseQuota !== "number" || u.usedFromBaseQuota < 0)
    return false;
  if (typeof u.usedFromPurchased !== "number" || u.usedFromPurchased < 0)
    return false;

  return true;
}

/**
 * Validates overage budget
 */
export function validateOverageBudget(
  budget: unknown
): budget is OverageBudget {
  if (typeof budget !== "object" || budget === null) return false;

  const b = budget as Partial<OverageBudget>;

  if (typeof b.maxBudgetUsd !== "number" || b.maxBudgetUsd < 0) return false;
  if (typeof b.currentSpentUsd !== "number" || b.currentSpentUsd < 0)
    return false;
  if (typeof b.remainingBudgetUsd !== "number") return false;
  if (typeof b.percentageConsumed !== "number" || b.percentageConsumed < 0)
    return false;
  if (typeof b.blockWhenExceeded !== "boolean") return false;
  if (typeof b.isBudgetExceeded !== "boolean") return false;
  if (!Array.isArray(b.alertThresholds)) return false;
  if (!Array.isArray(b.crossedThresholds)) return false;
  if (typeof b.enableAlerts !== "boolean") return false;

  // Validate threshold arrays contain valid numbers
  if (
    !b.alertThresholds.every(t => typeof t === "number" && t >= 0 && t <= 100)
  ) {
    return false;
  }
  if (
    !b.crossedThresholds.every(t => typeof t === "number" && t >= 0 && t <= 100)
  ) {
    return false;
  }

  return true;
}

/**
 * Validates complete user state
 */
export function validateUserState(state: unknown): state is UserState {
  if (typeof state !== "object" || state === null) return false;

  const s = state as Partial<UserState>;

  // Required fields
  if (!s.id || typeof s.id !== "string") return false;
  if (!s.timestamp || !isValidISODate(s.timestamp)) return false;
  if (!s.version || typeof s.version !== "string") return false;

  // Validate nested objects
  if (!validateAccountInfo(s.account)) return false;
  if (!validateSubscription(s.subscription)) return false;
  if (!validateBillingPeriod(s.billingPeriod)) return false;

  // Validate usage
  if (!s.usage || typeof s.usage !== "object") return false;
  if (!validatePremiumRequestUsage(s.usage.premiumRequests)) return false;
  if (!validateResourceUsage(s.usage.chatMessages)) return false;
  if (!validateResourceUsage(s.usage.codeCompletions)) return false;

  // Validate overage budget (nullable)
  if (s.overageBudget !== null && !validateOverageBudget(s.overageBudget))
    return false;

  // Validate costs
  if (!s.costs || typeof s.costs !== "object") return false;
  const c = s.costs;
  if (
    typeof c.baseSubscriptionUsd !== "number" ||
    typeof c.overageCostsUsd !== "number" ||
    typeof c.additionalPurchasesUsd !== "number" ||
    typeof c.totalCostUsd !== "number" ||
    typeof c.projectedTotalUsd !== "number"
  ) {
    return false;
  }

  return true;
}

/**
 * Validates simplified user state
 */
export function validateSimpleUserState(
  state: unknown
): state is SimpleUserState {
  if (typeof state !== "object" || state === null) return false;

  const s = state as Partial<SimpleUserState>;

  if (!s.skuId || typeof s.skuId !== "string") return false;
  if (typeof s.premiumRequestsUsed !== "number" || s.premiumRequestsUsed < 0)
    return false;

  // Optional fields
  if (s.seats !== undefined && (typeof s.seats !== "number" || s.seats < 1))
    return false;
  if (s.chatMessagesUsed !== undefined && s.chatMessagesUsed !== null) {
    if (typeof s.chatMessagesUsed !== "number" || s.chatMessagesUsed < 0)
      return false;
  }
  if (s.codeCompletionsUsed !== undefined && s.codeCompletionsUsed !== null) {
    if (typeof s.codeCompletionsUsed !== "number" || s.codeCompletionsUsed < 0)
      return false;
  }
  if (s.overageBudgetUsd !== undefined && s.overageBudgetUsd !== null) {
    if (typeof s.overageBudgetUsd !== "number" || s.overageBudgetUsd < 0)
      return false;
  }
  if (
    s.daysIntoPeriod !== undefined &&
    (typeof s.daysIntoPeriod !== "number" || s.daysIntoPeriod < 0)
  ) {
    return false;
  }

  return true;
}

// ============================================================================
// SERIALIZATION / DESERIALIZATION
// ============================================================================

/**
 * Serializes user state to JSON string
 */
export function serializeUserState(state: UserState): string {
  try {
    return JSON.stringify(state);
  } catch (error) {
    throw new Error(
      `Failed to serialize user state: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deserializes JSON string to user state
 */
export function deserializeUserState(json: string): UserState {
  try {
    const parsed = JSON.parse(json);
    if (!validateUserState(parsed)) {
      throw new Error("Invalid user state structure");
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to deserialize user state: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Serializes simplified user state to JSON string
 */
export function serializeSimpleUserState(state: SimpleUserState): string {
  try {
    return JSON.stringify(state);
  } catch (error) {
    throw new Error(
      `Failed to serialize simple user state: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deserializes JSON string to simplified user state
 */
export function deserializeSimpleUserState(json: string): SimpleUserState {
  try {
    const parsed = JSON.parse(json);
    if (!validateSimpleUserState(parsed)) {
      throw new Error("Invalid simple user state structure");
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to deserialize simple user state: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Converts full user state to simplified version
 */
export function toSimpleUserState(state: UserState): SimpleUserState {
  return {
    skuId: state.subscription.skuId,
    accountType: state.account.accountType,
    seats: state.account.seats,
    premiumRequestsUsed: state.usage.premiumRequests.current,
    chatMessagesUsed:
      state.usage.chatMessages.limit !== null
        ? state.usage.chatMessages.current
        : null,
    codeCompletionsUsed:
      state.usage.codeCompletions.limit !== null
        ? state.usage.codeCompletions.current
        : null,
    overageBudgetUsd: state.overageBudget?.maxBudgetUsd ?? null,
    daysIntoPeriod:
      state.billingPeriod.daysInPeriod - state.billingPeriod.daysRemaining,
  };
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats a number as currency (USD)
 */
export function formatCurrency(
  amount: number,
  showCents: boolean = true
): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  return formatter.format(amount);
}

/**
 * Formats a percentage value
 */
export function formatPercentage(
  value: number | null,
  decimals: number = 0
): string {
  if (value === null) return "N/A";
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a large number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Formats quota usage (e.g., "250 / 300" or "250 / Unlimited")
 */
export function formatQuotaUsage(
  current: number,
  limit: number | null
): string {
  const currentFormatted = formatNumber(current);
  const limitFormatted = limit !== null ? formatNumber(limit) : "Unlimited";
  return `${currentFormatted} / ${limitFormatted}`;
}

/**
 * Formats a date string to user-friendly format
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return isoDate;
  }
}

/**
 * Formats a date to short format (e.g., "Jan 15, 2025")
 */
export function formatDateShort(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return isoDate;
  }
}

/**
 * Formats a date to relative time (e.g., "in 5 days", "2 days ago")
 */
export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    if (diffDays === -1) return "yesterday";
    if (diffDays > 0) return `in ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  } catch {
    return isoDate;
  }
}

/**
 * Formats days remaining (e.g., "15 days", "1 day")
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

/**
 * Formats subscription status with user-friendly label
 */
export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Active",
    trial: "Trial",
    suspended: "Suspended",
    cancelled: "Cancelled",
    expired: "Expired",
  };
  return statusMap[status] || status;
}

/**
 * Formats account type
 */
export function formatAccountType(type: string): string {
  const typeMap: Record<string, string> = {
    individual: "Individual",
    organization: "Organization",
    enterprise: "Enterprise",
  };
  return typeMap[type] || type;
}

/**
 * Formats SKU ID to display name
 */
export function formatSkuId(skuId: SkuId): string {
  const nameMap: Record<SkuId, string> = {
    free: "Free",
    pro: "Pro",
    "pro-plus": "Pro+",
    business: "Business",
    enterprise: "Enterprise",
  };
  return nameMap[skuId] || skuId;
}

/**
 * Formats overage amount with units
 */
export function formatOverage(amount: number, resourceType: string): string {
  const unitMap: Record<string, string> = {
    premiumRequests: "requests",
    chatMessages: "messages",
    codeCompletions: "completions",
  };
  const unit = unitMap[resourceType] || "units";
  return `${formatNumber(amount)} ${unit}`;
}

/**
 * Formats budget consumption with visual indicator
 */
export function formatBudgetConsumption(
  consumed: number,
  total: number
): string {
  const percentage = (consumed / total) * 100;
  const percentageStr = formatPercentage(percentage, 1);
  const consumedStr = formatCurrency(consumed);
  const totalStr = formatCurrency(total);
  return `${consumedStr} / ${totalStr} (${percentageStr})`;
}

/**
 * Creates a user-friendly alert message
 */
export function formatAlertMessage(alert: UserAlert): string {
  return `${alert.title}: ${alert.message}`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates ISO 8601 date string
 */
function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
  } catch {
    return false;
  }
}

/**
 * Deep clones a user state object
 */
export function cloneUserState(state: UserState): UserState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Sanitizes user state by removing sensitive information
 */
export function sanitizeUserState(state: UserState): UserState {
  const sanitized = cloneUserState(state);

  // Remove potentially sensitive information
  if (sanitized.account.email) {
    sanitized.account.email = "***@***.***";
  }
  if (sanitized.account.userId) {
    sanitized.account.userId = `user-${sanitized.account.userId.slice(-4)}`;
  }

  return sanitized;
}

/**
 * Checks if a user state is stale (older than specified minutes)
 */
export function isStateStale(
  state: UserState,
  maxAgeMinutes: number = 60
): boolean {
  try {
    const stateTime = new Date(state.timestamp).getTime();
    const now = Date.now();
    const ageMinutes = (now - stateTime) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  } catch {
    return true;
  }
}

/**
 * Generates a summary of user state for logging/debugging
 */
export function summarizeUserState(state: UserState): string {
  return [
    `State: ${state.id}`,
    `SKU: ${formatSkuId(state.subscription.skuId)}`,
    `Status: ${formatSubscriptionStatus(state.subscription.status)}`,
    `Premium Requests: ${formatQuotaUsage(state.usage.premiumRequests.current, state.usage.premiumRequests.limit)}`,
    `Total Cost: ${formatCurrency(state.costs.totalCostUsd)}`,
    `Days Remaining: ${formatDaysRemaining(state.billingPeriod.daysRemaining)}`,
  ].join(" | ");
}
