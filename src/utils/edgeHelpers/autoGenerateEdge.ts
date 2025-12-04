/**
 * Edge Auto-Generation Utilities
 *
 * Automatically determine edge properties (type, label) based on source and target nodes.
 */

import type { SkuId, Sku } from "@/types/sku";
import type { SkuEdge } from "@/types/scenario";
import { EdgeType } from "@/types/scenario";

/**
 * Generate edge properties based on source and target SKUs
 *
 * @param sourceId - Source SKU ID
 * @param targetId - Target SKU ID
 * @param sourceSku - Source SKU object (for audience check)
 * @param targetSku - Target SKU object (for audience check)
 * @returns Edge type and label
 */
export function inferEdgeProperties(
  sourceId: SkuId,
  targetId: SkuId,
  sourceSku: Sku | undefined,
  targetSku: Sku | undefined
): { type: EdgeType; label: string } {
  // Self-loop = Budget/Overages
  if (sourceId === targetId) {
    return {
      type: EdgeType.BUDGET,
      label: "Set overages",
    };
  }

  // Different nodes - check target audience
  const targetAudience = targetSku?.audience || "individual";

  if (targetAudience === "enterprise") {
    return {
      type: EdgeType.ORG_JOIN,
      label: "Join Enterprise",
    };
  }

  if (targetAudience === "organization") {
    return {
      type: EdgeType.ORG_JOIN,
      label: "Join Org",
    };
  }

  // Default: individual upgrade
  return {
    type: EdgeType.UPGRADE,
    label: "Upgrade",
  };
}

/**
 * Generate a complete edge object for a new connection
 *
 * @param sourceId - Source SKU ID
 * @param targetId - Target SKU ID
 * @param sourceSku - Source SKU object
 * @param targetSku - Target SKU object
 * @returns Complete SkuEdge object
 */
export function generateEdge(
  sourceId: SkuId,
  targetId: SkuId,
  sourceSku: Sku | undefined,
  targetSku: Sku | undefined
): SkuEdge {
  const { type, label } = inferEdgeProperties(
    sourceId,
    targetId,
    sourceSku,
    targetSku
  );

  // Generate unique ID
  const edgeId =
    sourceId === targetId ? `${sourceId}-budget` : `${sourceId}-to-${targetId}`;

  return {
    id: edgeId,
    source: sourceId,
    target: targetId,
    type,
    label,
    desired: false,
  };
}

/**
 * Get action type string for CTA based on edge type and target
 *
 * @param edge - The edge to analyze
 * @param targetSku - Target SKU object
 * @returns Action type string for template variable
 */
export function getActionType(
  edge: SkuEdge,
  targetSku: Sku | undefined
): string {
  if (edge.type === EdgeType.BUDGET) {
    return "Set an overage budget";
  }

  const targetAudience = targetSku?.audience || "individual";

  if (edge.type === EdgeType.ORG_JOIN) {
    if (targetAudience === "enterprise") {
      return "Join";
    }
    return "Join";
  }

  // UPGRADE
  return "Upgrade to";
}

/**
 * Get target plan name for CTA based on edge
 *
 * @param edge - The edge to analyze
 * @param targetSku - Target SKU object
 * @returns Target plan name or empty string for budget edges
 */
export function getTargetPlan(
  edge: SkuEdge,
  targetSku: Sku | undefined
): string {
  // Budget edges have no target plan
  if (edge.type === EdgeType.BUDGET) {
    return "";
  }

  return targetSku?.name || "";
}
