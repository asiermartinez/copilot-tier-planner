/**
 * Visual Builder Scenario Types
 *
 * Defines the data model for visual SKU planning scenarios,
 * including edges, desired paths, and SKU variations.
 */

import type { SkuId, Sku } from "./sku";
import type { ThresholdsConfig } from "./thresholds";

/**
 * Type of transition between SKUs
 */
export enum EdgeType {
  /** Linear upgrade to next tier */
  UPGRADE = "upgrade",
  /** Add budget to current plan without changing tier */
  BUDGET = "budget",
  /** Transition requiring organization membership */
  ORG_JOIN = "org-join",
}

/**
 * Cost information for an edge transition
 */
export interface EdgeCost {
  /** Type of cost */
  type: "upgrade" | "budget-increase" | "membership";
  /** Estimated cost in USD (monthly) */
  estimatedMonthlyUsd?: number;
  /** Estimated cost in USD (annual) */
  estimatedAnnualUsd?: number;
  /** Additional context about the cost */
  description?: string;
}

/**
 * Edge representing a transition between SKUs
 */
export interface SkuEdge {
  /** Unique identifier for this edge */
  id: string;
  /** Source SKU ID */
  source: SkuId;
  /** Target SKU ID (same as source for budget edges) */
  target: SkuId;
  /** Type of transition */
  type: EdgeType;
  /** Whether this is the desired/recommended path */
  desired?: boolean;
  /** Cost information for this transition */
  cost?: EdgeCost;
  /** Requirements to enable this transition */
  requirements?: string[];
  /** Label to display on the edge */
  label?: string;
}

/**
 * SKU variation - partial SKU properties that override defaults
 */
export type SkuVariation = Partial<Sku>;

/**
 * Complete scenario configuration
 */
export interface SkuScenario {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Custom SKUs created by the user */
  customSkus?: Sku[];
  /** Custom SKU property overrides */
  skuVariations?: Partial<Record<SkuId, SkuVariation>>;
  /** Edge configuration */
  edges: SkuEdge[];
  /** Node positions for the visual builder */
  nodePositions?: Record<string, { x: number; y: number }>;
  /** Associated threshold configurations */
  thresholds?: ThresholdsConfig;
  /** Creation timestamp */
  createdAt?: string;
  /** Last modified timestamp */
  modifiedAt?: string;
}

/**
 * Export format for scenarios (matches threshold export format)
 */
export interface ScenarioExport {
  /** Export format version */
  version: string;
  /** Exported scenarios */
  scenarios: SkuScenario[];
  /** Export timestamp */
  exportedAt: string;
}

/**
 * View mode for the application
 */
export type ViewMode = "messages" | "visual";

/**
 * Visual builder configuration state
 */
export interface VisualBuilderState {
  /** Current view mode */
  viewMode: ViewMode;
  /** Currently selected scenario */
  currentScenarioId: string;
  /** Available scenarios */
  scenarios: SkuScenario[];
  /** Edge type visibility filters */
  edgeFilters: {
    showUpgrades: boolean;
    showBudget: boolean;
    showOrgJoin: boolean;
  };
  /** Whether to highlight desired paths */
  highlightDesiredPaths: boolean;
  /** Target SKU for path highlighting (null = no target) */
  targetSkuId: SkuId | null;
  /** Viewport position and zoom for Plan Builder canvas */
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}
