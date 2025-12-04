"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Node,
  Edge,
  ConnectionMode,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@primer/react";
import { PlusIcon } from "@primer/octicons-react";

import { usePlanner, useScenario } from "@/contexts";
import { EdgeType } from "@/types/scenario";
import type { SkuId, SkuTier, Sku } from "@/types/sku";
import { OverageBehavior } from "@/types/sku";
import SkuNode from "./SkuNode";
import type { SkuNodeData } from "./SkuNode";
import CustomEdge from "./CustomEdge";
import EdgeFilters from "@/components/EdgeFilters";
import SkuEditor from "@/components/SkuEditor";
import styles from "./VisualBuilder.module.css";
import { getHighestPriorityAlert } from "@/utils/alerts/generateThresholdAlerts";
import {
  getAllSkus as getBuiltInSkus,
  getSimplifiedSkuName,
} from "@/data/skus";

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
 * Inner Visual Builder component - must be wrapped in ReactFlowProvider
 */
function VisualBuilderInner() {
  const {
    updateAccountTypeAndSku,
    updateOverageBudget,
    userState,
    thresholdsConfig,
  } = usePlanner();
  const {
    currentScenario,
    visualState,
    setDesiredPath,
    updateEdgeFilters,
    updateCurrentScenario,
  } = useScenario();

  // Get React Flow instance for viewport control
  const { setCenter } = useReactFlow();

  // Track selected edge for marking as desired
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Track pending SKU to switch to after creation
  const [pendingSkuSwitch, setPendingSkuSwitch] = useState<SkuId | null>(null);

  // Track pending pan - use ref to avoid stale closures
  const pendingPanRef = useRef<SkuId | null>(null);

  // Auto-enable recommended paths checkbox when threshold is reached
  useEffect(() => {
    const highestAlert = getHighestPriorityAlert(
      userState,
      thresholdsConfig,
      currentScenario.customSkus
    );

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
    currentScenario.customSkus,
  ]);

  // Build nodes from SKU hierarchy - horizontal layout
  const initialNodes: Node<SkuNodeData>[] = useMemo(() => {
    const builtInSkus = getBuiltInSkus();
    const allSkus = [...builtInSkus, ...(currentScenario.customSkus || [])];
    const storedPositions = currentScenario.nodePositions || {};

    // Helper to get tier name string
    const getTierName = (tier: SkuTier): string => {
      const tierNames: Record<SkuTier, string> = {
        0: "FREE",
        1: "PRO",
        2: "PRO_PLUS",
        3: "BUSINESS",
        4: "ENTERPRISE",
      };
      return tierNames[tier] || "FREE";
    };

    // Helper to find next available position by finding the furthest node
    const findNextAvailablePosition = (
      audience: "individual" | "organization" | "enterprise",
      allExistingNodes: Node<SkuNodeData>[]
    ): { x: number; y: number } => {
      const nodeWidth = 200; // Approximate node width
      const horizontalPadding = 150; // Horizontal spacing between nodes

      // Filter nodes by audience
      const sameAudienceNodes = allExistingNodes.filter(node => {
        const nodeData = node.data as SkuNodeData;
        return nodeData.isIndividual === (audience === "individual");
      });

      if (sameAudienceNodes.length === 0) {
        // No existing nodes for this audience, use default position
        return audience === "individual"
          ? { x: 700, y: 150 }
          : { x: 700, y: 600 };
      }

      // Find the node with the furthest right position
      const furthestNode = sameAudienceNodes.reduce((furthest, current) => {
        return current.position.x > furthest.position.x ? current : furthest;
      });

      // Place new node to the right of the furthest node at the same height
      return {
        x: furthestNode.position.x + nodeWidth + horizontalPadding,
        y: furthestNode.position.y,
      };
    };

    // Helper to calculate default position based on tier and audience
    const getDefaultPosition = (
      sku: Sku,
      individualNodes: Node<SkuNodeData>[],
      orgNodes: Node<SkuNodeData>[]
    ): { x: number; y: number } => {
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
    };

    // Position nodes based on audience and tier
    const individualNodes: Node<SkuNodeData>[] = [];
    const orgNodes: Node<SkuNodeData>[] = [];

    allSkus.forEach(sku => {
      const isIndividual = sku.audience === "individual";
      const tierName = getTierName(sku.tier);

      // Use stored position if available, otherwise calculate default
      const position =
        storedPositions[sku.id] ||
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
  }, [currentScenario.customSkus, currentScenario.nodePositions]);

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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Track previous initialNodes to detect changes
  const prevInitialNodesRef = useRef(initialNodes);

  // Sync nodes when custom SKUs are added/removed (but not when updated)
  useEffect(() => {
    const prevNodeIds = new Set(prevInitialNodesRef.current.map(n => n.id));
    const newNodeIds = new Set(initialNodes.map(n => n.id));

    // Check if any nodes were added or removed
    const nodeAdded = initialNodes.some(n => !prevNodeIds.has(n.id));
    const nodeRemoved = prevInitialNodesRef.current.some(
      n => !newNodeIds.has(n.id)
    );

    // Only sync if nodes were added/removed, not just updated
    if (nodeAdded || nodeRemoved) {
      setNodes(initialNodes);
    } else {
      // Update node data without replacing the entire array
      // IMPORTANT: Preserve position and all React Flow state from current nodes
      setNodes(nds =>
        nds.map(node => {
          const updated = initialNodes.find(n => n.id === node.id);
          if (!updated) return node;

          // Only update the data property - preserve everything else
          // This prevents React Flow from repositioning nodes
          return {
            ...node,
            data: updated.data,
          };
        })
      );
    }

    // Update ref for next comparison
    prevInitialNodesRef.current = initialNodes;
  }, [initialNodes, setNodes]);

  // Sync edges when initialEdges changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node changes and save positions when nodes are dragged
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<SkuNodeData>>[]) => {
      onNodesChange(changes);

      // Check if any changes are position changes
      const positionChanges = changes.filter(
        change => change.type === "position" && change.dragging === false
      );

      if (positionChanges.length > 0) {
        // Update node positions in the scenario
        const newPositions = { ...currentScenario.nodePositions };
        positionChanges.forEach(change => {
          if (change.type === "position" && change.position) {
            newPositions[change.id] = change.position;
          }
        });

        const updated = {
          ...currentScenario,
          nodePositions: newPositions,
          modifiedAt: new Date().toISOString(),
        };
        updateCurrentScenario(updated);
      }
    },
    [onNodesChange, currentScenario, updateCurrentScenario]
  );

  // Update nodes when custom SKUs change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when scenario or filters change
  useEffect(() => {
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

  // Handle Add Custom SKU button click
  const handleAddCustomSku = useCallback(() => {
    // Generate unique ID for the new SKU
    const timestamp = Date.now();
    const newSkuId = `custom-${timestamp}` as SkuId;

    // Create a default custom SKU
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
      type: EdgeType.BUDGET as unknown as import("@/types/scenario").EdgeType,
      label: "Set overages",
    };

    // Update the scenario with both the SKU and edge in a single operation
    const updated = {
      ...currentScenario,
      customSkus: [...(currentScenario.customSkus || []), newSku],
      edges: [...currentScenario.edges, budgetEdge],
      modifiedAt: new Date().toISOString(),
    };

    updateCurrentScenario(updated);

    // Mark this SKU as pending to switch to after it's added
    setPendingSkuSwitch(newSkuId);
    // Also set the ref for panning
    pendingPanRef.current = newSkuId;
  }, [currentScenario, updateCurrentScenario]);

  // Switch to new SKU when it's added to the scenario
  useEffect(() => {
    if (pendingSkuSwitch) {
      const customSkuExists = currentScenario.customSkus?.some(
        s => s.id === pendingSkuSwitch
      );
      if (customSkuExists) {
        updateAccountTypeAndSku("individual", pendingSkuSwitch);
        setPendingSkuSwitch(null);
      }
    }
  }, [pendingSkuSwitch, currentScenario.customSkus, updateAccountTypeAndSku]);

  // Separate effect: Pan to new node when it appears in nodes array
  useEffect(() => {
    if (pendingPanRef.current) {
      const newNode = nodes.find(n => n.id === pendingPanRef.current);
      if (newNode) {
        const targetX = newNode.position.x + 100;
        const targetY = newNode.position.y + 75;

        requestAnimationFrame(() => {
          setCenter(targetX, targetY, {
            zoom: 1,
            duration: 800,
          });
        });

        pendingPanRef.current = null;
      }
    }
  }, [nodes, setCenter]);

  return (
    <div className={styles.visualBuilder}>
      {/* SKU Editor Panel */}
      <SkuEditor />

      {/* Add SKU Button */}
      <div className={styles.addSkuButton}>
        <Button
          variant="primary"
          leadingVisual={PlusIcon}
          onClick={handleAddCustomSku}
        >
          Add new SKU
        </Button>
      </div>

      {/* Edge Filter Controls */}
      <div className={styles.filterPanel}>
        <EdgeFilters />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
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
        deleteKeyCode={null}
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

/**
 * Main Visual Builder component with ReactFlowProvider wrapper
 */
export default function VisualBuilder() {
  return (
    <ReactFlowProvider>
      <VisualBuilderInner />
    </ReactFlowProvider>
  );
}
