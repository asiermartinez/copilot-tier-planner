/**
 * SKU Helper Utilities
 *
 * Helper functions for SKU operations, comparisons, validation, and analysis.
 * These utilities support SKU selection, upgrade/downgrade paths, feature comparison,
 * and cost calculations.
 */

import { Sku, SkuId, SkuFeatures, OverageBehavior } from "@/types/sku";
import { SKU_MAP, ALL_SKUS } from "@/data/skus";

/**
 * Get a SKU by its ID
 * @param id - The SKU ID to look up
 * @returns The SKU object, or null if not found
 */
export function getSkuById(id: SkuId): Sku | null {
  return SKU_MAP[id] || null;
}

/**
 * Get all available SKUs sorted by tier (ascending)
 * @returns Array of all SKUs
 */
export function getAllSkus(): Sku[] {
  return [...ALL_SKUS];
}

/**
 * Get SKUs filtered by audience
 * @param audience - Target audience type
 * @returns Array of SKUs matching the audience
 */
export function getSkusByAudience(
  audience: "individual" | "organization" | "enterprise"
): Sku[] {
  return ALL_SKUS.filter(sku => sku.audience === audience);
}

/**
 * Get SKUs available for a specific audience with upgrade paths
 * Returns SKUs that can be upgraded to from the current SKU
 * @param currentSkuId - Current SKU ID
 * @returns Array of SKUs that can be upgraded to
 */
export function getUpgradeOptions(currentSkuId: SkuId): Sku[] {
  const currentSku = getSkuById(currentSkuId);
  if (!currentSku) return [];

  return ALL_SKUS.filter(sku => sku.tier > currentSku.tier);
}

/**
 * Get SKUs available for downgrade from current SKU
 * @param currentSkuId - Current SKU ID
 * @returns Array of SKUs that can be downgraded to
 */
export function getDowngradeOptions(currentSkuId: SkuId): Sku[] {
  const currentSku = getSkuById(currentSkuId);
  if (!currentSku) return [];

  return ALL_SKUS.filter(sku => sku.tier < currentSku.tier);
}

/**
 * Get the immediate next tier up from a given SKU
 * @param currentSkuId - Current SKU ID
 * @returns The next tier SKU, or null if already at highest tier
 */
export function getNextTier(currentSkuId: SkuId): Sku | null {
  const currentSku = getSkuById(currentSkuId);
  if (!currentSku) return null;

  return ALL_SKUS.find(sku => sku.tier === currentSku.tier + 1) || null;
}

/**
 * Get the immediate previous tier down from a given SKU
 * @param currentSkuId - Current SKU ID
 * @returns The previous tier SKU, or null if already at lowest tier
 */
export function getPreviousTier(currentSkuId: SkuId): Sku | null {
  const currentSku = getSkuById(currentSkuId);
  if (!currentSku) return null;

  return ALL_SKUS.find(sku => sku.tier === currentSku.tier - 1) || null;
}

/**
 * Compare two SKUs by tier level
 * @param skuId1 - First SKU ID
 * @param skuId2 - Second SKU ID
 * @returns Positive if sku1 > sku2, negative if sku1 < sku2, 0 if equal
 */
export function compareSkuTiers(skuId1: SkuId, skuId2: SkuId): number {
  const sku1 = getSkuById(skuId1);
  const sku2 = getSkuById(skuId2);

  if (!sku1 || !sku2) return 0;

  return sku1.tier - sku2.tier;
}

/**
 * Check if upgrading from one SKU to another is valid
 * @param fromSkuId - Source SKU ID
 * @param toSkuId - Target SKU ID
 * @returns True if upgrade is valid (target tier is higher)
 */
export function isValidUpgrade(fromSkuId: SkuId, toSkuId: SkuId): boolean {
  return compareSkuTiers(fromSkuId, toSkuId) < 0;
}

/**
 * Check if downgrading from one SKU to another is valid
 * @param fromSkuId - Source SKU ID
 * @param toSkuId - Target SKU ID
 * @returns True if downgrade is valid (target tier is lower)
 */
export function isValidDowngrade(fromSkuId: SkuId, toSkuId: SkuId): boolean {
  return compareSkuTiers(fromSkuId, toSkuId) > 0;
}

/**
 * Check if a SKU transition is valid (upgrade, downgrade, or same tier)
 * @param fromSkuId - Source SKU ID
 * @param toSkuId - Target SKU ID
 * @returns True if transition is valid
 */
export function isValidTransition(fromSkuId: SkuId, toSkuId: SkuId): boolean {
  const fromSku = getSkuById(fromSkuId);
  const toSku = getSkuById(toSkuId);

  if (!fromSku || !toSku) return false;
  if (!fromSku.available || !toSku.available) return false;

  return true;
}

/**
 * Calculate the monthly cost for a SKU
 * @param skuId - SKU ID
 * @param seats - Number of seats (for org plans)
 * @returns Monthly cost in USD
 */
export function calculateMonthlyCost(skuId: SkuId, seats: number = 1): number {
  const sku = getSkuById(skuId);
  if (!sku) return 0;

  return sku.pricing.perSeat
    ? sku.pricing.monthlyUsd * seats
    : sku.pricing.monthlyUsd;
}

/**
 * Calculate the annual cost for a SKU (if annual pricing is available)
 * @param skuId - SKU ID
 * @param seats - Number of seats (for org plans)
 * @returns Annual cost in USD, or null if annual pricing not available
 */
export function calculateAnnualCost(
  skuId: SkuId,
  seats: number = 1
): number | null {
  const sku = getSkuById(skuId);
  if (!sku || !sku.pricing.annualUsd) return null;

  return sku.pricing.perSeat
    ? sku.pricing.annualUsd * seats
    : sku.pricing.annualUsd;
}

/**
 * Calculate annual savings when paying annually vs monthly
 * @param skuId - SKU ID
 * @param seats - Number of seats (for org plans)
 * @returns Savings in USD, or null if annual pricing not available
 */
export function calculateAnnualSavings(
  skuId: SkuId,
  seats: number = 1
): number | null {
  const monthlyCost = calculateMonthlyCost(skuId, seats);
  const annualCost = calculateAnnualCost(skuId, seats);

  if (annualCost === null) return null;

  return monthlyCost * 12 - annualCost;
}

/**
 * Calculate the cost difference between two SKUs (monthly)
 * @param fromSkuId - Current SKU ID
 * @param toSkuId - Target SKU ID
 * @param seats - Number of seats (for org plans)
 * @returns Cost difference in USD (positive if target is more expensive)
 */
export function calculateCostDifference(
  fromSkuId: SkuId,
  toSkuId: SkuId,
  seats: number = 1
): number {
  const fromCost = calculateMonthlyCost(fromSkuId, seats);
  const toCost = calculateMonthlyCost(toSkuId, seats);

  return toCost - fromCost;
}

/**
 * Get the premium request quota for a SKU
 * @param skuId - SKU ID
 * @returns Premium requests per month
 */
export function getPremiumRequestQuota(skuId: SkuId): number {
  const sku = getSkuById(skuId);
  return sku?.limits.premiumRequestsPerMonth || 0;
}

/**
 * Calculate premium request quota difference between SKUs
 * @param fromSkuId - Current SKU ID
 * @param toSkuId - Target SKU ID
 * @returns Quota difference (positive if target has more)
 */
export function calculateQuotaDifference(
  fromSkuId: SkuId,
  toSkuId: SkuId
): number {
  const fromQuota = getPremiumRequestQuota(fromSkuId);
  const toQuota = getPremiumRequestQuota(toSkuId);

  return toQuota - fromQuota;
}

/**
 * Check if a SKU has unlimited quota for a specific resource
 * @param skuId - SKU ID
 * @param resource - Resource type to check
 * @returns True if the resource is unlimited
 */
export function hasUnlimitedQuota(
  skuId: SkuId,
  resource: "chat" | "completions"
): boolean {
  const sku = getSkuById(skuId);
  if (!sku) return false;

  if (resource === "chat") {
    return sku.limits.chatMessagesPerMonth === null;
  } else if (resource === "completions") {
    return sku.limits.codeCompletionsPerMonth === null;
  }

  return false;
}

/**
 * Check if a SKU supports overage billing
 * @param skuId - SKU ID
 * @returns True if overage billing is supported
 */
export function supportsOverageBilling(skuId: SkuId): boolean {
  const sku = getSkuById(skuId);
  if (!sku) return false;

  return (
    sku.limits.premiumRequestsOveragePolicy.behavior === OverageBehavior.BILL
  );
}

/**
 * Check if a SKU can purchase additional premium requests
 * @param skuId - SKU ID
 * @returns True if additional requests can be purchased
 */
export function canPurchaseAdditionalRequests(skuId: SkuId): boolean {
  const sku = getSkuById(skuId);
  if (!sku) return false;

  return sku.limits.canPurchaseAdditionalPremiumRequests;
}

/**
 * Get the overage price per premium request for a SKU
 * @param skuId - SKU ID
 * @returns Price per request in USD, or null if not applicable
 */
export function getOveragePricePerRequest(skuId: SkuId): number | null {
  const sku = getSkuById(skuId);
  if (!sku) return null;

  return sku.limits.premiumRequestsOveragePolicy.pricePerUnit || null;
}

/**
 * Compare features between two SKUs and return differences
 * @param fromSkuId - Current SKU ID
 * @param toSkuId - Target SKU ID
 * @returns Object containing gained and lost features
 */
export function compareFeatures(
  fromSkuId: SkuId,
  toSkuId: SkuId
): {
  gained: Array<keyof SkuFeatures>;
  lost: Array<keyof SkuFeatures>;
  unchanged: Array<keyof SkuFeatures>;
} {
  const fromSku = getSkuById(fromSkuId);
  const toSku = getSkuById(toSkuId);

  const gained: Array<keyof SkuFeatures> = [];
  const lost: Array<keyof SkuFeatures> = [];
  const unchanged: Array<keyof SkuFeatures> = [];

  if (!fromSku || !toSku) {
    return { gained, lost, unchanged };
  }

  const featureKeys = Object.keys(fromSku.features) as Array<keyof SkuFeatures>;

  featureKeys.forEach(key => {
    const fromValue = fromSku.features[key];
    const toValue = toSku.features[key];

    // Handle boolean and limited features
    const fromEnabled = fromValue === true || fromValue === "limited";
    const toEnabled = toValue === true || toValue === "limited";

    if (fromEnabled === toEnabled) {
      // Check if upgraded from "limited" to true
      if (fromValue === "limited" && toValue === true) {
        gained.push(key);
      } else if (fromValue === true && toValue === "limited") {
        lost.push(key);
      } else {
        unchanged.push(key);
      }
    } else if (!fromEnabled && toEnabled) {
      gained.push(key);
    } else if (fromEnabled && !toEnabled) {
      lost.push(key);
    }
  });

  return { gained, lost, unchanged };
}

/**
 * Get human-readable feature names
 * @param featureKey - Feature key from SkuFeatures
 * @returns Human-readable feature name
 */
export function getFeatureName(featureKey: keyof SkuFeatures): string {
  const featureNames: Record<keyof SkuFeatures, string> = {
    copilotCodingAgent: "Copilot Coding Agent",
    agentMode: "Agent Mode",
    copilotCodeReview: "Copilot Code Review",
    modelContextProtocol: "Model Context Protocol",
    chatInIdes: "Chat in IDEs",
    inlineChat: "Inline Chat",
    slashCommands: "Slash Commands",
    chatInGitHubMobile: "Chat in GitHub Mobile",
    chatInGitHub: "Chat in GitHub",
    chatInWindowsTerminal: "Chat in Windows Terminal",
    chatSkillsInIdes: "Chat Skills in IDEs",
    premiumModelsAccess: "Premium Models Access",
    allModelsAccess: "All Models Access",
    nextEditSuggestions: "Next Edit Suggestions",
    repositoryAndPersonalCustomInstructions:
      "Repository & Personal Custom Instructions",
    organizationCustomInstructions: "Organization Custom Instructions",
    promptFiles: "Prompt Files",
    blockSuggestionsMatchingPublicCode:
      "Block Suggestions Matching Public Code",
    excludeSpecifiedFiles: "Exclude Specified Files",
    organizationPolicyManagement: "Organization Policy Management",
    pullRequestSummaries: "Pull Request Summaries",
    auditLogs: "Audit Logs",
    contentExclusion: "Content Exclusion",
    knowledgeBases: "Knowledge Bases",
    copilotCli: "Copilot CLI",
    gitHubSpark: "GitHub Spark",
  };

  return featureNames[featureKey] || featureKey;
}

/**
 * Check if a SKU is suitable for an organization
 * @param skuId - SKU ID
 * @returns True if SKU is designed for organizations
 */
export function isOrganizationSku(skuId: SkuId): boolean {
  const sku = getSkuById(skuId);
  if (!sku) return false;

  return sku.audience === "organization" || sku.audience === "enterprise";
}

/**
 * Check if a SKU is suitable for individuals
 * @param skuId - SKU ID
 * @returns True if SKU is designed for individuals
 */
export function isIndividualSku(skuId: SkuId): boolean {
  const sku = getSkuById(skuId);
  if (!sku) return false;

  return sku.audience === "individual";
}

/**
 * Get the most cost-effective SKU for a given usage level
 * @param premiumRequestsNeeded - Number of premium requests needed per month
 * @param audience - Target audience
 * @returns Recommended SKU ID
 */
export function getRecommendedSku(
  premiumRequestsNeeded: number,
  audience: "individual" | "organization" | "enterprise" = "individual"
): SkuId | null {
  const candidates = getSkusByAudience(audience);

  // Filter SKUs that meet the quota requirement
  const suitableSkus = candidates.filter(
    sku => sku.limits.premiumRequestsPerMonth >= premiumRequestsNeeded
  );

  if (suitableSkus.length === 0) return null;

  // Return the cheapest option that meets the requirement
  suitableSkus.sort((a, b) => a.pricing.monthlyUsd - b.pricing.monthlyUsd);

  return suitableSkus[0].id;
}

/**
 * Format SKU price for display
 * @param skuId - SKU ID
 * @param seats - Number of seats (for org plans)
 * @returns Formatted price string (e.g., "$10/month" or "$19/user/month")
 */
export function formatSkuPrice(skuId: SkuId, seats: number = 1): string {
  const sku = getSkuById(skuId);
  if (!sku) return "N/A";

  const monthlyCost = calculateMonthlyCost(skuId, seats);

  if (monthlyCost === 0) {
    return "Free";
  }

  if (sku.pricing.perSeat) {
    return `$${sku.pricing.monthlyUsd}/user/month${seats > 1 ? ` (${seats} seats: $${monthlyCost}/month)` : ""}`;
  }

  return `$${monthlyCost}/month`;
}

/**
 * Get upgrade path from one SKU to another (all intermediate SKUs)
 * @param fromSkuId - Starting SKU ID
 * @param toSkuId - Target SKU ID
 * @returns Array of SKU IDs representing the upgrade path (including from and to)
 */
export function getUpgradePath(fromSkuId: SkuId, toSkuId: SkuId): SkuId[] {
  const fromSku = getSkuById(fromSkuId);
  const toSku = getSkuById(toSkuId);

  if (!fromSku || !toSku || fromSku.tier >= toSku.tier) {
    return [];
  }

  return ALL_SKUS.filter(
    sku => sku.tier >= fromSku.tier && sku.tier <= toSku.tier
  ).map(sku => sku.id);
}

/**
 * Get downgrade path from one SKU to another (all intermediate SKUs)
 * @param fromSkuId - Starting SKU ID
 * @param toSkuId - Target SKU ID
 * @returns Array of SKU IDs representing the downgrade path (including from and to)
 */
export function getDowngradePath(fromSkuId: SkuId, toSkuId: SkuId): SkuId[] {
  const fromSku = getSkuById(fromSkuId);
  const toSku = getSkuById(toSkuId);

  if (!fromSku || !toSku || fromSku.tier <= toSku.tier) {
    return [];
  }

  return ALL_SKUS.filter(
    sku => sku.tier <= fromSku.tier && sku.tier >= toSku.tier
  )
    .map(sku => sku.id)
    .reverse();
}
