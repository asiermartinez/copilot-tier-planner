"use client";

import { useMemo } from "react";
import { Node, Position } from "@xyflow/react";
import type { Sku } from "@/types/sku";
import type { SkuNodeData } from "@/components/VisualBuilder/SkuNode";
import { getSimplifiedSkuName } from "@/data/skus";
import {
  getTierName,
  getDefaultPosition,
} from "@/utils/nodePositioning";

interface UseVisualNodesOptions {
  builtInSkus: Sku[];
  customSkus?: Sku[];
  nodePositions?: Record<string, { x: number; y: number }>;
}

/**
 * Custom hook to generate visual nodes from SKU data
 */
export function useVisualNodes({
  builtInSkus,
  customSkus = [],
  nodePositions = {},
}: UseVisualNodesOptions): Node<SkuNodeData>[] {
  return useMemo(() => {
    const allSkus = [...builtInSkus, ...customSkus];

    // Position nodes based on audience and tier
    const individualNodes: Node<SkuNodeData>[] = [];
    const orgNodes: Node<SkuNodeData>[] = [];

    allSkus.forEach(sku => {
      const isIndividual = sku.audience === "individual";
      const tierName = getTierName(sku.tier);

      // Use stored position if available, otherwise calculate default
      const position =
        nodePositions[sku.id] ||
        getDefaultPosition(sku, individualNodes, orgNodes);

      const node: Node<SkuNodeData> = {
        id: sku.id,
        type: "skuNode",
        position,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          skuId: sku.id,
          label: getSimplifiedSkuName(sku),
          tier: tierName,
          isIndividual,
          monthlyUsd: sku.pricing.monthlyUsd,
        },
      };

      if (isIndividual) {
        individualNodes.push(node);
      } else {
        orgNodes.push(node);
      }
    });

    return [...individualNodes, ...orgNodes];
  }, [builtInSkus, customSkus, nodePositions]);
}
