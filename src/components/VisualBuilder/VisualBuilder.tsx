"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  ConnectionMode,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@primer/react";
import { PlusIcon } from "@primer/octicons-react";

import { usePlanner, useScenario } from "@/contexts";
import type { SkuId } from "@/types/sku";
import type { AccountType } from "@/types/userState";
import SkuNode from "./SkuNode";
import CustomEdge from "./CustomEdge";
import EdgeFilters from "@/components/EdgeFilters";
import SkuEditor from "@/components/SkuEditor";
import styles from "./VisualBuilder.module.css";
import { getHighestPriorityAlert } from "@/utils/alerts/generateThresholdAlerts";
import { getAllSkus as getBuiltInSkus } from "@/data/skus";
import { useVisualNodes, useVisualEdges, useCustomSkuManager } from "@/hooks";

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

  // Custom SKU management
  const { createCustomSku, customSkuExists } = useCustomSkuManager({
    currentScenario,
    updateCurrentScenario,
  });

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

  // Generate nodes using custom hook
  const builtInSkus = getBuiltInSkus();
  const initialNodes = useVisualNodes({
    builtInSkus,
    customSkus: currentScenario.customSkus,
    nodePositions: currentScenario.nodePositions,
  });

  // Handler for marking edge as desired
  const handleMarkDesired = useCallback(
    (edgeId: string, desired: boolean) => {
      setDesiredPath(edgeId, desired);
    },
    [setDesiredPath]
  );

  const [nodes, setNodes] = useNodesState(initialNodes);

  // Track previous custom SKUs to detect when they change
  const prevCustomSkusRef = useRef(currentScenario.customSkus);

  // Create stable node positions map for edge generation
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    initialNodes.forEach(node => {
      positions[node.id] = node.position;
    });
    return positions;
  }, [initialNodes]);

  // Memoize edgeFilters to prevent object recreation
  const stableEdgeFilters = useMemo(
    () => visualState.edgeFilters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      visualState.edgeFilters.showUpgrades,
      visualState.edgeFilters.showBudget,
      visualState.edgeFilters.showOrgJoin,
      visualState.edgeFilters.showContextSwitch,
    ]
  );

  // Generate edges directly - no state needed, passing only what's needed
  const edges = useVisualEdges({
    scenarioEdges: currentScenario.edges,
    edgeFilters: stableEdgeFilters,
    highlightDesiredPaths: visualState.highlightDesiredPaths,
    nodePositions,
    currentSkuId: userState.subscription.skuId,
    selectedEdgeId,
    onMarkDesired: handleMarkDesired,
  });

  // Node change handler that saves positions
  const handleNodesChange: OnNodesChange = useCallback(
    changes => {
      setNodes(nds => applyNodeChanges(changes, nds) as typeof nds);

      // Check if any changes are position changes
      const positionChanges = changes.filter(
        change => change.type === "position" && change.dragging === false
      );

      if (positionChanges.length > 0) {
        // Update node positions in the scenario
        const newPositions = { ...currentScenario.nodePositions };
        let hasChanges = false;

        positionChanges.forEach(change => {
          if (change.type === "position" && change.position) {
            const oldPos = currentScenario.nodePositions?.[change.id];
            const newPos = change.position;

            // Only update if position actually changed
            if (!oldPos || oldPos.x !== newPos.x || oldPos.y !== newPos.y) {
              newPositions[change.id] = newPos;
              hasChanges = true;
            }
          }
        });

        // Only update scenario if positions actually changed
        if (hasChanges) {
          const updated = {
            ...currentScenario,
            nodePositions: newPositions,
            modifiedAt: new Date().toISOString(),
          };
          updateCurrentScenario(updated);
        }
      }
    },
    [setNodes, currentScenario, updateCurrentScenario]
  );

  // Edge change handler (for React Flow compatibility)
  const handleEdgesChange: OnEdgesChange = useCallback(() => {
    // Edges are computed, so we don't need to handle changes
  }, []);

  // Sync nodes when custom SKUs are added/removed or their data changes
  useEffect(() => {
    const prevCustomSkus = prevCustomSkusRef.current || [];
    const currentCustomSkus = currentScenario.customSkus || [];

    // Check if custom SKUs were added or removed
    const prevIds = new Set(prevCustomSkus.map(s => s.id));
    const currentIds = new Set(currentCustomSkus.map(s => s.id));

    const skuAdded = currentCustomSkus.some(s => !prevIds.has(s.id));
    const skuRemoved = prevCustomSkus.some(s => !currentIds.has(s.id));

    // If SKUs were added or removed, do a full sync
    if (skuAdded || skuRemoved) {
      setNodes(initialNodes);
      prevCustomSkusRef.current = currentCustomSkus;
    } else if (prevCustomSkus !== currentCustomSkus) {
      // Custom SKUs array changed but no adds/removes - must be data changes
      // Update only the data property to preserve React Flow positions
      setNodes(nds =>
        nds.map(node => {
          const updated = initialNodes.find(n => n.id === node.id);
          if (!updated) return node;

          // Only update the data property - preserve position and all React Flow state
          return {
            ...node,
            data: updated.data,
          };
        })
      );
      prevCustomSkusRef.current = currentCustomSkus;
    }
    // Note: initialNodes is intentionally not a dependency to prevent infinite loops.
    // It's derived from customSkus (and nodePositions), so when customSkus changes,
    // initialNodes will have the latest data. Including it would cause loops because
    // position updates -> initialNodes recalc -> effect runs -> position updates...
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScenario.customSkus, setNodes]);

  // Handle node click - switch to the plan and select node
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: { data: { skuId: SkuId } }) => {
      const targetSkuId = node.data.skuId;

      // Determine account type based on target SKU
      let accountType: AccountType = "individual";

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
    (
      event: React.MouseEvent,
      edge: { id: string; source: string; target: string }
    ) => {
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
      let accountType: AccountType = "individual";

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
    const newSkuId = createCustomSku();

    // Mark this SKU as pending to switch to after it's added
    setPendingSkuSwitch(newSkuId);
    // Also set the ref for panning
    pendingPanRef.current = newSkuId;
  }, [createCustomSku]);

  // Switch to new SKU when it's added to the scenario
  useEffect(() => {
    if (pendingSkuSwitch && customSkuExists(pendingSkuSwitch)) {
      updateAccountTypeAndSku("individual", pendingSkuSwitch);
      setPendingSkuSwitch(null);
    }
  }, [pendingSkuSwitch, customSkuExists, updateAccountTypeAndSku]);

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
        onEdgesChange={handleEdgesChange}
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
export function VisualBuilder() {
  return (
    <ReactFlowProvider>
      <VisualBuilderInner />
    </ReactFlowProvider>
  );
}
