"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Node,
  Edge,
  ConnectionMode,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { usePlanner, useScenario } from "@/contexts";
import { EdgeType } from "@/types/scenario";
import type { SkuId } from "@/types/sku";
import SkuNode from "./SkuNode";
import type { SkuNodeData } from "./SkuNode";
import CustomEdge from "./CustomEdge";
import EdgeFilters from "@/components/EdgeFilters";
import NodeEditor from "@/components/NodeEditor";
import styles from "./VisualBuilder.module.css";
import { getHighestPriorityAlert } from "@/utils/alerts/generateThresholdAlerts";

/**
 * Node type registry for React Flow
 */
const nodeTypes = {
  skuNode: SkuNode,
};

/**
 * Edge type registry for React Flow
 */
const edgeTypes = {
  default: CustomEdge,
  smoothstep: CustomEdge,
};

/**
 * Main Visual Builder component - displays SKU hierarchy as interactive graph
 */
export default function VisualBuilder() {
  const {
    updateAccountTypeAndSku,
    updateOverageBudget,
    userState,
    thresholdsConfig,
  } = usePlanner();
  const { currentScenario, visualState, setDesiredPath, updateEdgeFilters } =
    useScenario();

  // Node editor state
  const [selectedSkuId, setSelectedSkuId] = useState<SkuId | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Track selected edge for marking as desired
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Auto-enable recommended paths checkbox when threshold is reached
  useEffect(() => {
    const highestAlert = getHighestPriorityAlert(userState, thresholdsConfig);

    // If we have a critical alert (100% quota or overages), enable recommended paths
    if (highestAlert && !visualState.highlightDesiredPaths) {
      const alertMessage = highestAlert.message.toLowerCase();
      const isCritical =
        alertMessage.includes("100%") ||
        alertMessage.includes("overage") ||
        alertMessage.includes("exceeded");

      if (isCritical) {
        updateEdgeFilters({ ...visualState.edgeFilters });
        // Enable the checkbox by updating visual state
        window.dispatchEvent(new CustomEvent("auto-enable-recommended-paths"));
      }
    }
  }, [
    userState,
    thresholdsConfig,
    visualState.highlightDesiredPaths,
    visualState.edgeFilters,
    updateEdgeFilters,
  ]);

  // Build nodes from SKU hierarchy - horizontal layout
  const initialNodes: Node<SkuNodeData>[] = useMemo(
    () => [
      // Individual tier - horizontal left-to-right layout
      {
        id: "free",
        type: "skuNode",
        position: { x: 0, y: 150 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          skuId: "free",
          label: "Free",
          tier: "FREE",
          isIndividual: true,
        },
      },
      {
        id: "pro-trial",
        type: "skuNode",
        position: { x: 350, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          skuId: "pro-trial",
          label: "Pro (Trial)",
          tier: "PRO",
          isIndividual: true,
        },
      },
      {
        id: "pro",
        type: "skuNode",
        position: { x: 350, y: 300 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          skuId: "pro",
          label: "Pro",
          tier: "PRO",
          isIndividual: true,
        },
      },
      {
        id: "pro-plus",
        type: "skuNode",
        position: { x: 700, y: 150 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          skuId: "pro-plus",
          label: "Pro+",
          tier: "PRO_PLUS",
          isIndividual: true,
        },
      },
      // Organization tier - below individual plans
      {
        id: "business",
        type: "skuNode",
        position: { x: 350, y: 600 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          skuId: "business",
          label: "Business",
          tier: "BUSINESS",
          isIndividual: false,
        },
      },
      {
        id: "enterprise",
        type: "skuNode",
        position: { x: 700, y: 600 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          skuId: "enterprise",
          label: "Enterprise",
          tier: "ENTERPRISE",
          isIndividual: false,
        },
      },
    ],
    []
  );

  // Build edges from scenario configuration
  const initialEdges: Edge[] = useMemo(() => {
    const { edgeFilters, highlightDesiredPaths } = visualState;

    // Helper to find node position
    const getNodePosition = (nodeId: string) => {
      return (
        initialNodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 }
      );
    };

    // Handler for marking edge as desired
    const handleMarkDesired = (edgeId: string, desired: boolean) => {
      setDesiredPath(edgeId, desired);
    };

    return currentScenario.edges
      .filter(edge => {
        // Apply edge type filters
        if (edge.type === EdgeType.UPGRADE && !edgeFilters.showUpgrades)
          return false;
        if (edge.type === EdgeType.BUDGET && !edgeFilters.showBudget)
          return false;
        if (edge.type === EdgeType.ORG_JOIN && !edgeFilters.showOrgJoin)
          return false;
        if (
          edge.type === EdgeType.CONTEXT_SWITCH &&
          !edgeFilters.showContextSwitch
        )
          return false;
        return true;
      })
      .map(edge => {
        const isDesired = edge.desired === true;
        const isBudget = edge.type === EdgeType.BUDGET;

        // Determine if this edge should animate
        // Only animate if:
        // 1. Edge is marked as desired
        // 2. Recommended paths checkbox is enabled
        // 3. The source node is currently selected
        const shouldAnimate =
          isDesired &&
          highlightDesiredPaths &&
          edge.source === userState.subscription.skuId;

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
          // Budget edges use same minimal styling as other edges
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
          onMarkDesired: handleMarkDesired,
          showMarkButton: highlightDesiredPaths,
        };

        // Budget edges use smoothstep to route around the card
        if (isBudget) {
          edgeData.type = "smoothstep";
        }

        // Smart handle selection based on node positions
        let edgeHandles = {};

        if (isBudget) {
          // Budget edges (self-loops) go from bottom around to top-right for visible loop
          edgeHandles = {
            sourceHandle: "bottom-source",
            targetHandle: "right",
          };
        } else {
          // Calculate relative positions for smart routing
          const sourcePos = getNodePosition(edge.source);
          const targetPos = getNodePosition(edge.target);

          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;

          // Determine best handles based on relative position
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection is dominant
            if (dx > 0) {
              // Target is to the right
              edgeHandles = {
                sourceHandle: "right-source",
                targetHandle: "left",
              };
            } else {
              // Target is to the left
              edgeHandles = {
                sourceHandle: "left-source",
                targetHandle: "right",
              };
            }
          } else {
            // Vertical connection is dominant
            if (dy > 0) {
              // Target is below
              edgeHandles = {
                sourceHandle: "bottom-source",
                targetHandle: "top",
              };
            } else {
              // Target is above
              edgeHandles = {
                sourceHandle: "top-source",
                targetHandle: "bottom",
              };
            }
          }
        }

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edgeType,
          label: edge.label,
          animated: false, // We use CSS animation instead
          style: edgeStyle,
          data: edgeData,
          selected: edge.id === selectedEdgeId,
          // Add offset for budget loops to route around the card
          ...(isBudget
            ? {
                style: {
                  ...edgeStyle,
                  strokeLinecap: "round",
                },
              }
            : {}),
          ...edgeHandles,
        };
      });
  }, [
    currentScenario.edges,
    visualState,
    initialNodes,
    userState.subscription.skuId,
    selectedEdgeId,
    setDesiredPath,
  ]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update edges when scenario or filters change
  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node click - switch to the plan and select node
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const data = node.data as SkuNodeData;
      const targetSkuId = data.skuId;

      // Determine account type based on target SKU
      let accountType: "individual" | "organization" | "enterprise" =
        "individual";

      if (targetSkuId === "business") {
        accountType = "organization";
      } else if (targetSkuId === "enterprise") {
        accountType = "enterprise";
      }

      // Update the app state to transition to the new SKU with appropriate account type
      updateAccountTypeAndSku(accountType, targetSkuId);
    },
    [updateAccountTypeAndSku]
  );

  // Listen for edit node events from NodeToolbar
  useEffect(() => {
    const handleEditEvent = (event: CustomEvent<{ skuId: SkuId }>) => {
      setSelectedSkuId(event.detail.skuId);
      setIsEditorOpen(true);
    };

    window.addEventListener("edit-sku-node", handleEditEvent as EventListener);
    return () => {
      window.removeEventListener(
        "edit-sku-node",
        handleEditEvent as EventListener
      );
    };
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setSelectedSkuId(null);
  }, []);

  // Handle edge click - select edge for marking as desired and navigate to target
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      // Toggle edge selection (for showing mark/unmark button)
      setSelectedEdgeId(prev => (prev === edge.id ? null : edge.id));

      // Find the target SKU from the edge
      const targetSkuId = edge.target as SkuId;

      // Handle budget loop clicks (same source and target) - enable overage budget
      if (edge.source === edge.target) {
        // Check if overage budget is already enabled
        const currentOverageBudget = userState.overageBudget?.maxBudgetUsd;

        // If not enabled, enable it with a default budget
        if (!currentOverageBudget) {
          updateOverageBudget(10); // Default $10 budget
        }
      }

      // For all edges (including budget), ensure we're on the target node
      let accountType: "individual" | "organization" | "enterprise" =
        "individual";

      if (targetSkuId === "business") {
        accountType = "organization";
      } else if (targetSkuId === "enterprise") {
        accountType = "enterprise";
      }

      // Update the app state to transition to the new SKU with appropriate account type
      updateAccountTypeAndSku(accountType, targetSkuId);
    },
    [updateAccountTypeAndSku, updateOverageBudget, userState.overageBudget]
  );

  // Handle canvas click - deselect edge
  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null);
  }, []);

  return (
    <div className={styles.visualBuilder}>
      {/* Edge Filter Controls */}
      <div className={styles.filterPanel}>
        <EdgeFilters />
      </div>

      {/* Node Editor Dialog */}
      <NodeEditor
        skuId={selectedSkuId}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 250, y: 100, zoom: 1 }}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 },
        }}
        edgesFocusable={true}
        nodesDraggable={true}
        nodesConnectable={false}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background
          color="#d0d7de"
          gap={20}
          size={1.5}
          style={{ backgroundColor: "#ffffff" }}
        />
      </ReactFlow>
    </div>
  );
}
