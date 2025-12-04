"use client";

import { useMemo } from "react";
import { Edge } from "@xyflow/react";
import type { SkuEdge, VisualBuilderState } from "@/types/scenario";
import { EdgeType } from "@/types/scenario";
import { calculateEdgeHandles } from "@/utils/nodePositioning";

interface UseVisualEdgesOptions {
  scenarioEdges: SkuEdge[];
  edgeFilters: VisualBuilderState["edgeFilters"];
  highlightDesiredPaths: boolean;
  nodePositions: Record<string, { x: number; y: number }>;
  currentSkuId: string;
  selectedEdgeId: string | null;
  onMarkDesired: (edgeId: string, desired: boolean) => void;
}

/**
 * Custom hook to generate visual edges from scenario data
 */
export function useVisualEdges({
  scenarioEdges,
  edgeFilters,
  highlightDesiredPaths,
  nodePositions,
  currentSkuId,
  selectedEdgeId,
  onMarkDesired,
}: UseVisualEdgesOptions): Edge[] {
  return useMemo(() => {
    return scenarioEdges
      .filter(edge => {
        // Apply edge type filters
        if (edge.type === EdgeType.UPGRADE && !edgeFilters.showUpgrades)
          return false;
        if (edge.type === EdgeType.BUDGET && !edgeFilters.showBudget)
          return false;
        if (edge.type === EdgeType.ORG_JOIN && !edgeFilters.showOrgJoin)
          return false;
        return true;
      })
      .map(edge => {
        const isDesired = edge.desired === true;
        const isBudget = edge.type === EdgeType.BUDGET;

        // Determine if this edge should animate
        const shouldAnimate =
          isDesired && highlightDesiredPaths && edge.source === currentSkuId;

        // Determine edge styling based on type and state
        let edgeStyle: {
          stroke: string;
          strokeWidth: number;
          strokeDasharray?: string;
        } = {
          stroke: "var(--borderColor-muted)",
          strokeWidth: 1.5,
        };

        if (isBudget) {
          edgeStyle = {
            stroke: "var(--borderColor-muted)",
            strokeWidth: 1.5,
          };
        }

        if (edge.type === EdgeType.ORG_JOIN) {
          edgeStyle.strokeDasharray = "4,4";
          edgeStyle.stroke = "var(--borderColor-default)";
        }

        // Determine edge type for better routing
        const edgeType = isBudget ? "smoothstep" : "default";
        const edgeData: {
          desired: boolean;
          shouldAnimate: boolean;
          onMarkDesired: (edgeId: string, desired: boolean) => void;
          showMarkButton: boolean;
          type?: string;
        } = {
          desired: isDesired,
          shouldAnimate: shouldAnimate,
          onMarkDesired,
          showMarkButton: highlightDesiredPaths,
        };

        if (isBudget) {
          edgeData.type = "smoothstep";
        }

        // Calculate positions and handles
        const sourcePos = nodePositions[edge.source] || { x: 0, y: 0 };
        const targetPos = nodePositions[edge.target] || { x: 0, y: 0 };
        const edgeHandles = calculateEdgeHandles(
          sourcePos,
          targetPos,
          isBudget
        );

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edgeType,
          label: edge.label,
          animated: false,
          style: edgeStyle,
          data: edgeData,
          selected: edge.id === selectedEdgeId,
          ...(isBudget
            ? {
                style: {
                  ...edgeStyle,
                  strokeLinecap: "round" as const,
                },
              }
            : {}),
          ...edgeHandles,
        };
      });
  }, [
    scenarioEdges,
    edgeFilters,
    highlightDesiredPaths,
    nodePositions,
    currentSkuId,
    selectedEdgeId,
    onMarkDesired,
  ]);
}
