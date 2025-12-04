# Dynamic Edge Management and CTA Integration

## Overview

The Visual Builder now supports dynamic edge creation and deletion, allowing you to customize upgrade paths and have Call-to-Action (CTA) buttons automatically reflect your desired upgrade strategy.

## Key Features

### 1. **Dynamic Edge Creation**

You can now create new connections between SKUs by:
- Dragging from the connection handle on one node to another node
- The system automatically determines the edge type and label based on the relationship

**Edge Type Auto-Detection:**
- **Budget Edge** (self-loop): Connect a node to itself → "Set overages" label
- **Organization Join**: Connect to Business SKU → "Join Org" label
- **Enterprise Join**: Connect to Enterprise SKU → "Join Enterprise" label
- **Upgrade**: Connect between individual plans → "Upgrade" label

### 2. **Edge Deletion**

Remove edges by:
- Selecting an edge (click on it)
- Pressing the **Delete** key

### 3. **Desired Path Marking**

Mark a single edge as the "desired" or recommended path from each SKU:
1. Enable "Suggested upgrade paths" checkbox in the filters panel
2. Click on an edge to select it
3. Click the star icon that appears below the edge
4. Only one desired path per source node is allowed

### 4. **Dynamic CTA Integration**

Call-to-Action buttons in thresholds now automatically reflect your desired upgrade path:

**New Template Variables:**
- `{actionType}` - The action phrase based on edge type:
  - Budget edges: "Set an overage budget"
  - Upgrade edges: "Upgrade to"
  - Org/Enterprise joins: "Join"
  
- `{targetPlan}` - The target plan name:
  - Budget edges: "" (empty)
  - Other edges: Target SKU name (e.g., "Pro", "Business")

**Example CTA Usage:**
```
"{actionType} {targetPlan}"
```

This resolves to:
- "Set an overage budget" (if desired path is a budget edge)
- "Upgrade to Pro" (if desired path is upgrade to Pro)
- "Join Business" (if desired path is join org to Business)

## Workflow Example

### Scenario: Customize Free Plan Upgrade Path

1. **Default State**: Free plan has a desired path to Pro plan
2. **User Action**: Mark "Free → Free" (budget edge) as desired instead
3. **Result**: When Free plan hits 100% quota:
   - CTA button now says "Set an overage budget" instead of "Upgrade to Pro"
   - User is guided to their preferred action

### Scenario: Create Custom Upgrade Path

1. **Add Custom SKU**: Click "Add new SKU" to create a new plan tier
2. **Connect It**: Drag from Pro node to your custom SKU node
3. **Mark as Desired**: Click edge, then star icon to mark as desired
4. **Configure Threshold**: Edit threshold CTA to use `{actionType} {targetPlan}`
5. **Test**: Set Pro plan usage to 100% → CTA reflects your custom path

## Edge Type Reference

| Source | Target | Type | Label | actionType | targetPlan |
|--------|--------|------|-------|------------|------------|
| Free | Free | BUDGET | "Set overages" | "Set an overage budget" | "" |
| Free | Pro | UPGRADE | "Upgrade" | "Upgrade to" | "Pro" |
| Pro | Business | ORG_JOIN | "Join Org" | "Join" | "Business" |
| Pro Plus | Enterprise | ORG_JOIN | "Join Enterprise" | "Join" | "Enterprise" |

## Template Variables

All existing template variables still work:

**Quota:** `{current}`, `{limit}`, `{percentage}`, `{remaining}`, `{overage}`

**Budget:** `{budget}`, `{budgetUsed}`, `{budgetRemaining}`, `{budgetPercentage}`, `{overageRemaining}`

**Plan:** `{planName}`, `{nextPlan}`, `{actionType}`, `{targetPlan}`

**Time:** `{daysRemaining}`, `{daysInPeriod}`, `{resetDate}`

## Best Practices

1. **One Desired Path**: Only mark one edge as desired from each SKU to avoid confusion
2. **Test Your CTAs**: Use the playground to verify CTA wording makes sense
3. **Use Composable Variables**: `{actionType} {targetPlan}` works for all edge types
4. **Budget Edges**: Remember budget edges have empty `{targetPlan}`, so `{actionType}` alone may be better

## Removed Features

- **CONTEXT_SWITCH** edge type has been removed (simplified to UPGRADE, BUDGET, ORG_JOIN)
- The "Context switch" filter checkbox has been removed from the UI

## Technical Details

### Edge ID Generation
- Budget edges: `{skuId}-budget`
- Other edges: `{sourceId}-to-{targetId}`

### Audience-Based Detection
The system uses the `audience` property of SKUs to determine edge types:
- `audience: "individual"` → Upgrade edge
- `audience: "organization"` → Org join edge
- `audience: "enterprise"` → Enterprise join edge

### Duplicate Prevention
The system prevents creating duplicate edges between the same source and target nodes.