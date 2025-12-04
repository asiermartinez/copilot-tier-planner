"use client";

import { useCallback } from "react";
import type { SkuId, Sku } from "@/types/sku";
import { OverageBehavior } from "@/types/sku";
import { EdgeType } from "@/types/scenario";
import type { SkuScenario } from "@/types/scenario";
import { SKU_MAP } from "@/data/skus";

interface UseCustomSkuManagerOptions {
  currentScenario: SkuScenario;
  updateCurrentScenario: (scenario: SkuScenario) => void;
}

interface CreateCustomSkuOptions {
  position?: { x: number; y: number };
  connectFrom?: SkuId;
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
  const createCustomSku = useCallback(
    (options?: CreateCustomSkuOptions): SkuId => {
      const timestamp = Date.now();
      const newSkuId = `custom-${timestamp}` as SkuId;
      const position = options?.position;
      const connectFrom = options?.connectFrom;

      // Determine audience based on source node if connectFrom is specified
      let audience: "individual" | "organization" | "enterprise" = "individual";
      if (connectFrom) {
        const allSkus = [
          ...Object.values(SKU_MAP),
          ...(currentScenario.customSkus || []),
        ];
        const sourceSku = allSkus.find((s: Sku) => s.id === connectFrom);
        if (sourceSku) {
          // New SKU inherits the audience of the source node
          // This ensures we don't create invalid connections (e.g., individual linked to enterprise)
          audience = sourceSku.audience || "individual";
        }
      }

      const newSku: Sku = {
        id: newSkuId,
        name: "New Custom Plan",
        description: "",
        audience,
        tier: 2,
        available: true,
        pricing: {
          monthlyUsd: 0,
          perSeat: false,
        },
        limits: {
          premiumRequestsPerMonth: 50,
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

      const edgesToAdd = [budgetEdge];

      // If connectFrom is specified, create edge from that SKU to the new one
      if (connectFrom) {
        // Find source SKU
        const allSkus = [
          ...Object.values(SKU_MAP),
          ...(currentScenario.customSkus || []),
        ];
        const sourceSku = allSkus.find((s: Sku) => s.id === connectFrom);

        // Auto-determine edge type based on audience relationship
        // Same audience = UPGRADE, different audience = ORG_JOIN
        const sourceAudience = sourceSku?.audience || "individual";
        const isSameAudience = sourceAudience === newSku.audience;

        const edgeType = isSameAudience ? EdgeType.UPGRADE : EdgeType.ORG_JOIN;

        const edgeLabel = isSameAudience
          ? "Upgrade"
          : newSku.audience === "enterprise"
            ? "Join enterprise"
            : "Join organization";

        const connectingEdge = {
          id: `${connectFrom}-to-${newSkuId}`,
          source: connectFrom,
          target: newSkuId,
          type: edgeType,
          label: edgeLabel,
        };

        edgesToAdd.push(connectingEdge);
      }

      // Update the scenario with both the SKU and edges, and position if provided
      const updated = {
        ...currentScenario,
        customSkus: [...(currentScenario.customSkus || []), newSku],
        edges: [...currentScenario.edges, ...edgesToAdd],
        nodePositions: position
          ? { ...currentScenario.nodePositions, [newSkuId]: position }
          : currentScenario.nodePositions,
        modifiedAt: new Date().toISOString(),
      };

      updateCurrentScenario(updated);

      return newSkuId;
    },
    [currentScenario, updateCurrentScenario]
  );

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
