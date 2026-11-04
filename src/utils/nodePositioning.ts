import type { Node } from "@xyflow/react";
import type { Sku, SkuTier } from "@/types/sku";
import type { SkuNodeData } from "@/components/VisualBuilder/SkuNode";

const NODE_WIDTH = 200;
const HORIZONTAL_PADDING = 150;

/**
 * Get tier name string from tier number
 */
export function getTierName(tier: SkuTier): string {
  const tierNames: Record<SkuTier, string> = {
    0: "FREE",
    1: "PRO",
    2: "PRO_PLUS",
    3: "BUSINESS",
    4: "ENTERPRISE",
  };
  return tierNames[tier] || "FREE";
}

/**
 * Find next available position by finding the furthest node in the same audience
 */
export function findNextAvailablePosition(
  audience: "individual" | "organization" | "enterprise",
  allExistingNodes: Node<SkuNodeData>[]
): { x: number; y: number } {
  // Filter nodes by audience
  const sameAudienceNodes = allExistingNodes.filter(node => {
    const nodeData = node.data as SkuNodeData;
    return nodeData.isIndividual === (audience === "individual");
  });

  if (sameAudienceNodes.length === 0) {
    // No existing nodes for this audience, use default position
    return audience === "individual" ? { x: 700, y: 150 } : { x: 700, y: 600 };
  }

  // Find the node with the furthest right position
  const furthestNode = sameAudienceNodes.reduce((furthest, current) => {
    return current.position.x > furthest.position.x ? current : furthest;
  });

  // Place new node to the right of the furthest node at the same height
  return {
    x: furthestNode.position.x + NODE_WIDTH + HORIZONTAL_PADDING,
    y: furthestNode.position.y,
  };
}

/**
 * Calculate default position based on tier and audience for built-in SKUs
 */
export function getDefaultPosition(
  sku: Sku,
  individualNodes: Node<SkuNodeData>[],
  orgNodes: Node<SkuNodeData>[]
): { x: number; y: number } {
  const isIndividual = sku.audience === "individual";
  const allExistingNodes = [...individualNodes, ...orgNodes];
  let x = 0;
  let y = 150;

  if (isIndividual) {
    // Individual plans - horizontal layout
    if (sku.tier === 0) {
      x = 0;
      y = 150;
    } else if (sku.tier === 1 && sku.id === "pro-trial") {
      x = 350;
      y = 0;
    } else if (sku.tier === 1 && sku.id === "pro") {
      x = 350;
      y = 300;
    } else if (sku.tier === 2 && sku.id === "pro-plus") {
      x = 700;
      y = 150;
    } else {
      // Custom individual SKUs - find position to the right of furthest individual node
      return findNextAvailablePosition("individual", allExistingNodes);
    }
  } else {
    // Organization/enterprise plans - below individual plans
    if (sku.tier === 3) {
      x = 350;
      y = 600;
    } else if (sku.tier === 4) {
      x = 700;
      y = 600;
    } else {
      // Custom org SKUs - find position to the right of furthest org node
      return findNextAvailablePosition("organization", allExistingNodes);
    }
  }

  return { x, y };
}

/**
 * Determine best handles based on relative position between nodes
 */
export function calculateEdgeHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  isBudget: boolean
): { sourceHandle: string; targetHandle: string } {
  if (isBudget) {
    // Budget edges (self-loops) go from bottom around to top-right for visible loop
    return {
      sourceHandle: "bottom-source",
      targetHandle: "right",
    };
  }

  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  // Determine best handles based on relative position
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection is dominant
    if (dx > 0) {
      // Target is to the right
      return {
        sourceHandle: "right-source",
        targetHandle: "left",
      };
    } else {
      // Target is to the left
      return {
        sourceHandle: "left-source",
        targetHandle: "right",
      };
    }
  } else {
    // Vertical connection is dominant
    if (dy > 0) {
      // Target is below
      return {
        sourceHandle: "bottom-source",
        targetHandle: "top",
      };
    } else {
      // Target is above
      return {
        sourceHandle: "top-source",
        targetHandle: "bottom",
      };
    }
  }
}
