"use client";

import { useCallback } from "react";
import type { SkuId, Sku } from "@/types/sku";
import { OverageBehavior } from "@/types/sku";
import { EdgeType } from "@/types/scenario";
import type { SkuScenario } from "@/types/scenario";

interface UseCustomSkuManagerOptions {
  currentScenario: SkuScenario;
  updateCurrentScenario: (scenario: SkuScenario) => void;
}

/**
 * Custom hook to manage custom SKU creation and updates
 */
export function useCustomSkuManager({
  currentScenario,
  updateCurrentScenario,
}: UseCustomSkuManagerOptions) {
  /**
   * Create a new custom SKU with default settings
   */
  const createCustomSku = useCallback((): SkuId => {
    const timestamp = Date.now();
    const newSkuId = `custom-${timestamp}` as SkuId;

    const newSku: Sku = {
      id: newSkuId,
      name: "New Custom Plan",
      description: "",
      audience: "individual",
      tier: 2,
      available: true,
      pricing: {
        monthlyUsd: 0,
        perSeat: false,
      },
      limits: {
        premiumRequestsPerMonth: 500,
        premiumRequestsOveragePolicy: {
          behavior: OverageBehavior.BILL,
          pricePerUnit: 0.04,
          maxOverage: null,
          allowBudgetCap: true,
          warningThreshold: 80,
        },
        chatMessagesPerMonth: null,
        chatMessagesOveragePolicy: null,
        codeCompletionsPerMonth: null,
        codeCompletionsOveragePolicy: null,
        canPurchaseAdditionalPremiumRequests: true,
      },
      features: {
        copilotCodingAgent: true,
        agentMode: true,
        copilotCodeReview: true,
        modelContextProtocol: true,
        chatInIdes: true,
        inlineChat: true,
        slashCommands: true,
        chatInGitHubMobile: true,
        chatInGitHub: true,
        chatInWindowsTerminal: true,
        chatSkillsInIdes: true,
        premiumModelsAccess: true,
        allModelsAccess: true,
        nextEditSuggestions: true,
        repositoryAndPersonalCustomInstructions: true,
        organizationCustomInstructions: false,
        promptFiles: true,
        blockSuggestionsMatchingPublicCode: true,
        excludeSpecifiedFiles: true,
        organizationPolicyManagement: false,
        pullRequestSummaries: true,
        auditLogs: false,
        contentExclusion: true,
        knowledgeBases: true,
        copilotCli: true,
        gitHubSpark: true,
      },
    };

    // Create a self-loop budget edge for the new SKU
    const budgetEdge = {
      id: `${newSkuId}-budget`,
      source: newSkuId,
      target: newSkuId,
      type: EdgeType.BUDGET,
      label: "Set overages",
    };

    // Update the scenario with both the SKU and edge
    const updated = {
      ...currentScenario,
      customSkus: [...(currentScenario.customSkus || []), newSku],
      edges: [...currentScenario.edges, budgetEdge],
      modifiedAt: new Date().toISOString(),
    };

    updateCurrentScenario(updated);

    return newSkuId;
  }, [currentScenario, updateCurrentScenario]);

  /**
   * Check if a custom SKU exists in the scenario
   */
  const customSkuExists = useCallback(
    (skuId: SkuId): boolean => {
      return (
        currentScenario.customSkus?.some((s: Sku) => s.id === skuId) ?? false
      );
    },
    [currentScenario.customSkus]
  );

  return {
    createCustomSku,
    customSkuExists,
  };
}
