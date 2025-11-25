/**
 * Mock User State Data
 *
 * Comprehensive set of mock user states for testing different scenarios
 * and edge cases in the SKU Planner application.
 *
 * All states are generated from SKU definitions to ensure consistency.
 */

import type { UserState } from "@/types/userState";
import { generateUserState } from "@/utils/mockStateGenerator";

/**
 * Scenario 1: FREE user - Under quota
 * User on FREE plan using minimal resources, well under limits
 */
export const FREE_UNDER_QUOTA: UserState = generateUserState({
  id: "free-under-quota",
  timestamp: "2025-01-15T10:00:00Z",
  skuId: "free",
  account: {
    userId: "user-001",
    username: "alice-dev",
    accountType: "individual",
    email: "alice@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 16,
  },
  usage: {
    premiumRequests: 15,
    chatMessages: 20,
    codeCompletions: 450,
  },
});

/**
 * Scenario 2: FREE user - At warning threshold
 * User on FREE plan who has reached the 80% warning threshold
 */
export const FREE_AT_WARNING: UserState = generateUserState({
  id: "free-at-warning",
  timestamp: "2025-01-20T14:30:00Z",
  skuId: "free",
  account: {
    userId: "user-002",
    username: "bob-coder",
    accountType: "individual",
    email: "bob@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 11,
  },
  usage: {
    premiumRequests: 41,
    chatMessages: 42,
    codeCompletions: 1650,
  },
});

/**
 * Scenario 3: FREE user - Over quota (blocked)
 * User on FREE plan who has exceeded all quotas and is blocked
 */
export const FREE_OVER_QUOTA: UserState = generateUserState({
  id: "free-over-quota",
  timestamp: "2025-01-25T09:15:00Z",
  skuId: "free",
  account: {
    userId: "user-003",
    username: "carol-learner",
    accountType: "individual",
    email: "carol@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 6,
  },
  usage: {
    premiumRequests: 55,
    chatMessages: 58,
    codeCompletions: 2150,
  },
});

/**
 * Scenario 4: PRO user - Under quota
 * User on PRO plan with comfortable usage levels
 */
export const PRO_UNDER_QUOTA: UserState = generateUserState({
  id: "pro-under-quota",
  timestamp: "2025-01-15T10:00:00Z",
  skuId: "pro",
  account: {
    userId: "user-004",
    username: "david-pro",
    accountType: "individual",
    email: "david@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 16,
  },
  usage: {
    premiumRequests: 120,
    chatMessages: 450,
    codeCompletions: 8500,
  },
  overageBudget: {
    maxBudgetUsd: 50,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 5: PRO user - With overage charges
 * User on PRO plan who has exceeded premium requests quota and is accruing overage charges
 */
export const PRO_WITH_OVERAGE: UserState = generateUserState({
  id: "pro-with-overage",
  timestamp: "2025-01-20T16:45:00Z",
  skuId: "pro",
  account: {
    userId: "user-005",
    username: "eve-power",
    accountType: "individual",
    email: "eve@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 11,
  },
  usage: {
    premiumRequests: 425,
    chatMessages: 1200,
    codeCompletions: 15000,
  },
  overageBudget: {
    maxBudgetUsd: 25,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 6: PRO user - Budget exhausted (blocked)
 * User on PRO plan who has exceeded their overage budget and is now blocked
 */
export const PRO_BUDGET_EXHAUSTED: UserState = generateUserState({
  id: "pro-budget-exhausted",
  timestamp: "2025-01-22T11:20:00Z",
  skuId: "pro",
  account: {
    userId: "user-006",
    username: "frank-heavy",
    accountType: "individual",
    email: "frank@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 9,
  },
  usage: {
    premiumRequests: 2800,
    chatMessages: 2500,
    codeCompletions: 25000,
  },
  overageBudget: {
    maxBudgetUsd: 100,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 7: PRO user - With additional purchased requests
 * User on PRO plan who purchased additional premium requests to extend their quota
 */
export const PRO_WITH_PURCHASED: UserState = generateUserState({
  id: "pro-with-purchased",
  timestamp: "2025-01-18T13:00:00Z",
  skuId: "pro",
  account: {
    userId: "user-007",
    username: "grace-smart",
    accountType: "individual",
    email: "grace@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 13,
  },
  usage: {
    premiumRequests: 480,
    chatMessages: 800,
    codeCompletions: 12000,
  },
  overageBudget: {
    maxBudgetUsd: 40,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 8: PRO+ user - Heavy usage
 * User on PRO+ plan with very high usage but still under quota
 */
export const PRO_PLUS_HEAVY_USAGE: UserState = generateUserState({
  id: "pro-plus-heavy-usage",
  timestamp: "2025-01-20T15:30:00Z",
  skuId: "pro-plus",
  account: {
    userId: "user-008",
    username: "helen-ai-expert",
    accountType: "individual",
    email: "helen@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 11,
  },
  usage: {
    premiumRequests: 1200,
    chatMessages: 3500,
    codeCompletions: 45000,
  },
  overageBudget: {
    maxBudgetUsd: 200,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 9: BUSINESS organization - Moderate usage
 * Organization on BUSINESS plan with 15 seats, moderate aggregate usage
 */
export const BUSINESS_ORG: UserState = generateUserState({
  id: "business-org",
  timestamp: "2025-01-15T10:00:00Z",
  skuId: "business",
  account: {
    userId: "org-001",
    username: "acme-engineering",
    accountType: "organization",
    organizationName: "Acme Engineering",
    seats: 15,
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 16,
  },
  usage: {
    premiumRequests: 180,
    chatMessages: 850,
    codeCompletions: 12000,
  },
  overageBudget: {
    maxBudgetUsd: 500,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 10: ENTERPRISE - Large organization
 * Large enterprise on ENTERPRISE plan with 250 seats and high usage
 */
export const ENTERPRISE_LARGE: UserState = generateUserState({
  id: "enterprise-large",
  timestamp: "2025-01-15T10:00:00Z",
  skuId: "enterprise",
  account: {
    userId: "ent-001",
    username: "global-tech-corp",
    accountType: "enterprise",
    organizationName: "Global Tech Corp",
    seats: 250,
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 16,
  },
  usage: {
    premiumRequests: 650,
    chatMessages: 4500,
    codeCompletions: 85000,
  },
  overageBudget: {
    maxBudgetUsd: 5000,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 11: PRO user - Mid-cycle upgrade (pro-rated billing)
 * User who upgraded to PRO mid-cycle and has pro-rated billing
 */
export const PRO_MID_CYCLE_UPGRADE: UserState = generateUserState({
  id: "pro-mid-cycle-upgrade",
  timestamp: "2025-01-20T10:00:00Z",
  skuId: "pro",
  account: {
    userId: "user-011",
    username: "ivan-upgrader",
    accountType: "individual",
    email: "ivan@example.com",
  },
  billing: {
    startDate: "2025-01-15T00:00:00Z",
    status: "active",
    billingFrequency: "monthly",
    autoRenew: true,
    nextRenewalDate: "2025-02-01T00:00:00Z",
  },
  billingPeriod: {
    startDate: "2025-01-15T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    isProRated: true,
    daysRemaining: 11,
  },
  usage: {
    premiumRequests: 85,
    chatMessages: 320,
    codeCompletions: 4200,
  },
  overageBudget: {
    maxBudgetUsd: 30,
    alertThresholds: [50, 75, 90, 100],
  },
});

/**
 * Scenario 12: PRO user - On trial
 * User on PRO trial period with 7 days remaining
 */
export const PRO_ON_TRIAL: UserState = generateUserState({
  id: "pro-on-trial",
  timestamp: "2025-01-08T10:00:00Z",
  skuId: "pro",
  account: {
    userId: "user-012",
    username: "jane-trial",
    accountType: "individual",
    email: "jane@example.com",
  },
  billing: {
    startDate: "2025-01-01T00:00:00Z",
    status: "trial",
    billingFrequency: "monthly",
    autoRenew: false,
    nextRenewalDate: null,
    trialEndsAt: "2025-01-15T23:59:59Z",
    trialDaysRemaining: 7,
  },
  billingPeriod: {
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-02-01T00:00:00Z",
    daysRemaining: 23,
  },
  usage: {
    premiumRequests: 65,
    chatMessages: 180,
    codeCompletions: 2800,
  },
  overageBudget: null,
});

/**
 * Array of all mock states for iteration
 */
export const ALL_MOCK_STATES: UserState[] = [
  FREE_UNDER_QUOTA,
  FREE_AT_WARNING,
  FREE_OVER_QUOTA,
  PRO_UNDER_QUOTA,
  PRO_WITH_OVERAGE,
  PRO_BUDGET_EXHAUSTED,
  PRO_WITH_PURCHASED,
  PRO_PLUS_HEAVY_USAGE,
  BUSINESS_ORG,
  ENTERPRISE_LARGE,
  PRO_MID_CYCLE_UPGRADE,
  PRO_ON_TRIAL,
];

/**
 * Map of state IDs to states for quick lookups
 */
export const MOCK_STATE_MAP: Record<string, UserState> = {
  "free-under-quota": FREE_UNDER_QUOTA,
  "free-at-warning": FREE_AT_WARNING,
  "free-over-quota": FREE_OVER_QUOTA,
  "pro-under-quota": PRO_UNDER_QUOTA,
  "pro-with-overage": PRO_WITH_OVERAGE,
  "pro-budget-exhausted": PRO_BUDGET_EXHAUSTED,
  "pro-with-purchased": PRO_WITH_PURCHASED,
  "pro-plus-heavy-usage": PRO_PLUS_HEAVY_USAGE,
  "business-org": BUSINESS_ORG,
  "enterprise-large": ENTERPRISE_LARGE,
  "pro-mid-cycle-upgrade": PRO_MID_CYCLE_UPGRADE,
  "pro-on-trial": PRO_ON_TRIAL,
};

/**
 * Get a mock state by ID
 */
export function getMockStateById(id: string): UserState | undefined {
  return MOCK_STATE_MAP[id];
}

/**
 * Get all mock states for a specific SKU
 */
export function getMockStatesBySku(skuId: string): UserState[] {
  return ALL_MOCK_STATES.filter(state => state.subscription.skuId === skuId);
}

/**
 * Get all mock states for a specific account type
 */
export function getMockStatesByAccountType(
  accountType: "individual" | "organization" | "enterprise"
): UserState[] {
  return ALL_MOCK_STATES.filter(
    state => state.account.accountType === accountType
  );
}

/**
 * Get all mock states where user is over quota
 */
export function getOverQuotaStates(): UserState[] {
  return ALL_MOCK_STATES.filter(
    state =>
      state.usage.premiumRequests.isOverQuota ||
      state.usage.chatMessages.isOverQuota ||
      state.usage.codeCompletions.isOverQuota
  );
}

/**
 * Get all mock states where user is blocked
 */
export function getBlockedStates(): UserState[] {
  return ALL_MOCK_STATES.filter(
    state =>
      state.usage.premiumRequests.isBlocked ||
      state.usage.chatMessages.isBlocked ||
      state.usage.codeCompletions.isBlocked
  );
}
