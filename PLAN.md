# SKU Planner Development Plan

This document outlines the development plan for the SKU Planner project. Move through each phase step by step, completing tasks in order. If something isn’t clear, feel free to ask for clarification, just ask one question at a time.

**Status Indicators**:
- `[ ]` = TODO (not started)
- `[-]` = IN PROGRESS (currently working on)
- `[x]` = DONE (completed)

## Project Overview

The SKU Planner is an internal GitHub playground tool that helps teams quickly make sense of GitHub Copilot SKUs. It shows how users move through different license tiers, what limits apply, and how upgrades or downgrades happen. With an interactive visual roadmap and built-in scenario analysis, the SKU Planner makes it easier to explore how SKU decisions play out in practice.

**Primary Users**:
- Product teams testing SKU logic and validating entitlement rules
- Design teams exploring user journeys and UI messaging for tier transitions

**Core Use Cases**:
1. **Testing SKU logic**: Validate how users transition between tiers when quota is consumed
2. **Reasoning about user state**: Understand user position in the SKU hierarchy and available actions
3. **UI messaging validation**: Test and refine the wording used to guide users toward their best next action (upgrade vs. overage budget setup)

**Success Criteria**:
- Product/design teams can quickly simulate quota consumption scenarios
- Clear visualization of user state at each tier
- UI messaging samples that help users choose between upgrading or managing overages
- Visual representation of all UI elements (banners, alerts, CTAs) in the playground
- Real-time preview of how messages appear to end users in different states

**SKU Data Model**:

Based on the current implementation and [GitHub Copilot plans](https://docs.github.com/en/copilot/get-started/plans), the tool tracks:

- **Tiers**: FREE (0) → PRO (1) → PRO_PLUS (2) → BUSINESS (3) → ENTERPRISE (4)
- **Audiences**: Individual, Organization, Enterprise (upgrade paths respect audience boundaries)
- **Quota Limits**:
  - Premium requests per month (50-1500 depending on tier)
  - Chat messages per month (50 for Free, unlimited for paid tiers)
  - Code completions per month (2000 for Free, unlimited for paid tiers)
- **Overage Policies**:
  - `BLOCK`: Hard limit, no overages allowed (Free tier)
  - `BILL`: Pay-as-you-go at $0.04/request (paid tiers)
  - `ALLOW`: Unlimited (not currently used)
  - Budget caps: Users can set spending limits on overages
  - Warning thresholds: Default 80% quota consumption
- **Pricing**:
  - Monthly/annual rates (individual plans)
  - Per-seat pricing (organization/enterprise plans)
  - Additional premium request costs ($0.04/request)
- **Features**: 30+ feature flags covering agents, chat, models, customization, and enterprise capabilities
- **User State Tracking**:
  - Real-time usage tracking per resource type
  - Overage calculations and cost projections
  - Budget allocation and consumption
  - Decision point recommendations (upgrade vs. manage overages)
  - Alert thresholds and notifications

**UI Messaging Scenarios**:

The playground must visually represent all key UI messaging elements that appear to users:

1. **Quota Warning Messages**: 
   - Triggered at configurable thresholds (default 80%)
   - Example: "You've used 80% of your 300 premium requests this month"
   - Display as informational banners or alerts in the playground

2. **Quota Exhausted Messages**:
   - Triggered when quota is fully consumed
   - Example: "You've reached your limit of 2000 completions. Upgrade or wait until reset"
   - Display as warning/error banners with action buttons

3. **Upgrade CTAs**:
   - Contextual calls-to-action for tier upgrades
   - Example: "Upgrade to Pro for unlimited completions and 300 premium requests"
   - Display as prominent action cards or banners

4. **Overage Budget Setup Prompts**:
   - Prompts to configure overage budgets (for paid tiers)
   - Example: "Set a budget to keep using premium features beyond your quota"
   - Display as action prompts with budget input options

5. **Upgrade vs. Overage Cost Comparison**:
   - Cost analysis showing upgrade vs. overage expenses
   - Example: "Upgrading to Pro+ saves you $15/month compared to current overages"
   - Display as comparison cards or decision helpers

6. **Block/Restriction Notices**:
   - Messages when usage is blocked due to quota/budget limits
   - Example: "Premium requests paused. Upgrade your plan or increase your budget to continue"
   - Display as blocking alerts with clear action paths

**UI Representation Requirements**:
- All messages must be rendered as actual UI components in the playground
- Messages should update dynamically based on simulated user state
- Product/design teams should see exactly how messages appear to users
- Support for testing different message variations by editing state/config
- Visual hierarchy should match production UI priorities

**Key Features**:

- Interactive visual Copilot Tier map: See user consumption, entitlements, and upgrade nudges across every tier—from Free all the way to Enterprise.
- Flexible modeling: Set up and simulate different user states, license tiers, limits, and transitions to understand how changes affect the overall experience.
- Simulation sandbox: Interactive simulation environment for license planning. A sandbox where teams can experiment with different license strategies, forecast outcomes, and reason about upgrade/downgrade flows before implementing them.
- UI messaging playground: Test different wordings and calls-to-action for quota exhaustion scenarios
- Extensible by design: Based on today's Copilot plans https://docs.github.com/en/copilot/get-started/plans, but built to easily accommodate future SKUs, features, and entitlement rules right from the UI.

---

## Current State Assessment

**Existing Work**:
- Project setup with Next.js 15, Primer React v38, TypeScript (strict mode)
- Basic layout with Primer ThemeProvider and BaseStyles
- Complete type definitions for SKUs, user states, and usage tracking
- All five SKU tier data definitions (Free, Pro, Pro+, Business, Enterprise)
- Utility functions for SKU queries, state calculations, and usage tracking
- Mock user state generator and sample data
- Component directories created (SkuCard, SkuRoadmap) but empty

**What's Missing**:
- No UI components built yet (page.tsx is a placeholder)
- No state management implementation
- No simulation engine
- No UI messaging components

**Development Approach**:
- Start fresh with implementation but leverage existing data layer and types
- Review and validate existing utilities before using them
- Build UI components from scratch following Primer React guidelines
- Reference existing code as needed but don't assume it's complete

---

## Development Phases

### Phase 1: Core Data Layer & Foundation
**Goal**: Establish the data structures, type definitions, and helper utilities needed to model SKUs, user states, and transitions.

**Tasks**:
- [x] 1.1 Review and validate existing SKU type definitions (`src/types/sku.ts`)
  - Verify all SKU tiers are represented (FREE through ENTERPRISE)
  - Check OverageBehavior enum covers all needed cases
  - Validate feature flags match current GitHub docs
- [x] 1.2 Review and validate user state type definitions (`src/types/userState.ts`)
  - Verify UserState interface covers all tracking needs
  - Check alert types and severity levels are comprehensive
  - Validate ResourceUsage and PremiumRequestUsage structures
- [x] 1.3 Review and validate usage tracking types (`src/types/usage.ts`)
  - Check ResourceType enum is complete
  - Verify UsageDecisionPoint supports needed recommendation logic
  - Validate threshold and budget tracking structures
- [x] 1.4 Review SKU data definitions for all tiers (`src/data/skus.ts`)
  - Cross-reference with https://docs.github.com/en/copilot/get-started/plans
  - Update any pricing, limits, or features that have changed
  - Verify helper functions (getNextTier, canUpgradeTo, etc.) work correctly
- [x] 1.5 Review SKU helper utilities (`src/utils/skuHelpers.ts`)
  - Test upgrade/downgrade path calculations
  - Verify audience boundary logic
  - Add any missing comparison or query functions
- [x] 1.6 Review state helper utilities (`src/utils/stateHelpers.ts`)
  - Verify state calculation logic
  - Test state transitions and validations
  - Add any missing state manipulation functions
- [x] 1.7 Review usage calculation utilities (`src/utils/usageCalculations.ts`)
  - Verify quota and overage calculations
  - Test cost projection logic
  - Validate threshold detection
- [x] 1.8 Review mock state generator (`src/utils/mockStateGenerator.ts`)
  - Test generator can create all needed scenarios
  - Verify generated states are realistic and valid
  - Add presets for common testing scenarios
- [x] 1.9 Review mock user states dataset (`src/data/mockUserStates.ts`)
  - Ensure coverage of all key scenarios (quota warnings, exhausted, overages, etc.)
  - Add any missing edge cases
  - Validate data accuracy



**Acceptance Criteria**:
- All SKU tiers (Free, Pro, Pro+, Business, Enterprise) are properly defined with accurate data from GitHub docs
- Type definitions are comprehensive and support all required use cases
- Helper functions cover common queries (upgrade paths, feature comparisons, cost calculations)
- Mock data generator can create realistic user states for all scenarios
- All utilities have proper TypeScript types and are well-documented

**Deliverables**:
- Complete type system for SKUs, user states, and usage tracking
- SKU data for all five tiers
- Reusable utility functions for state and SKU manipulation
- Mock data for testing and development

---

### Phase 2: UI Implementation & Interactive Messaging
**Goal**: Build the complete user interface with interactive controls and dynamic messaging that responds to state changes.

**Layout Structure**:
- Header: App title, help, account type selector, base SKU selector
- Main section (side-by-side): Left panel (controls) + Right panel (visualization with toggle)
- Right panel toggles between: UI Messages view and State Payload (JSON) view

**Tasks**:

**Foundation & Layout (2.1-2.4)**:
- [x] 2.1 Create main app layout with header and side-by-side panels
- [x] 2.2 Implement header with account type selector (Individual/Organization/Enterprise)
- [x] 2.3 Implement header base SKU selector (filtered by account type)
- [x] 2.4 Set up React Context for global state management (current SKU, usage, budget)
  - Implemented PlannerContext with comprehensive state management
  - Includes URL state synchronization (Base64-encoded SimpleUserState)
  - Provides methods to update SKU, account type, seats, usage, budget, and billing period
  - Auto-updates URL on every state change for easy sharing
  - URL updates debounced (500ms) to prevent browser history API rate limiting
  - Supports preset loading (placeholder ready for integration)
  - Exposes usePlanner hook for consuming components
  - Integrated into main page - AccountTypeSelector and SkuSelector now use context
  - PlannerProvider wrapped around app in root layout
  - Fixed: Added accountType to SimpleUserState for proper URL state recovery
  - Fixed: Removed duplicate accountType state, now derived from userState.account.accountType
  - Fixed: ActionMenu components keyed by value to force re-render on change
  - Fixed: Debounced URL updates to prevent "history.replaceState() more than 100 times per 10 seconds" error

**Left Panel - Interactive Controls (2.5-2.12)**:
- [ ] 2.5 Create plan selector component (current plan with expand/collapse for upgrade/downgrade paths)
- [ ] 2.6 Implement visual upgrade/downgrade path display (respects audience boundaries)
- [ ] 2.7 Add quick SKU switch buttons in expanded plan selector
- [x] 2.8 Create usage control sliders (premium requests, chat messages, code completions)
  - Implemented UsageControls component with three sliders
  - Premium requests, chat messages, and code completions
  - Sliders dynamically configured based on SKU limits:
    - All plans: max = exact quota limit from plan
    - Unlimited quotas: reasonable defaults (1K, 10K, 100K)
    - Note: Overage scenarios will be controlled by budget toggle (task 2.10)
  - Sliders disabled for unlimited quotas (chat/completions on Pro+ plans)
  - Number inputs added next to each slider for manual value entry
  - Input validation ensures values stay within valid range (0 to max)
  - Number input text aligned right, spinner arrows hidden
  - Slider thumb has no border for cleaner appearance
  - Both slider and input stay synchronized
  - Updates state via PlannerContext hooks
  - Changes reflect immediately in State Payload view
  - Styled with CSS modules, accessible keyboard navigation
- [ ] 2.9 Display real-time usage percentages and quota limits
- [x] 2.10 Create budget configuration controls (max budget, block when exceeded)
  - Added checkbox to enable/disable overage budget in UsageControls component
  - Overage controls only visible for SKUs that support overage billing (allowBudgetCap = true)
  - FREE SKU does not show overage controls (overages not supported)
  - Pro, Pro+, Business, and Enterprise SKUs show overage controls
  - Budget input field appears when overages are enabled (default: $100)
  - Currency symbol ($) displayed before budget input using Primer TextInput
  - Budget input validation ensures minimum of $1
  - Budget input caption shows calculated additional requests (e.g., "up to 2,500 additional requests")
  - Premium requests slider max = plan quota + additional requests from budget (dynamic calculation)
  - Premium requests slider caption shows "(overages enabled)" when active
  - Disabling overages caps premium requests at plan limit if exceeded (single state update, no double-click bug)
  - Budget changes sync to PlannerContext and update URL state
  - Overage section visually separated with border and proper spacing
  - Checkbox uses proper Primer pattern with FormControl and FormControl.Label
  - Fixed isBlocked calculation in mockStateGenerator to properly reflect blocking behavior:
    - Uses isAtLimit (current >= limit) for blocking logic, not just isOverQuota (current > limit)
    - FREE SKU: isBlocked = true when quota limit reached (no overages allowed)
    - Pro/Business/Enterprise without overage budget: isBlocked = true when quota limit reached
    - Pro/Business/Enterprise with overage budget enabled: isBlocked = false until budget exhausted
    - isBlocked = true when overage budget is exhausted (currentSpentUsd >= maxBudgetUsd)
  - Created centralized messages dictionary (src/data/messages/blockReasons.ts):
    - All user-facing messages now centralized for consistency and easy updates
    - BLOCK_REASONS: "Quota exceeded. No overage allowed on this plan.", "Limit reached", "Budget cap exceeded..."
    - QUOTA_WARNINGS, BUDGET_WARNINGS, INFO_MESSAGES, CTA_MESSAGES, SUCCESS_MESSAGES, ERROR_MESSAGES
    - Helper function getBlockReason() for determining appropriate block reason based on state
    - Type-safe exports with BlockReason, QuotaWarning, BudgetWarning types
- [x] 2.11 Create billing period controls (days into period, days remaining)
  - Added billing period slider to UsageControls component
  - Slider allows adjusting "days into period" from 0 to total days in billing period
  - Number input field for manual entry (synchronized with slider)
  - Caption displays: days into period, days remaining, and total days
  - Properly pluralized labels (1 day vs N days)
  - Example: "15 days into period, 15 days remaining (30 days total)"
  - Updates via PlannerContext.updateDaysIntoPeriod()
  - Changes sync to URL state for sharing
  - Accessible keyboard navigation
  - Follows same styling patterns as usage sliders
  - Billing dates calculated dynamically based on slider position:
    - billingStart = today - daysIntoPeriod
    - billingEnd = billingStart + 1 month
    - nextRenewalDate = billingEnd
  - Slider initializes to current day of month (e.g., if today is the 13th, slider starts at 13)
  - Enable overage budget toggle properly styled with full width and space-between layout
  - Toggle sits flush to the right edge for clean alignment
  - Added centralized alert thresholds system:
    - Created alertThresholds.ts as single source of truth for threshold configuration
    - DEFAULT_ALERT_THRESHOLDS: [50, 75, 90, 100] used for both quota and budget alerts
    - Threshold severity mapping: 50% = info, 75% = warning, 90% = critical, 100% = exceeded
    - Helper functions: getLastCrossedThreshold(), getSeverityForPercentage(), hasReachedThreshold()
    - Thresholds are constants, not stored in state (no need for URL sync or metadata)
    - Both quota and budget tracking use same threshold values but track separately
    - Simplified field names for consistency (context already clear from nesting):
      - ResourceUsage: alertThresholds, lastCrossedThreshold (not "quotaAlertThresholds", "lastCrossedQuotaThreshold")
      - OverageBudget: alertThresholds, lastCrossedThreshold (not "lastCrossedBudgetThreshold")
    - Changed from array of crossed thresholds to single last crossed value for efficiency
    - lastCrossedThreshold dynamically updates based on current percentage
    - Removed redundant fields from state for cleaner payload:
      - Removed warningThreshold (single value) - replaced by alertThresholds array
      - Removed hasReachedWarning (boolean) - use lastCrossedThreshold instead
      - Removed enableAlerts from OverageBudget - alerts are always available
      - Removed lastUsedAt - not needed for current features
      - Removed additionalPurchased and purchasedExpiresAt - using budget-based overage model only
      - Removed usedFromPurchased/usedFromOverage - duplicates the overage field
      - Removed usedFromBaseQuota - can be inferred from min(current, limit)
      - Removed PremiumRequestUsage interface - no longer needed, uses ResourceUsage directly
    - Foundation ready for messaging system to display alerts based on crossed threshold values
- [ ] 2.12 Add quick preset buttons (Under Quota, At Warning, Over Quota, With Overages, Budget Exhausted)

**Right Panel - Messages & Visualization (2.13-2.22)**:
- [x] 2.13 Create tab toggle component (UI Messages / State Payload)
  - Implemented ViewToggle component using Primer's SegmentedControl
  - Switches between "UI Messages" and "State Payload" views
  - Clean segmented control interface with keyboard navigation support
- [x] 2.14 Implement State Payload view (formatted JSON display with copy button)
  - Created StatePayloadView component with formatted JSON display
  - IconButton copy control positioned in top-right corner
  - Icon changes to checkmark on successful copy for visual confirmation
  - Shows complete UserState object with proper syntax highlighting
  - Full-width scrollable container for large payloads
  - Removed redundant headings and flash messages for cleaner UI
- [x] 2.15 Create alert/banner component system with Primer (info, warning, error, critical)
  - Created AlertBanner component wrapping Primer's Banner component
  - Maps AlertSeverityLevel (INFO, WARNING, CRITICAL, EXCEEDED) to Primer Banner variants
  - Supports title, description, primary/secondary actions, and dismissal
  - Created generateAlerts utility that analyzes UserState and returns highest priority alert
  - **Shows only ONE banner at a time** - the most important/urgent message
  - **All messages sourced from blockReasons.ts dictionary** - single source of truth
  - **Added message customization feature** - users can modify messages and thresholds in playground:
    - Created MessageEditor component with Primer text areas for editing all banner messages
    - Created ControlPanel component with segmented controller to switch between "State" and "Messages" views
    - Left panel now has two modes: State (usage controls) and Messages (message editor)
    - Text areas use templates with placeholders (e.g., {percentage}, {current}, {limit}, {overage})
    - Alert thresholds editable (default: 50, 75, 90, 100)
    - All messages default to dictionary values, fully customizable for testing
    - Reset buttons to restore default messages and thresholds
    - Custom messages/thresholds passed to generateAlerts for dynamic banner rendering
    - Supports testing different messaging strategies and threshold configurations
  - Alert priority order (highest to lowest):
    1. Blocking alerts (usage blocked due to quota/budget limits)
    2. Budget critical/exceeded (90%+ or 100%)
    3. Quota critical (90%+ of quota)
    4. Budget warning (75%+)
    5. Quota warning (75%+)
    6. Trial expiring (≤7 days)
    7. Using overage budget (informational)
    8. Suggest overage budget setup (informational)
  - UIMessagesView displays single alert or empty state
  - Banner variants: info, warning, critical (EXCEEDED maps to critical)
  - Fully integrated with existing UserState structure and alert thresholds
  - Messages dictionary includes: BLOCK_REASONS, QUOTA_WARNINGS, BUDGET_WARNINGS, INFO_MESSAGES, CTA_MESSAGES
  - Components created: AlertBanner, MessageEditor, ControlPanel
  - generateAlerts uses template replacement for dynamic message generation
- [ ] 2.16 Implement quota warning message component (triggered at 80% threshold)
- [ ] 2.17 Implement quota exhausted message component (triggered at 100%)
- [ ] 2.18 Implement block/restriction notice component (when usage is blocked)
- [ ] 2.19 Implement upgrade CTA component with cost comparison
- [ ] 2.20 Implement overage budget setup prompt component
- [ ] 2.21 Create cost comparison card (upgrade vs staying on current plan with overages)
- [ ] 2.22 Implement plan comparison UI (side-by-side SKU comparison)

**Integration & Logic (2.23-2.26)**:
- [ ] 2.23 Wire up usage controls to recalculate state in real-time
- [ ] 2.24 Implement message triggering logic based on current state (quota %, budget %, blocking)
- [ ] 2.25 Implement decision point evaluation (upgrade vs budget recommendations)
- [ ] 2.26 Add keyboard navigation support for all interactive elements

**Acceptance Criteria**:
- Users can select account type and SKU, filtered by audience boundaries
- Users can manually adjust usage via sliders and see instant state updates
- Messages appear/disappear dynamically based on quota and budget thresholds
- Upgrade recommendations show cost savings calculations
- State payload view shows complete UserState JSON
- Plan selector shows current plan with expandable upgrade/downgrade options
- All components use Primer React and follow accessibility guidelines
- Full keyboard navigation support

**Deliverables**:
- Complete interactive playground with controls and messaging
- Dynamic message system triggered by state changes
- State payload viewer for developers
- Responsive layout working on desktop screens

---

### Phase 3: Enhanced Features & Sharing
**Goal**: Add convenience features for testing workflows and sharing scenarios.

**URL State Encoding Strategy**:
- Use Base64-encoded `SimpleUserState` in URL query param (`?state=...`)
- Auto-update URL on every state change (control adjustments)
- Derive full `UserState` from `SimpleUserState` on load using existing utilities
- Display full `UserState` JSON in State Payload view, but encode only inputs

**Tasks**:
- [ ] 3.1 Implement URL encoding/decoding utilities for SimpleUserState (Base64)
- [ ] 3.2 Auto-update URL query param whenever state changes
- [ ] 3.3 Implement state restoration from URL on page load
- [ ] 3.4 Add "Copy Shareable Link" button to copy current URL
- [ ] 3.5 Add "Reset to Default" button to clear all adjustments
- [ ] 3.6 Implement JSON export button (download full UserState as file)
- [ ] 3.7 Implement JSON import (upload state file to restore)
- [ ] 3.8 Add preset scenario descriptions/tooltips
- [ ] 3.9 Implement additional purchased requests control
- [ ] 3.10 Add subscription status selector (active, trial, suspended)
- [ ] 3.11 Create pro-rated billing toggle for mid-cycle upgrades

**Acceptance Criteria**:
- Users can share scenarios via URL links
- State persists in URL and can be bookmarked
- Users can export/import states as JSON files
- Quick presets load predefined scenarios instantly
- Additional controls allow fine-tuning edge cases

**Deliverables**:
- URL-based state sharing
- Import/export functionality
- Enhanced control options for edge cases

---

### Phase 4: Polish & Documentation
**Goal**: Refine the user experience and document the tool for internal teams.

**Tasks**:
- [ ] 4.1 Add loading states and transitions
- [ ] 4.2 Implement error handling and error boundaries
- [ ] 4.3 Add tooltips for controls and messages
- [ ] 4.4 Create help/documentation modal or page
- [ ] 4.5 Add keyboard shortcuts (e.g., "?" for help, "R" for reset)
- [ ] 4.6 Implement responsive layout adjustments for smaller screens
- [ ] 4.7 Add visual feedback for state changes (subtle animations)
- [ ] 4.8 Create screenshot/copy button for sharing visual examples
- [ ] 4.9 Performance optimization and code splitting
- [ ] 4.10 Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] 4.11 Update README with setup and usage instructions
- [ ] 4.12 Create internal user guide with common workflows

**Acceptance Criteria**:
- Tool feels polished and professional
- Clear help documentation for internal users
- Good performance even with complex states
- Works correctly in all major browsers
- README clearly explains setup and usage

**Deliverables**:
- Production-ready application
- Comprehensive documentation
- Optimized build for GitHub Pages deployment

---

### Phase 5: Future Enhancements (Optional)
**Goal**: Advanced features that could be added based on team feedback.

**Potential Tasks** (not prioritized):
- [ ] 5.1 Create custom SKU editor for hypothetical pricing scenarios
- [ ] 5.2 Add message variant editor for testing different wordings
- [ ] 5.3 Implement message priority and stacking logic
- [ ] 5.4 Add comparison mode (view multiple states side-by-side)
- [ ] 5.5 Create saved scenarios library
- [ ] 5.6 Add analytics/usage tracking for internal metrics
- [ ] 5.7 Implement dark mode support
- [ ] 5.8 Add export to presentation format (slides/PDF)

**Note**: These features should only be implemented if there's demonstrated need from product/design teams.

---

## Notes

- Each phase builds on the previous one - complete phases in order
- Update task status as work progresses: `[ ]` → `[-]` → `[x]`
- If new requirements emerge, add tasks to the appropriate phase
- GitHub Pages deployment is already configured - just commit and push to deploy
- Testing approach: Manual testing by running the app and clicking through features (prototype methodology)
- No formal feedback collection process - this is an internal exploration tool
