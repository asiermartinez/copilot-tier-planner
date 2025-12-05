/**
 * Default SKU Scenario
 *
 * Defines the standard Copilot SKU hierarchy with
 * default upgrade paths, budget options, and organization transitions.
 */

import { EdgeType, type SkuScenario, type SkuEdge } from "@/types/scenario";

/**
 * Default edges for the SKU hierarchy
 */
const DEFAULT_EDGES: SkuEdge[] = [
  // Individual tier upgrades - main progression path
  {
    id: "free-to-pro",
    source: "free",
    target: "pro",
    type: EdgeType.UPGRADE,
    label: "Upgrade",
    cost: {
      type: "upgrade",
      estimatedMonthlyUsd: 10,
      estimatedAnnualUsd: 100,
      description: "Upgrade to Pro for unlimited completions",
    },
  },
  {
    id: "free-to-pro-trial",
    source: "free",
    target: "pro-trial",
    type: EdgeType.UPGRADE,
    label: "Upgrade",
    cost: {
      type: "upgrade",
      estimatedMonthlyUsd: 0,
      description: "30-day free trial of Pro features",
    },
  },
  {
    id: "pro-trial-to-pro",
    source: "pro-trial",
    target: "pro",
    type: EdgeType.UPGRADE,
    label: "Upgrade",
    cost: {
      type: "upgrade",
      estimatedMonthlyUsd: 10,
      estimatedAnnualUsd: 100,
      description: "Convert trial to paid Pro subscription",
    },
  },
  {
    id: "pro-to-pro-plus",
    source: "pro",
    target: "pro-plus",
    type: EdgeType.UPGRADE,
    label: "Upgrade",
    cost: {
      type: "upgrade",
      estimatedMonthlyUsd: 39,
      estimatedAnnualUsd: 390,
      description: "Upgrade to Pro+ for advanced models and higher limits",
    },
  },
  {
    id: "pro-trial-to-pro-plus",
    source: "pro-trial",
    target: "pro-plus",
    type: EdgeType.UPGRADE,
    label: "Upgrade",
    cost: {
      type: "upgrade",
      estimatedMonthlyUsd: 39,
      estimatedAnnualUsd: 390,
      description: "Upgrade from trial to Pro+",
    },
  },

  // Budget additions (self-loops)
  {
    id: "pro-budget",
    source: "pro",
    target: "pro",
    type: EdgeType.BUDGET,
    label: "Set overages",
    cost: {
      type: "budget-increase",
      description: "Purchase additional premium requests",
    },
  },
  {
    id: "pro-plus-budget",
    source: "pro-plus",
    target: "pro-plus",
    type: EdgeType.BUDGET,
    label: "Set overages",
    cost: {
      type: "budget-increase",
      description: "Purchase additional premium requests",
    },
  },
  {
    id: "business-budget",
    source: "business",
    target: "business",
    type: EdgeType.BUDGET,
    label: "Set overages",
    cost: {
      type: "budget-increase",
      description: "Purchase additional premium requests at $0.04/request",
    },
  },
  {
    id: "enterprise-budget",
    source: "enterprise",
    target: "enterprise",
    type: EdgeType.BUDGET,
    label: "Set overages",
    cost: {
      type: "budget-increase",
      description: "Purchase additional premium requests at $0.04/request",
    },
  },

  // Organization transitions - multiple paths for flexibility
  {
    id: "free-to-business",
    source: "free",
    target: "business",
    type: EdgeType.ORG_JOIN,
    label: "Join Org",
    requirements: [
      "Must be part of an organization",
      "Organization must be on GitHub Free or Team plan, or Enterprise Cloud",
    ],
    cost: {
      type: "membership",
      estimatedMonthlyUsd: 19,
      description:
        "Per-seat pricing when joining organization with Business plan",
    },
  },
  {
    id: "pro-to-business",
    source: "pro",
    target: "business",
    type: EdgeType.ORG_JOIN,
    label: "Join Org",
    requirements: [
      "Must be part of an organization",
      "Organization must be on GitHub Free or Team plan, or Enterprise Cloud",
    ],
    cost: {
      type: "membership",
      estimatedMonthlyUsd: 19,
      description:
        "Per-seat pricing when joining organization with Business plan",
    },
  },
  {
    id: "pro-plus-to-business",
    source: "pro-plus",
    target: "business",
    type: EdgeType.ORG_JOIN,
    label: "Join Org",
    requirements: [
      "Must be part of an organization",
      "Organization must be on GitHub Free or Team plan, or Enterprise Cloud",
    ],
    cost: {
      type: "membership",
      estimatedMonthlyUsd: 19,
      description:
        "Per-seat pricing when joining organization with Business plan",
    },
  },
  {
    id: "pro-plus-to-enterprise",
    source: "pro-plus",
    target: "enterprise",
    type: EdgeType.ORG_JOIN,
    label: "Join Enterprise",
    requirements: [
      "Must be part of an enterprise",
      "Enterprise must be on GitHub Enterprise Cloud",
    ],
    cost: {
      type: "membership",
      estimatedMonthlyUsd: 39,
      description: "Per-seat pricing when joining enterprise",
    },
  },
  {
    id: "business-to-enterprise",
    source: "business",
    target: "enterprise",
    type: EdgeType.UPGRADE,
    label: "Upgrade",
    requirements: ["Organization must be on GitHub Enterprise Cloud"],
    cost: {
      type: "upgrade",
      estimatedMonthlyUsd: 39,
      description: "Per-seat upgrade to Enterprise tier",
    },
  },
];

/**
 * Default SKU scenario with standard Copilot hierarchy
 */
export const DEFAULT_SCENARIO: SkuScenario = {
  id: "default",
  name: "Standard Copilot Hierarchy",
  description:
    "Default SKU structure with standard upgrade paths, budget options, and organization transitions",
  edges: DEFAULT_EDGES,
  createdAt: new Date().toISOString(),
};
