# Threshold Export/Import System

This document explains how to use the threshold export/import system in the SKU Planner application.

## Overview

The threshold export/import system allows you to:
- **Export** your configured thresholds as JSON
- **Import** previously exported threshold configurations
- **Reset** thresholds to default values
- **Use exported configs** as new defaults in the codebase

## Using the UI

### Exporting Thresholds

1. Configure your thresholds using the sliders in the right panel
2. Click the **Download icon** (↓) in the header
3. A dialog will appear with the JSON configuration
4. Click **"Copy to Clipboard"** to copy the JSON
5. Save it to a file or paste it wherever needed

### Importing Thresholds

1. Click the **Upload icon** (↑) in the header
2. Paste your previously exported JSON into the textarea
3. Click **"Import"**
4. Your thresholds will be updated immediately

### Resetting to Defaults

1. Click the **Sync icon** (↻) in the header
2. Confirm that you want to reset
3. All thresholds will revert to the default configuration

## Export Format

The exported JSON has the following structure:

```json
{
  "thresholds": [
    {
      "id": "quota-warning-75",
      "percentage": 75,
      "appliesTo": "quota",
      "planFilter": "all",
      "severity": "warning",
      "message": "You've used {percentage}% of your quota",
      "enabled": true,
      "dismissable": true,
      "static": false
    }
  ],
  "exportedAt": "2025-01-27T10:00:00.000Z",
  "version": "1.0"
}
```

### Field Descriptions

- **thresholds**: Array of threshold configurations
  - **id**: Unique identifier for the threshold
  - **percentage**: Trigger percentage (0-100)
  - **appliesTo**: Metric type (`"quota"`, `"overage"`, or `"both"`)
  - **planFilter**: Which plans this applies to (`"all"`, `"free-only"`, `"paid-only"`)
  - **severity**: Banner severity (`"info"`, `"warning"`, `"critical"`, `"success"`, `"upsell"`)
  - **message**: Message template with placeholder support
  - **enabled**: Whether this threshold is active
  - **dismissable**: Whether the banner can be dismissed
  - **static**: Whether the banner shows state when triggered or updates dynamically
  - **cta** (optional): Call-to-action button configuration
- **exportedAt**: ISO timestamp when exported
- **version**: Export format version

## Using Exports as Defaults

To use an exported configuration as the new defaults in the codebase:

### Option 1: Direct Replacement

1. Export your desired threshold configuration
2. Open `src/types/thresholds.ts`
3. Replace the `DEFAULT_THRESHOLDS` array with your exported `thresholds` array

Example:
```typescript
export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  // Paste your exported thresholds here
  {
    "id": "quota-warning-75",
    "percentage": 75,
    // ... rest of configuration
  }
];
```

### Option 2: Using the Utility (Advanced)

For a more automated approach, you can use the `exportToTypeScriptCode` utility:

```typescript
import { exportToTypeScriptCode } from "@/utils/thresholdExport";

const exportedJson = `{ /* your exported JSON */ }`;
const tsCode = exportToTypeScriptCode(exportedJson);

// Copy the output and paste it into src/types/thresholds.ts
console.log(tsCode);
```

This generates properly formatted TypeScript code with comments.

## Message Template Placeholders

Threshold messages support the following placeholders:

- `{percentage}` - Percentage value (e.g., "75%")
- `{current}` - Current usage count
- `{limit}` - Usage limit
- `{remaining}` - Remaining quota
- `{overage}` - Overage requests count
- `{overageRemaining}` - Remaining overage budget
- `{budget}` - Budget amount
- `{budgetUsed}` - Amount of budget used
- `{budgetRemaining}` - Remaining budget
- `{budgetPercentage}` - Budget usage percentage
- `{planName}` - Current plan name
- `{nextPlan}` - Next higher plan name
- `{daysRemaining}` - Days remaining in period
- `{daysInPeriod}` - Total days in billing period

## Tips

1. **Backup Before Changes**: Always export your current configuration before making significant changes
2. **Test Imports**: After importing, verify the thresholds are working as expected
3. **Version Control**: Keep your exported configs in version control for team collaboration
4. **Naming Convention**: Use descriptive IDs for thresholds (e.g., `quota-warning-75` instead of `threshold1`)
5. **Validation**: The system validates imports, but double-check percentage values are between 0-100

## Troubleshooting

### Import Fails

- **Check JSON format**: Ensure the JSON is valid (no trailing commas, proper quotes)
- **Verify structure**: Make sure it has the `thresholds` array
- **Check required fields**: Each threshold must have `id`, `percentage`, `appliesTo`, `severity`, `message`, `enabled`, `dismissable`, and `static`

### Thresholds Not Triggering

- Check that `enabled` is set to `true`
- Verify `percentage` values match your test scenarios
- Ensure `planFilter` matches your current plan type
- Check `appliesTo` matches the metric you're testing (quota vs overage)

## Example: Creating Custom Thresholds

Here's an example of creating a custom threshold configuration from scratch:

```json
{
  "thresholds": [
    {
      "id": "custom-early-warning",
      "percentage": 50,
      "appliesTo": "quota",
      "planFilter": "all",
      "severity": "info",
      "message": "You're halfway through your quota. {remaining} requests remaining.",
      "enabled": true,
      "dismissable": true,
      "static": false
    },
    {
      "id": "custom-critical-alert",
      "percentage": 95,
      "appliesTo": "quota",
      "planFilter": "paid-only",
      "severity": "critical",
      "message": "Critical: Only {remaining} requests left!",
      "enabled": true,
      "dismissable": false,
      "static": false,
      "cta": {
        "label": "Increase budget"
      }
    }
  ],
  "exportedAt": "2025-01-27T10:00:00.000Z",
  "version": "1.0"
}
```

## Integration with Other Systems

The exported JSON format is designed to be:
- **Portable**: Can be shared across teams and environments
- **Version-controlled**: Easy to track changes in Git
- **API-compatible**: Can be used in external tools or automation
- **Human-readable**: Developers can understand and modify it easily

Consider storing your threshold configurations in:
- Configuration management systems
- Environment-specific config files
- Team documentation repositories
- CI/CD pipeline configurations