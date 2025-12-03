"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type SkuScenario,
  type SkuEdge,
  type ViewMode,
  type VisualBuilderState,
  type ScenarioExport,
  type SkuVariation,
} from "@/types/scenario";
import type { SkuId } from "@/types/sku";
import { DEFAULT_SCENARIO } from "@/data/defaultScenario";

/**
 * Context value for scenario management
 */
interface ScenarioContextValue {
  /** Current view mode */
  viewMode: ViewMode;
  /** Set view mode */
  setViewMode: (mode: ViewMode) => void;

  /** Current scenario */
  currentScenario: SkuScenario;
  /** All available scenarios */
  scenarios: SkuScenario[];

  /** Visual builder state */
  visualState: VisualBuilderState;

  /** Update current scenario */
  updateCurrentScenario: (scenario: SkuScenario) => void;

  /** Add a new scenario */
  addScenario: (scenario: SkuScenario) => void;

  /** Delete a scenario */
  deleteScenario: (scenarioId: string) => void;

  /** Switch to a different scenario */
  switchScenario: (scenarioId: string) => void;

  /** Update an edge in the current scenario */
  updateEdge: (edge: SkuEdge) => void;

  /** Add a new edge to the current scenario */
  addEdge: (edge: SkuEdge) => void;

  /** Delete an edge from the current scenario */
  deleteEdge: (edgeId: string) => void;

  /** Mark an edge as desired/recommended */
  setDesiredPath: (edgeId: string, desired: boolean) => void;

  /** Update SKU variation in current scenario */
  updateSkuVariation: (skuId: SkuId, variation: SkuVariation) => void;

  /** Get desired edge from a specific SKU */
  getDesiredEdge: (fromSkuId: SkuId) => SkuEdge | null;

  /** Update edge filters */
  updateEdgeFilters: (
    filters: Partial<VisualBuilderState["edgeFilters"]>
  ) => void;

  /** Set target SKU for path highlighting */
  setTargetSku: (skuId: SkuId | null) => void;

  /** Toggle desired paths highlighting */
  toggleHighlightDesiredPaths: () => void;

  /** Export scenarios to JSON */
  exportScenarios: () => ScenarioExport;

  /** Import scenarios from JSON */
  importScenarios: (exported: ScenarioExport) => void;

  /** Reset to default scenario */
  resetToDefault: () => void;
}

/**
 * Context instance
 */
const ScenarioContext = createContext<ScenarioContextValue | undefined>(
  undefined
);

/**
 * Props for ScenarioProvider
 */
interface ScenarioProviderProps {
  children: ReactNode;
}

/**
 * Provider component for scenario management
 */
export function ScenarioProvider({ children }: ScenarioProviderProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("messages");

  // Scenario state
  const [scenarios, setScenarios] = useState<SkuScenario[]>([DEFAULT_SCENARIO]);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>("default");

  // Visual builder state
  const [visualState, setVisualState] = useState<VisualBuilderState>({
    viewMode: "messages",
    currentScenarioId: "default",
    scenarios: [DEFAULT_SCENARIO],
    edgeFilters: {
      showUpgrades: true,
      showBudget: false,
      showOrgJoin: false,
      showContextSwitch: false,
    },
    highlightDesiredPaths: true,
    targetSkuId: null,
  });

  // Get current scenario
  const currentScenario =
    scenarios.find(s => s.id === currentScenarioId) || DEFAULT_SCENARIO;

  // Update current scenario
  const updateCurrentScenario = useCallback((scenario: SkuScenario) => {
    setScenarios(prev => prev.map(s => (s.id === scenario.id ? scenario : s)));
    setVisualState(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s => (s.id === scenario.id ? scenario : s)),
    }));
  }, []);

  // Add a new scenario
  const addScenario = useCallback((scenario: SkuScenario) => {
    setScenarios(prev => [...prev, scenario]);
    setVisualState(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, scenario],
    }));
  }, []);

  // Delete a scenario
  const deleteScenario = useCallback(
    (scenarioId: string) => {
      // Don't allow deleting the default scenario
      if (scenarioId === "default") return;

      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      setVisualState(prev => ({
        ...prev,
        scenarios: prev.scenarios.filter(s => s.id !== scenarioId),
      }));

      // If deleting current scenario, switch to default
      if (currentScenarioId === scenarioId) {
        setCurrentScenarioId("default");
        setVisualState(prev => ({
          ...prev,
          currentScenarioId: "default",
        }));
      }
    },
    [currentScenarioId]
  );

  // Switch to a different scenario
  const switchScenario = useCallback((scenarioId: string) => {
    setCurrentScenarioId(scenarioId);
    setVisualState(prev => ({
      ...prev,
      currentScenarioId: scenarioId,
    }));
  }, []);

  // Update an edge in the current scenario
  const updateEdge = useCallback(
    (edge: SkuEdge) => {
      const updated = {
        ...currentScenario,
        edges: currentScenario.edges.map(e => (e.id === edge.id ? edge : e)),
        modifiedAt: new Date().toISOString(),
      };
      updateCurrentScenario(updated);
    },
    [currentScenario, updateCurrentScenario]
  );

  // Add a new edge to the current scenario
  const addEdge = useCallback(
    (edge: SkuEdge) => {
      const updated = {
        ...currentScenario,
        edges: [...currentScenario.edges, edge],
        modifiedAt: new Date().toISOString(),
      };
      updateCurrentScenario(updated);
    },
    [currentScenario, updateCurrentScenario]
  );

  // Delete an edge from the current scenario
  const deleteEdge = useCallback(
    (edgeId: string) => {
      const updated = {
        ...currentScenario,
        edges: currentScenario.edges.filter(e => e.id !== edgeId),
        modifiedAt: new Date().toISOString(),
      };
      updateCurrentScenario(updated);
    },
    [currentScenario, updateCurrentScenario]
  );

  // Mark an edge as desired/recommended
  // Only one edge from the same source can be marked as desired
  const setDesiredPath = useCallback(
    (edgeId: string, desired: boolean) => {
      // Find the edge being marked
      const targetEdge = currentScenario.edges.find(e => e.id === edgeId);
      if (!targetEdge) return;

      const updated = {
        ...currentScenario,
        edges: currentScenario.edges.map(e => {
          // If marking as desired, unmark all other edges from the same source
          if (e.id === edgeId) {
            return { ...e, desired };
          } else if (desired && e.source === targetEdge.source) {
            return { ...e, desired: false };
          }
          return e;
        }),
        modifiedAt: new Date().toISOString(),
      };
      updateCurrentScenario(updated);
    },
    [currentScenario, updateCurrentScenario]
  );

  // Update SKU variation in current scenario
  const updateSkuVariation = useCallback(
    (skuId: SkuId, variation: SkuVariation) => {
      const updated = {
        ...currentScenario,
        skuVariations: {
          ...currentScenario.skuVariations,
          [skuId]: variation,
        },
        modifiedAt: new Date().toISOString(),
      };
      updateCurrentScenario(updated);
    },
    [currentScenario, updateCurrentScenario]
  );

  // Get desired edge from a specific SKU
  const getDesiredEdge = useCallback(
    (fromSkuId: SkuId): SkuEdge | null => {
      const desired = currentScenario.edges.find(
        edge => edge.source === fromSkuId && edge.desired === true
      );
      return desired || null;
    },
    [currentScenario]
  );

  // Update edge filters
  const updateEdgeFilters = useCallback(
    (filters: Partial<VisualBuilderState["edgeFilters"]>) => {
      setVisualState(prev => ({
        ...prev,
        edgeFilters: {
          ...prev.edgeFilters,
          ...filters,
        },
      }));
    },
    []
  );

  // Set target SKU for path highlighting
  const setTargetSku = useCallback((skuId: SkuId | null) => {
    setVisualState(prev => ({
      ...prev,
      targetSkuId: skuId,
    }));
  }, []);

  // Toggle desired paths highlighting
  const toggleHighlightDesiredPaths = useCallback(() => {
    setVisualState(prev => ({
      ...prev,
      highlightDesiredPaths: !prev.highlightDesiredPaths,
    }));
  }, []);

  // Export scenarios to JSON
  const exportScenarios = useCallback((): ScenarioExport => {
    return {
      version: "1.0",
      scenarios,
      exportedAt: new Date().toISOString(),
    };
  }, [scenarios]);

  // Import scenarios from JSON
  const importScenarios = useCallback(
    (exported: ScenarioExport) => {
      // Validate version
      if (exported.version !== "1.0") {
        throw new Error(
          `Unsupported scenario export version: ${exported.version}`
        );
      }

      // Import scenarios (keep default if not included)
      const hasDefault = exported.scenarios.some(s => s.id === "default");
      const importedScenarios = hasDefault
        ? exported.scenarios
        : [DEFAULT_SCENARIO, ...exported.scenarios];

      setScenarios(importedScenarios);
      setVisualState(prev => ({
        ...prev,
        scenarios: importedScenarios,
      }));

      // Switch to first imported scenario if current doesn't exist
      const currentExists = importedScenarios.some(
        s => s.id === currentScenarioId
      );
      if (!currentExists) {
        setCurrentScenarioId(importedScenarios[0].id);
        setVisualState(prev => ({
          ...prev,
          currentScenarioId: importedScenarios[0].id,
        }));
      }
    },
    [currentScenarioId]
  );

  // Reset to default scenario
  const resetToDefault = useCallback(() => {
    setScenarios([DEFAULT_SCENARIO]);
    setCurrentScenarioId("default");
    setVisualState({
      viewMode: "messages",
      currentScenarioId: "default",
      scenarios: [DEFAULT_SCENARIO],
      edgeFilters: {
        showUpgrades: true,
        showBudget: false,
        showOrgJoin: false,
        showContextSwitch: false,
      },
      highlightDesiredPaths: true,
      targetSkuId: null,
    });
  }, []);

  const value: ScenarioContextValue = {
    viewMode,
    setViewMode,
    currentScenario,
    scenarios,
    visualState,
    updateCurrentScenario,
    addScenario,
    deleteScenario,
    switchScenario,
    updateEdge,
    addEdge,
    deleteEdge,
    setDesiredPath,
    updateSkuVariation,
    getDesiredEdge,
    updateEdgeFilters,
    setTargetSku,
    toggleHighlightDesiredPaths,
    exportScenarios,
    importScenarios,
    resetToDefault,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
}

/**
 * Hook to access scenario context
 */
export function useScenario(): ScenarioContextValue {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error("useScenario must be used within a ScenarioProvider");
  }
  return context;
}
