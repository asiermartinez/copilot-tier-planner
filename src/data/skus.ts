/**
 * Copilot SKU Data
 *
 * Snapshot of Copilot plans from late 2025, when they were metered in premium
 * requests. It is not kept up to date and does not reflect current plans:
 * https://docs.github.com/en/copilot/get-started/plans
 *
 * This file contains the SKU definitions for the plans at that time: Free,
 * Pro, Pro+, Business, and Enterprise.
 */

import { Sku, SkuTier, OverageBehavior, type SkuId } from "@/types/sku";

/**
 * Copilot Free
 *
 * Limited access plan for individual developers to try AI-powered coding assistance at no cost.
 */
export const FREE_SKU: Sku = {
  id: "free",
  name: "Copilot Free",
  tier: SkuTier.FREE,
  description: "Try Copilot with limited features and requests",
  longDescription:
    "Available to individual developers who don't have access to Copilot through an organization or enterprise. This free plan includes limited access to select Copilot features, allowing you to try AI-powered coding assistance at no cost.",
  pricing: {
    monthlyUsd: 0,
    annualUsd: 0,
    perSeat: false,
  },
  limits: {
    premiumRequestsPerMonth: 50,
    premiumRequestsOveragePolicy: {
      behavior: OverageBehavior.BLOCK,
      allowBudgetCap: false,
      warningThreshold: 80,
    },
    chatMessagesPerMonth: 50,
    chatMessagesOveragePolicy: {
      behavior: OverageBehavior.BLOCK,
      allowBudgetCap: false,
      warningThreshold: 80,
    },
    codeCompletionsPerMonth: 2000,
    codeCompletionsOveragePolicy: {
      behavior: OverageBehavior.BLOCK,
      allowBudgetCap: false,
      warningThreshold: 80,
    },
    canPurchaseAdditionalPremiumRequests: false,
  },
  features: {
    // Agents
    copilotCodingAgent: false,
    agentMode: false,
    copilotCodeReview: "limited", // Only "Review selection" in VS Code
    modelContextProtocol: false,

    // Chat
    chatInIdes: true,
    inlineChat: false,
    slashCommands: false,
    chatInGitHubMobile: false,
    chatInGitHub: false,
    chatInWindowsTerminal: false,
    chatSkillsInIdes: false,

    // Models
    premiumModelsAccess: false,
    allModelsAccess: false,

    // Inline suggestions
    nextEditSuggestions: false,

    // Customization
    repositoryAndPersonalCustomInstructions: false,
    organizationCustomInstructions: false,
    promptFiles: false,
    blockSuggestionsMatchingPublicCode: false,
    excludeSpecifiedFiles: false,
    organizationPolicyManagement: false,

    // Other features
    pullRequestSummaries: false,
    auditLogs: false,
    contentExclusion: false,
    knowledgeBases: false,
    copilotCli: false,
    gitHubSpark: true, // Available in public preview for all tiers
  },
  audience: "individual",
  available: true,
};

/**
 * Copilot Pro
 *
 * Designed for individuals who want more flexibility with unlimited completions,
 * access to premium models, and a monthly allowance of premium requests.
 */
export const PRO_SKU: Sku = {
  id: "pro",
  name: "Copilot Pro",
  tier: SkuTier.PRO,
  description: "Get unlimited completions and access to premium models",
  longDescription:
    "Designed for individuals who want more flexibility. This paid plan includes unlimited completions, access to premium models in Copilot Chat, access to Copilot coding agent, and a monthly allowance of premium requests. Verified students, teachers, and maintainers of popular open source projects may be eligible for free access.",
  pricing: {
    monthlyUsd: 10,
    annualUsd: 100,
    perSeat: false,
    additionalPremiumRequestPrice: 0.04,
  },
  limits: {
    premiumRequestsPerMonth: 300,
    premiumRequestsOveragePolicy: {
      behavior: OverageBehavior.BILL,
      pricePerUnit: 0.04,
      maxOverage: null,
      allowBudgetCap: true,
      warningThreshold: 80,
    },
    chatMessagesPerMonth: null, // Unlimited
    chatMessagesOveragePolicy: null,
    codeCompletionsPerMonth: null, // Unlimited
    codeCompletionsOveragePolicy: null,
    canPurchaseAdditionalPremiumRequests: true,
  },
  features: {
    // Agents
    copilotCodingAgent: true,
    agentMode: true,
    copilotCodeReview: true,
    modelContextProtocol: true,

    // Chat
    chatInIdes: true,
    inlineChat: true,
    slashCommands: true,
    chatInGitHubMobile: true,
    chatInGitHub: true,
    chatInWindowsTerminal: true,
    chatSkillsInIdes: true,

    // Models
    premiumModelsAccess: true,
    allModelsAccess: false,

    // Inline suggestions
    nextEditSuggestions: true,

    // Customization
    repositoryAndPersonalCustomInstructions: true,
    organizationCustomInstructions: false,
    promptFiles: true,
    blockSuggestionsMatchingPublicCode: true,
    excludeSpecifiedFiles: true,
    organizationPolicyManagement: false,

    // Other features
    pullRequestSummaries: true,
    auditLogs: false,
    contentExclusion: false,
    knowledgeBases: false,
    copilotCli: true,
    gitHubSpark: true,
  },
  audience: "individual",
  available: true,
};

/**
 * Copilot Pro (Trial)
 *
 * Free 30-day trial of Copilot Pro for eligible users.
 * Includes all Pro features with no payment required during the trial period.
 */
export const PRO_TRIAL_SKU: Sku = {
  id: "pro-trial",
  name: "Copilot Pro 30-day trial",
  tier: SkuTier.PRO,
  description:
    "Get unlimited completions and access to premium models. Includes a free 30-day trial for eligible users.",
  longDescription:
    "Free 30-day trial of Copilot Pro for eligible users. This trial includes all features of Copilot Pro: unlimited completions, access to premium models in Copilot Chat, access to Copilot coding agent, and a monthly allowance of premium requests. No payment required during the trial period.",
  pricing: {
    monthlyUsd: 0,
    annualUsd: 0,
    perSeat: false,
    additionalPremiumRequestPrice: 0.04,
  },
  limits: {
    premiumRequestsPerMonth: 300,
    premiumRequestsOveragePolicy: {
      behavior: OverageBehavior.BLOCK,
      pricePerUnit: 0.04,
      maxOverage: null,
      allowBudgetCap: false,
      warningThreshold: 80,
    },
    chatMessagesPerMonth: null, // Unlimited
    chatMessagesOveragePolicy: null,
    codeCompletionsPerMonth: null, // Unlimited
    codeCompletionsOveragePolicy: null,
    canPurchaseAdditionalPremiumRequests: false,
  },
  features: {
    // Agents
    copilotCodingAgent: true,
    agentMode: true,
    copilotCodeReview: true,
    modelContextProtocol: true,

    // Chat
    chatInIdes: true,
    inlineChat: true,
    slashCommands: true,
    chatInGitHubMobile: true,
    chatInGitHub: true,
    chatInWindowsTerminal: true,
    chatSkillsInIdes: true,

    // Models
    premiumModelsAccess: true,
    allModelsAccess: false,

    // Inline suggestions
    nextEditSuggestions: true,

    // Customization
    repositoryAndPersonalCustomInstructions: true,
    organizationCustomInstructions: false,
    promptFiles: true,
    blockSuggestionsMatchingPublicCode: true,
    excludeSpecifiedFiles: true,
    organizationPolicyManagement: false,

    // Other features
    pullRequestSummaries: true,
    auditLogs: false,
    contentExclusion: false,
    knowledgeBases: false,
    copilotCli: true,
    gitHubSpark: true,
  },
  audience: "individual",
  available: true,
};

/**
 * Copilot Pro+
 *
 * Offers the highest level of access for individual developers with a larger
 * allowance of premium requests and full access to all available models.
 */
export const PRO_PLUS_SKU: Sku = {
  id: "pro-plus",
  name: "Copilot Pro+",
  tier: SkuTier.PRO_PLUS,
  description:
    "Unlock advanced AI models, extended request limits, and extra capabilities",
  longDescription:
    "Offers the highest level of access for individual developers. In addition to everything in Copilot Pro, this plan includes a larger allowance of premium requests, and full access to all available models in Copilot Chat. Ideal for AI power users who want access to the most advanced capabilities.",
  pricing: {
    monthlyUsd: 39,
    annualUsd: 390,
    perSeat: false,
    additionalPremiumRequestPrice: 0.04,
  },
  limits: {
    premiumRequestsPerMonth: 1500,
    premiumRequestsOveragePolicy: {
      behavior: OverageBehavior.BILL,
      pricePerUnit: 0.04,
      maxOverage: null,
      allowBudgetCap: true,
      warningThreshold: 80,
    },
    chatMessagesPerMonth: null, // Unlimited
    chatMessagesOveragePolicy: null,
    codeCompletionsPerMonth: null, // Unlimited
    codeCompletionsOveragePolicy: null,
    canPurchaseAdditionalPremiumRequests: true,
  },
  features: {
    // Agents
    copilotCodingAgent: true,
    agentMode: true,
    copilotCodeReview: true,
    modelContextProtocol: true,

    // Chat
    chatInIdes: true,
    inlineChat: true,
    slashCommands: true,
    chatInGitHubMobile: true,
    chatInGitHub: true,
    chatInWindowsTerminal: true,
    chatSkillsInIdes: true,

    // Models
    premiumModelsAccess: true,
    allModelsAccess: true, // Full access to all models

    // Inline suggestions
    nextEditSuggestions: true,

    // Customization
    repositoryAndPersonalCustomInstructions: true,
    organizationCustomInstructions: false,
    promptFiles: true,
    blockSuggestionsMatchingPublicCode: true,
    excludeSpecifiedFiles: true,
    organizationPolicyManagement: false,

    // Other features
    pullRequestSummaries: true,
    auditLogs: false,
    contentExclusion: false,
    knowledgeBases: false,
    copilotCli: true,
    gitHubSpark: true,
  },
  audience: "individual",
  available: true,
};

/**
 * Copilot Business
 *
 * For organizations on GitHub Free or GitHub Team plan, or enterprises on
 * GitHub Enterprise Cloud. Includes centralized management and policy control.
 */
export const BUSINESS_SKU: Sku = {
  id: "business",
  name: "Copilot Business",
  tier: SkuTier.BUSINESS,
  description: "For teams and organizations with centralized management",
  longDescription:
    "For organizations on GitHub Free or GitHub Team plan, or enterprises on GitHub Enterprise Cloud. This plan includes Copilot coding agent and enables centralized management and Copilot policy control for organization members.",
  pricing: {
    monthlyUsd: 19,
    perSeat: true,
    additionalPremiumRequestPrice: 0.04,
  },
  limits: {
    premiumRequestsPerMonth: 300, // Per user
    premiumRequestsOveragePolicy: {
      behavior: OverageBehavior.BILL,
      pricePerUnit: 0.04,
      maxOverage: null,
      allowBudgetCap: true,
      warningThreshold: 80,
    },
    chatMessagesPerMonth: null, // Unlimited
    chatMessagesOveragePolicy: null,
    codeCompletionsPerMonth: null, // Unlimited
    codeCompletionsOveragePolicy: null,
    canPurchaseAdditionalPremiumRequests: true,
    maxSeats: null, // Unlimited
    minSeats: 1,
  },
  features: {
    // Agents
    copilotCodingAgent: true,
    agentMode: true,
    copilotCodeReview: true,
    modelContextProtocol: true,

    // Chat
    chatInIdes: true,
    inlineChat: true,
    slashCommands: true,
    chatInGitHubMobile: true,
    chatInGitHub: true,
    chatInWindowsTerminal: true,
    chatSkillsInIdes: true,

    // Models
    premiumModelsAccess: true,
    allModelsAccess: false,

    // Inline suggestions
    nextEditSuggestions: true,

    // Customization
    repositoryAndPersonalCustomInstructions: true,
    organizationCustomInstructions: true, // Organization-wide custom instructions
    promptFiles: true,
    blockSuggestionsMatchingPublicCode: true,
    excludeSpecifiedFiles: true,
    organizationPolicyManagement: true, // Organization-wide policy management

    // Other features
    pullRequestSummaries: true,
    auditLogs: true,
    contentExclusion: true,
    knowledgeBases: false,
    copilotCli: true,
    gitHubSpark: true,
  },
  audience: "organization",
  available: true,
};

/**
 * Copilot Enterprise
 *
 * For enterprises using GitHub Enterprise Cloud. Includes all features of
 * Copilot Business plus additional enterprise-grade capabilities.
 */
export const ENTERPRISE_SKU: Sku = {
  id: "enterprise",
  name: "Copilot Enterprise",
  tier: SkuTier.ENTERPRISE,
  description:
    "For enterprises with advanced features and centralized management",
  longDescription:
    "For enterprises using GitHub Enterprise Cloud. It includes all the features of Copilot Business, plus additional enterprise-grade capabilities. Enterprise owners can assign Copilot Enterprise or Copilot Business to individual organizations, or assign Copilot Business directly to users and teams.",
  pricing: {
    monthlyUsd: 39,
    perSeat: true,
    additionalPremiumRequestPrice: 0.04,
  },
  limits: {
    premiumRequestsPerMonth: 1000, // Per user
    premiumRequestsOveragePolicy: {
      behavior: OverageBehavior.BILL,
      pricePerUnit: 0.04,
      maxOverage: null,
      allowBudgetCap: true,
      warningThreshold: 80,
    },
    chatMessagesPerMonth: null, // Unlimited
    chatMessagesOveragePolicy: null,
    codeCompletionsPerMonth: null, // Unlimited
    codeCompletionsOveragePolicy: null,
    canPurchaseAdditionalPremiumRequests: true,
    maxSeats: null, // Unlimited
    minSeats: 1,
  },
  features: {
    // Agents
    copilotCodingAgent: true,
    agentMode: true,
    copilotCodeReview: true,
    modelContextProtocol: true,

    // Chat
    chatInIdes: true,
    inlineChat: true,
    slashCommands: true,
    chatInGitHubMobile: true,
    chatInGitHub: true,
    chatInWindowsTerminal: true,
    chatSkillsInIdes: true,

    // Models
    premiumModelsAccess: true,
    allModelsAccess: true, // Full access to all models

    // Inline suggestions
    nextEditSuggestions: true,

    // Customization
    repositoryAndPersonalCustomInstructions: true,
    organizationCustomInstructions: true,
    promptFiles: true,
    blockSuggestionsMatchingPublicCode: true,
    excludeSpecifiedFiles: true,
    organizationPolicyManagement: true,

    // Other features
    pullRequestSummaries: true,
    auditLogs: true,
    contentExclusion: true,
    knowledgeBases: true, // Enterprise-exclusive
    copilotCli: true,
    gitHubSpark: true,
  },
  audience: "enterprise",
  available: true,
};

/**
 * Array of all SKUs in tier order (FREE → Enterprise)
 */
export const ALL_SKUS: Sku[] = [
  FREE_SKU,
  PRO_SKU,
  PRO_TRIAL_SKU,
  PRO_PLUS_SKU,
  BUSINESS_SKU,
  ENTERPRISE_SKU,
];

/**
 * Map of SKU ID to SKU object for quick lookups
 */
export const SKU_MAP: Record<SkuId, Sku> = {
  free: FREE_SKU,
  pro: PRO_SKU,
  "pro-trial": PRO_TRIAL_SKU,
  "pro-plus": PRO_PLUS_SKU,
  business: BUSINESS_SKU,
  enterprise: ENTERPRISE_SKU,
};

/**
 * Get a SKU by its ID
 */
export function getSkuById(id: SkuId): Sku | undefined {
  return SKU_MAP[id];
}

/**
 * Get all SKUs sorted by tier
 */
export function getAllSkus(): Sku[] {
  return ALL_SKUS;
}

/**
 * Sort SKUs by price (monthly USD) in ascending order
 * For SKUs with the same price, maintains stable order based on tier
 */
function sortSkusByPrice(skus: Sku[]): Sku[] {
  return [...skus].sort((a, b) => {
    // Primary sort: by monthly price (ascending)
    const priceDiff = a.pricing.monthlyUsd - b.pricing.monthlyUsd;
    if (priceDiff !== 0) return priceDiff;

    // Secondary sort: by tier (ascending) for same-price SKUs
    return a.tier - b.tier;
  });
}

/**
 * Get SKUs filtered by audience and sorted by price (cheapest to most expensive)
 */
export function getSkusByAudienceSortedByPrice(
  audience: "individual" | "organization" | "enterprise"
): Sku[] {
  const filtered = ALL_SKUS.filter(sku => sku.audience === audience);
  return sortSkusByPrice(filtered);
}

/**
 * Get simplified display name for a SKU (removes "Copilot " prefix)
 */
export function getSimplifiedSkuName(sku: Sku): string {
  return sku.name.replace(/^Copilot\s+/i, "");
}
