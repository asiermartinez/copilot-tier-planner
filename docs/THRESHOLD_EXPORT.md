# Configuration Export/Import System

This document explains how to use the unified configuration export/import system in the SKU Planner application.

## Overview

The configuration export/import system allows you to:
- **Export** your complete configuration (scenario + thresholds) as JSON
- **Import** previously exported configurations
- **Reset** thresholds to default values
- **Share** complete setups with your team

## What's Included in Exports

Each export contains:
- **Scenario data**: Custom SKUs, edges, node positions, SKU variations
- **Threshold configurations**: All alert threshold settings
- **Metadata**: Export timestamp, version info, description

This ensures that scenario-specific thresholds and custom SKUs stay in sync, preventing broken references.

## Using the UI

### Exporting Configuration

1. Configure your scenario (custom SKUs, edges, positions)
2. Set up your thresholds using the configurator
3. Click the **Download icon** (↓) in the threshold configurator header
4. A dialog will appear with the complete JSON configuration
5. Click **"Copy to Clipboard"** to copy the JSON
6. Save it to a file for backup or sharing

### Importing Configuration

1. Click the **Download icon** (↓) to open the export/import dialog
2. Switch to the **"Import"** tab
3. Paste your previously exported JSON into the textarea
4. Click **"Import"**
5. Your scenario and thresholds will be updated immediately

**Note**: Importing will replace your current configuration. Export your current setup first if you want to keep it!

### Resetting to Defaults

1. Click the **Sync icon** (↻) in the header
2. Confirm that you want to reset
3. All thresholds will revert to the default configuration
4. Your custom scenario will remain unchanged

## Export Format

The exported JSON has the following structure:

```json
{
  "scenario": {
    "id": "default",
    "name": "Standard Copilot Hierarchy",
    "description": "Custom scenario with enhanced thresholds",
    "edges": [...],
    "customSkus": [...],
    "skuVariations": {...},
    "nodePositions": {...},
    "thresholds": {
      "thresholds": [...],
      "modifiedAt": "2025-01-27T10:00:00.000Z"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "modifiedAt": "2025-01-27T10:00:00.000Z"
  },
  "exportedAt": "2025-01-27T10:00:00.000Z",
  "version": "1.0",
  "description": "Copilot SKU Planner configuration export"
}
```

### Field Descriptions

#### Scenario Fields
- **id**: Scenario identifier
- **name**: Scenario name
- **description**: Optional scenario description
- **edges**: Array of connections between SKUs (upgrades, budget loops, org joins)
- **customSkus**: Array of custom SKU definitions
- **skuVariations**: Modified pricing/limits for built-in SKUs
- **nodePositions**: Visual positions of nodes on the canvas
- **thresholds**: Embedded threshold configuration
- **createdAt**: When the scenario was created
- **modifiedAt**: When the scenario was last modified

#### Threshold Configuration
- **thresholds**: Array of threshold configurations
  - **id**: Unique identifier for the threshold
  - **percentage**: Trigger percentage (0-100)
  - **plans**: Array of SKU IDs this threshold applies to
  - **areas**: Array of areas (`["quota"]`, `["overage"]`, or both)
  - **severity**: Banner severity (`"info"`, `"warning"`, `"critical"`, `"success"`, `"upsell"`)
  - **message**: Message template with placeholder support
  - **enabled**: Whether this threshold is active
  - **dismissable**: Whether the banner can be dismissed
  - **static**: Whether the banner shows state when triggered or updates dynamically
  - **cta** (optional): Call-to-action button configuration
  - **billingPeriod** (optional): Billing period constraints
- **modifiedAt**: When thresholds were last modified

#### Export Metadata
- **exportedAt**: ISO timestamp when exported
- **version**: Export format version
- **description**: Human-readable description

## Legacy Format Support

The system supports importing the old threshold-only format for backwards compatibility:

```json
{
  "thresholds": [...],
  "exportedAt": "2025-01-27T10:00:00.000Z",
  "version": "1.0"
}
```

When importing this format, only thresholds will be updated; the scenario will remain unchanged.

## Message Template Placeholders

Threshold messages support the following placeholders:

### Quota-Related
- `{percentage}` - Percentage value (e.g., "75")
- `{current}` - Current usage count
- `{limit}` - Usage limit
- `{remaining}` - Remaining quota
- `{overage}` - Overage requests count

### Budget-Related
- `{budget}` - Budget amount
- `{budgetUsed}` - Amount of budget used
- `{budgetRemaining}` - Remaining budget
- `{budgetPercentage}` - Budget usage percentage
- `{overageRemaining}` - Remaining overage budget

### Plan-Related
- `{planName}` - Current plan name
- `{nextPlan}` - Next higher plan name
- `{actionType}` - Upgrade/Join action type
- `{targetPlan}` - Target plan for CTA

### Time-Related
- `{daysRemaining}` - Days remaining in period
- `{daysInPeriod}` - Total days in billing period
- `{resetDate}` - Plan reset date (e.g., Mar 7, 2025)

## Use Cases

### 1. Team Collaboration
Export your configuration and share it with your team via:
- Email or Slack
- Shared drives
- Git repositories
- Internal wikis

### 2. Environment Migration
Move configurations between:
- Development → Staging → Production
- Local testing → Team demos
- Different branches or experiments

### 3. Backup and Recovery
- Export before making major changes
- Keep versioned exports in source control
- Restore previous configurations when needed

### 4. Testing Different Scenarios
- Export your baseline configuration
- Experiment with changes
- Import the baseline to restore if needed

### 5. Configuration Templates
- Create and export common setups
- Share templates for specific use cases
- Standardize team configurations

## Best Practices

1. **Export Before Major Changes**: Always export before modifying scenarios or thresholds
2. **Descriptive Names**: Update the scenario name before exporting for easy identification
3. **Version Control**: Store exports in Git with meaningful commit messages
4. **Test Imports**: Verify imported configurations work as expected
5. **Document Custom SKUs**: Add descriptions to custom SKUs for clarity
6. **Consistent IDs**: Use descriptive threshold IDs (e.g., `quota-warning-75`)

## Troubleshooting

### Import Fails with "Invalid configuration format"

**Possible causes:**
- JSON syntax error (missing comma, bracket, quote)
- Missing required fields
- Invalid data types

**Solutions:**
- Validate JSON using a JSON validator
- Check that `scenario` object exists
- Ensure all required fields are present

### Thresholds Don't Apply After Import

**Possible causes:**
- Threshold `enabled` is set to `false`
- `plans` array doesn't include your current SKU
- `areas` doesn't match what you're testing

**Solutions:**
- Check threshold configuration in the UI
- Verify `plans` includes the SKU you're testing
- Confirm `areas` includes `"quota"` or `"overage"` as needed

### Custom SKUs Missing After Import

**Possible causes:**
- Export was from legacy threshold-only format
- Custom SKUs weren't saved in the scenario

**Solutions:**
- Use the unified export format
- Verify `customSkus` array exists in the JSON
- Check that custom SKUs have unique IDs

### Node Positions Reset After Import

**Possible causes:**
- `nodePositions` missing from export
- Node IDs don't match

**Solutions:**
- Re-export with current positions
- Manually adjust positions after import
- Check that node IDs match between export and import

## Example: Complete Configuration

Here's an example of a complete configuration export with custom SKUs and thresholds:

```json
{
  "scenario": {
    "id": "custom-enterprise-setup",
    "name": "Enterprise Custom Setup",
    "description": "Custom scenario for enterprise testing with Pro+ tier",
    "edges": [
      {
        "id": "free-to-custom",
        "source": "free",
        "target": "custom-1234567890",
        "type": "upgrade",
        "label": "Upgrade"
      }
    ],
    "customSkus": [
      {
        "id": "custom-1234567890",
        "name": "Custom Pro Plus",
        "description": "Enhanced Pro+ with higher limits",
        "audience": "individual",
        "tier": 2,
        "pricing": {
          "monthlyUsd": 49,
          "perSeat": false
        },
        "limits": {
          "premiumRequestsPerMonth": 2000,
          "canPurchaseAdditionalPremiumRequests": true
        }
      }
    ],
    "nodePositions": {
      "free": { "x": 100, "y": 200 },
      "custom-1234567890": { "x": 400, "y": 200 }
    },
    "thresholds": {
      "thresholds": [
        {
          "id": "custom-early-warning",
          "percentage": 50,
          "plans": ["custom-1234567890"],
          "areas": ["quota"],
          "severity": "info",
          "message": "You've used {percentage}% of your custom quota",
          "enabled": true,
          "dismissable": true,
          "static": false
        }
      ],
      "modifiedAt": "2025-01-27T10:00:00.000Z"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "modifiedAt": "2025-01-27T10:00:00.000Z"
  },
  "exportedAt": "2025-01-27T10:00:00.000Z",
  "version": "1.0",
  "description": "Copilot SKU Planner configuration export"
}
```

## Integration with Other Systems

The exported JSON format is designed to be:
- **Portable**: Share across teams and environments
- **Version-controlled**: Easy to track changes in Git
- **Self-contained**: No broken references between SKUs and thresholds
- **Human-readable**: Developers can understand and modify it
- **API-compatible**: Can be used in external tools or automation

## Future Enhancements

Potential future improvements:
- Export/import multiple scenarios
- Merge configurations
- Diff viewer for configuration changes
- Preset templates library
- Cloud storage integration