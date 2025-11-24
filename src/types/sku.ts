/**
 * SKU Type Definitions for GitHub Copilot Plans
 *
 * Based on: https://docs.github.com/en/copilot/get-started/plans
 * Last updated: January 2025
 */

/**
 * Enum representing the tier levels in ascending order
 */
export enum SkuTier {
  FREE = 0,
  PRO = 1,
  PRO_PLUS = 2,
  BUSINESS = 3,
  ENTERPRISE = 4,
}

/**
 * String literal type for SKU IDs
 */
export type SkuId = "free" | "pro" | "pro-plus" | "business" | "enterprise";

/**
 * Pricing structure for a SKU
 */
export interface SkuPricing {
  /** Monthly price in USD per user/seat */
  monthlyUsd: number;
  /** Annual price in USD per user/seat (if available) */
  annualUsd?: number;
  /** Whether this is a per-seat price (true for Business/Enterprise) */
  perSeat: boolean;
  /** Price for additional premium requests in USD */
  additionalPremiumRequestPrice?: number;
}

/**
 * Behavior when a quota limit is exceeded
 */
export enum OverageBehavior {
  /** Block further usage until limit resets (hard limit) */
  BLOCK = "block",
  /** Allow usage with additional billing (pay-as-you-go) */
  BILL = "bill",
  /** Allow usage without restriction (unlimited) */
  ALLOW = "allow",
}

/**
 * Overage policy for a specific quota type
 */
export interface OveragePolicy {
  /** What happens when the limit is exceeded */
  behavior: OverageBehavior;
  /** Price per unit when behavior is BILL (in USD) */
  pricePerUnit?: number;
  /** Maximum overage allowed (null for unlimited overage when behavior is BILL) */
  maxOverage?: number | null;
  /** Whether user can set a budget cap for overages */
  allowBudgetCap: boolean;
  /** Soft limit warning threshold (percentage, e.g., 80 for 80%) */
  warningThreshold?: number;
  /** Grace period in days before enforcement */
  gracePeriodDays?: number;
}

/**
 * User-defined budget for managing overage costs
 */
export interface OverageBudget {
  /** Maximum amount user is willing to spend on overages (in USD) */
  maxBudgetUsd: number;
  /** Current amount spent on overages in the billing period (in USD) */
  currentSpentUsd: number;
  /** Whether to block usage when budget is exceeded */
  blockWhenExceeded: boolean;
  /** Whether to send alerts as budget thresholds are approached */
  enableAlerts: boolean;
  /** Alert thresholds (percentages, e.g., [50, 75, 90, 100]) */
  alertThresholds?: number[];
}

/**
 * Quota and limit constraints for a SKU
 */
export interface SkuLimits {
  /** Number of premium requests per month (per user for org plans) */
  premiumRequestsPerMonth: number;
  /** Overage policy for premium requests */
  premiumRequestsOveragePolicy: OveragePolicy;

  /** Number of chat messages per month (null for unlimited) */
  chatMessagesPerMonth: number | null;
  /** Overage policy for chat messages (null if unlimited) */
  chatMessagesOveragePolicy: OveragePolicy | null;

  /** Number of code completions per month (null for unlimited) */
  codeCompletionsPerMonth: number | null;
  /** Overage policy for code completions (null if unlimited) */
  codeCompletionsOveragePolicy: OveragePolicy | null;

  /** Whether additional premium requests can be purchased */
  canPurchaseAdditionalPremiumRequests: boolean;

  /** Maximum number of seats/users (null for unlimited, mainly for org plans) */
  maxSeats?: number | null;

  /** Minimum number of seats required (for org plans) */
  minSeats?: number;

  /** Storage limits (for knowledge bases, etc.) */
  storageLimits?: {
    /** Maximum storage in GB */
    maxStorageGb?: number;
    /** Maximum number of knowledge bases */
    maxKnowledgeBases?: number;
  };
}

/**
 * Feature flags indicating what features are available in a SKU
 */
export interface SkuFeatures {
  // Agents
  copilotCodingAgent: boolean;
  agentMode: boolean;
  copilotCodeReview: boolean | "limited"; // 'limited' for Free tier (Review selection only)
  modelContextProtocol: boolean;

  // Chat
  chatInIdes: boolean;
  inlineChat: boolean;
  slashCommands: boolean;
  chatInGitHubMobile: boolean;
  chatInGitHub: boolean;
  chatInWindowsTerminal: boolean;
  chatSkillsInIdes: boolean;

  // Models - Premium models available
  premiumModelsAccess: boolean;
  allModelsAccess: boolean; // Pro+ and Enterprise have access to all models

  // Inline suggestions
  nextEditSuggestions: boolean;

  // Customization
  repositoryAndPersonalCustomInstructions: boolean;
  organizationCustomInstructions: boolean;
  promptFiles: boolean;
  blockSuggestionsMatchingPublicCode: boolean;
  excludeSpecifiedFiles: boolean;
  organizationPolicyManagement: boolean;

  // Other features
  pullRequestSummaries: boolean;
  auditLogs: boolean;
  contentExclusion: boolean;
  knowledgeBases: boolean;
  copilotCli: boolean;
  gitHubSpark: boolean;
}

/**
 * Main SKU interface representing a GitHub Copilot plan
 */
export interface Sku {
  /** Unique identifier for the SKU */
  id: SkuId;
  /** Display name shown to users */
  name: string;
  /** Tier level for ordering and comparison */
  tier: SkuTier;
  /** Short marketing description */
  description: string;
  /** Detailed description with key benefits */
  longDescription?: string;
  /** Pricing information */
  pricing: SkuPricing;
  /** Quota and limit constraints */
  limits: SkuLimits;
  /** Feature availability flags */
  features: SkuFeatures;
  /** Target audience (individual, organization, enterprise) */
  audience: "individual" | "organization" | "enterprise";
  /** Whether this SKU is available for new signups */
  available: boolean;
  /** Custom metadata for extensions */
  metadata?: Record<string, unknown>;
}

/**
 * Type guard to check if a string is a valid SkuId
 */
export function isValidSkuId(id: string): id is SkuId {
  return ["free", "pro", "pro-plus", "business", "enterprise"].includes(id);
}

/**
 * Type guard to check if a tier level is valid
 */
export function isValidTier(tier: number): tier is SkuTier {
  return tier >= SkuTier.FREE && tier <= SkuTier.ENTERPRISE;
}
