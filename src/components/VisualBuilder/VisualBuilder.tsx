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
  type Connection,
  type OnConnectEnd,
  type OnConnectStart,
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
import { generateEdge } from "@/utils/edgeHelpers";

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
    updateViewport,
  } = useScenario();

  // Get React Flow instance for viewport control and screen conversion
  const reactFlowInstance = useReactFlow();
  const { setCenter, getViewport, setViewport } = reactFlowInstance;

  // Track selected edge for marking as desired
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Track whether editor panel should be shown
  const [showEditor, setShowEditor] = useState<boolean>(false);

  // Track pending SKU to switch to after creation
  const [pendingSkuSwitch, setPendingSkuSwitch] = useState<SkuId | null>(null);

  // Track pending pan - use ref to avoid stale closures
  const pendingPanRef = useRef<SkuId | null>(null);

  // Track connection state for handle visibility - store source node ID
  const [connectingFromNode, setConnectingFromNode] = useState<string | null>(
    null
  );

  // Custom SKU management
  const { createCustomSku, customSkuExists } = useCustomSkuManager({
    currentScenario,
    updateCurrentScenario,
  });

  // Auto-enable recommended paths checkbox when threshold is reached
  useEffect(() => {
    // Get desired edge from current SKU
    const desiredEdge = currentScenario.edges.find(
      edge =>
        edge.source === userState.subscription.skuId && edge.desired === true
    );

    const highestAlert = getHighestPriorityAlert(
      userState,
      thresholdsConfig,
      currentScenario.customSkus,
      desiredEdge || null
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
    currentScenario.edges,
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

      // Check if any changes are position changes (drag ended)
      const positionChanges = changes.filter(
        change => change.type === "position" && change.dragging === false
      );

      if (positionChanges.length > 0) {
        // Deselect all nodes after drag ends
        setNodes(nds =>
          nds.map(node => ({
            ...node,
            selected: false,
          }))
        );

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

  // Edge change handler - handle deletions
  const handleEdgesChange: OnEdgesChange = useCallback(
    changes => {
      // Handle edge deletions
      const deletions = changes.filter(change => change.type === "remove");

      if (deletions.length > 0) {
        const edgeIdsToRemove = new Set(deletions.map(d => d.id));
        const updatedEdges = currentScenario.edges.filter(
          edge => !edgeIdsToRemove.has(edge.id)
        );

        const updated = {
          ...currentScenario,
          edges: updatedEdges,
          modifiedAt: new Date().toISOString(),
        };
        updateCurrentScenario(updated);
      }
    },
    [currentScenario, updateCurrentScenario]
  );

  // Connection handler - create new edges
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const sourceId = connection.source as SkuId;
      const targetId = connection.target as SkuId;

      // Find source and target SKUs
      const allSkus = [
        ...getBuiltInSkus(),
        ...(currentScenario.customSkus || []),
      ];
      const sourceSku = allSkus.find(s => s.id === sourceId);
      const targetSku = allSkus.find(s => s.id === targetId);

      // Generate edge with auto-inferred properties
      const newEdge = generateEdge(sourceId, targetId, sourceSku, targetSku);

      // Check if this exact edge already exists
      const existingEdge = currentScenario.edges.find(
        e => e.source === sourceId && e.target === targetId
      );

      if (existingEdge) {
        // Replace the existing edge with the new one (preserves desired state)
        const updated = {
          ...currentScenario,
          edges: currentScenario.edges.map(e =>
            e.source === sourceId && e.target === targetId
              ? { ...newEdge, desired: e.desired }
              : e
          ),
          modifiedAt: new Date().toISOString(),
        };
        updateCurrentScenario(updated);
      } else {
        // Add new edge to scenario
        const updated = {
          ...currentScenario,
          edges: [...currentScenario.edges, newEdge],
          modifiedAt: new Date().toISOString(),
        };
        updateCurrentScenario(updated);
      }
    },
    [currentScenario, updateCurrentScenario]
  );

  // Handle connection start - track which node we're connecting from
  const handleConnectStart: OnConnectStart = useCallback((_event, params) => {
    setConnectingFromNode(params.nodeId || null);
  }, []);

  // Handle connection end - create new node if released over empty space
  const handleConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      // Stop tracking connection state
      setConnectingFromNode(null);

      // Deselect all nodes after connection ends
      setNodes(nds =>
        nds.map(node => ({
          ...node,
          selected: false,
        }))
      );

      // Only create new node if connection didn't complete to an existing node
      if (!connectionState.toNode && connectionState.fromNode) {
        const sourceId = connectionState.fromNode.id as SkuId;

        // Get mouse position from event
        const targetIsPane = (event.target as HTMLElement).classList.contains(
          "react-flow__pane"
        );

        if (targetIsPane && event instanceof MouseEvent) {
          const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });

          // Create new custom SKU with position and edge from source
          const newSkuId = createCustomSku({ position, connectFrom: sourceId });

          // Show editor panel
          setShowEditor(true);

          // Mark this SKU as pending to switch to after it's added to the scenario
          setPendingSkuSwitch(newSkuId);
          // Also set the ref for panning
          pendingPanRef.current = newSkuId;
        }
      }
    },
    [createCustomSku, reactFlowInstance, setNodes]
  );

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

  // Update nodes when connecting state changes
  useEffect(() => {
    setNodes(nds =>
      nds.map(node => ({
        ...node,
        data: {
          ...node.data,
          isConnecting: connectingFromNode === node.id,
        },
      }))
    );
  }, [connectingFromNode, setNodes]);

  // Handle node click - switch to the plan and select node
  const onNodeClick = useCallback(
    (
      event: React.MouseEvent,
      node: { data: { skuId: SkuId }; position: { x: number; y: number } }
    ) => {
      const targetSkuId = node.data.skuId;

      // Show editor panel
      setShowEditor(true);

      // Deselect any selected edge
      setSelectedEdgeId(null);

      // Determine account type based on target SKU
      let accountType: AccountType = "individual";

      if (targetSkuId === "business") {
        accountType = "organization";
      } else if (targetSkuId === "enterprise") {
        accountType = "enterprise";
      }

      // Update the app state to transition to the new SKU with appropriate account type
      updateAccountTypeAndSku(accountType, targetSkuId);

      // Refocus on the selected node
      const targetX = node.position.x + 100;
      const targetY = node.position.y + 75;

      requestAnimationFrame(() => {
        setCenter(targetX, targetY, {
          zoom: 1,
          duration: 400,
        });
      });
    },
    [updateAccountTypeAndSku, setCenter, setSelectedEdgeId, setShowEditor]
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

      // Select the target node
      setNodes(nds =>
        nds.map(node => ({
          ...node,
          selected: node.id === targetSkuId,
        }))
      );

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
    [
      updateAccountTypeAndSku,
      updateOverageBudget,
      userState.overageBudget,
      setNodes,
    ]
  );

  // Handle canvas click - deselect edge and hide editor
  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null);
    setShowEditor(false);

    // Deselect all nodes
    setNodes(nds =>
      nds.map(node => ({
        ...node,
        selected: false,
      }))
    );
  }, [setNodes]);

  // Handle viewport changes to preserve canvas position
  const onMove = useCallback(() => {
    const viewport = getViewport();
    updateViewport(viewport);
  }, [getViewport, updateViewport]);

  // Restore viewport when component mounts or when switching back to visual mode
  useEffect(() => {
    if (visualState.viewport) {
      setViewport(visualState.viewport, { duration: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount to restore saved viewport position

  // Handle Add Custom SKU button click
  const handleAddCustomSku = useCallback(() => {
    const newSkuId = createCustomSku();

    // Show editor panel
    setShowEditor(true);

    // Mark this SKU as pending to switch to after it's added to the scenario
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
  }, [
    pendingSkuSwitch,
    currentScenario.customSkus,
    customSkuExists,
    updateAccountTypeAndSku,
  ]);

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
            duration: 400,
          });
        });

        pendingPanRef.current = null;
      }
    }
  }, [nodes, setCenter]);

  return (
    <div className={styles.visualBuilder}>
      {/* SKU Editor Panel */}
      {showEditor && <SkuEditor />}

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
        onConnect={handleConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={visualState.viewport || { x: 250, y: 100, zoom: 1 }}
        onMove={onMove}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 },
        }}
        edgesFocusable={true}
        nodesDraggable={true}
        nodesConnectable={true}
        deleteKeyCode="Delete"
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
