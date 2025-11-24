# SKU Planner Development Plan

This document outlines the development plan for the SKU Planner project. Move through each phase step by step, completing tasks in order. If something isn’t clear, feel free to ask for clarification, just ask one question at a time.

**Status Indicators**:
- `[ ]` = TODO (not started)
- `[-]` = IN PROGRESS (currently working on)
- `[x]` = DONE (completed)

---

## Phase 1: Core SKU Data & Types

Define the foundational data structures for GitHub Copilot SKUs.

- [x] **Task 1.1**: Define SKU type interfaces
  - Check https://docs.github.com/en/copilot/get-started/plans as reference for Copilot SKU tiers
  - Create TypeScript interfaces for SKU tiers (FREE, mid-tiers, Enterprise)
  - Include fields: id, name, tier level, display name, description
  - Location: `src/types/sku.ts`

- [x] **Task 1.2**: Define SKU limits and quotas
  - Check https://docs.github.com/en/copilot/get-started/plans as reference for all plans
  - Add quota/limit properties to SKU interface
  - Include: message limits, overage policies, feature flags
  - Consider extensibility for future limit types

- [ ] **Task 1.3**: Create initial SKU data set
  - Check https://docs.github.com/en/copilot/get-started/plans as reference for all plans
  - Define at least 3-4 SKU tiers with realistic data
  - Include FREE and Enterprise as bookends
  - Location: `src/data/skus.ts` or similar

- [ ] **Task 1.4**: Create SKU utility functions
  - Helper functions: getSku by id, compare SKUs, validate SKU transitions based on limits and other useful operations
  - Location: `src/utils/skuHelpers.ts`

---

## Phase 2: User State Model (JSON Response Structure)

Define how user's current plan state is represented and structured.

- [ ] **Task 2.1**: Define user state interface
  - Create interface representing user's current Copilot license state
  - Include: current SKU, usage data, account info, timestamp
  - Location: `src/types/userState.ts`

- [ ] **Task 2.2**: Define usage and quota tracking structure
  - Current usage, quota limits, overage amounts
  - Budget allocation for overages (track budget consumed vs remaining)
  - Detect when overage budget is fully consumed
  - Support decision flows: increase overage budget OR upgrade plan
  - Historical usage patterns (if needed)

- [ ] **Task 2.3**: Create mock user state data
  - Sample user states for different scenarios
  - Edge cases: over quota, under quota, at limit
  - Location: `src/data/mockUserStates.ts`

- [ ] **Task 2.4**: Create state utility functions
  - Calculate remaining quota, overage costs, upgrade savings
  - State validation and transformation helpers
  - Location: `src/utils/stateHelpers.ts`

---

## Phase 3: URL State Management

Enable sharing and persisting state through URL parameters.

- [ ] **Task 3.1**: Implement state serialization
  - Convert user state object to URL-safe string
  - Use compression if needed for long URLs
  - Location: `src/utils/urlState.ts`

- [ ] **Task 3.2**: Implement state deserialization
  - Parse URL parameters back to user state object
  - Handle malformed or missing parameters gracefully
  - Validate decoded state

- [ ] **Task 3.3**: Create URL state context/hook
  - React hook to read state from URL on mount
  - Update URL when state changes (without page reload)
  - Location: `src/contexts/UrlStateContext.tsx` or `src/hooks/useUrlState.ts`

- [ ] **Task 3.4**: Add share functionality
  - Copy-to-clipboard button for current state URL
  - Visual confirmation when URL is copied
  - Test URL length limits

---

## Phase 4: Visual Roadmap UI

Build the main SKU progression visualization.

- [ ] **Task 4.1**: Design roadmap layout component
  - Horizontal or vertical linear progression
  - Show all SKU tiers in order
  - Location: `src/components/SkuRoadmap/`

- [ ] **Task 4.2**: Create SKU card component
  - Display individual SKU details (name, tier, limits)
  - Visual indicator for current user's SKU
  - Accessible and keyboard navigable

- [ ] **Task 4.3**: Implement progression indicators
  - Visual connections between SKUs (arrows, lines)
  - Highlight upgrade/downgrade paths
  - Show direction and relationships

- [ ] **Task 4.4**: Add current position highlighting
  - Clearly mark user's current SKU on roadmap
  - Show available upgrade/downgrade options
  - Visual distinction between available and unavailable paths

---

## Phase 5: Interactive Quota & Overage Controls

Build controls for simulating usage, overages, and budgets.

- [ ] **Task 5.1**: Create quota usage slider/input
  - Interactive control to adjust current usage
  - Visual indicator of quota limit
  - Show percentage used

- [ ] **Task 5.2**: Create overage simulation controls
  - Input for simulating overage amounts
  - Display overage costs in real-time
  - Location: `src/components/QuotaControls/`

- [ ] **Task 5.3**: Create budget controls
  - Set budget for managing overages
  - Show when budget is exceeded
  - Calculate cost implications

- [ ] **Task 5.4**: Display quota analytics
  - Visual charts/graphs for usage over time
  - Projections based on current usage
  - Recommendations for SKU changes

---

## Phase 6: Dynamic SKU Management

Enable adding and editing SKUs on the fly.

- [ ] **Task 6.1**: Create "Add SKU" interface
  - Form to define new SKU tier
  - Input all SKU properties (name, limits, pricing, etc.)
  - Location: `src/components/SkuEditor/`

- [ ] **Task 6.2**: Implement SKU editing
  - Edit existing SKU properties
  - Validation to prevent breaking changes
  - Preserve relationships in roadmap

- [ ] **Task 6.3**: Handle dynamic SKU insertion
  - Insert new SKU at correct position in linear progression
  - Update roadmap visualization dynamically
  - Recalculate upgrade/downgrade paths

- [ ] **Task 6.4**: SKU persistence in URL state
  - Include custom SKUs in URL state encoding
  - Deserialize and restore custom SKUs
  - Handle conflicts between default and custom SKUs

---

## Phase 7: Gap Analysis & Opportunity Detection

Identify missing SKU tiers and opportunities in the progression.

- [ ] **Task 7.1**: Implement gap detection algorithm
  - Analyze current SKU lineup for gaps
  - Identify pricing gaps, feature gaps, quota gaps
  - Location: `src/utils/gapAnalysis.ts`

- [ ] **Task 7.2**: Create gap visualization
  - Highlight gaps in the roadmap UI
  - Visual indicators for missing tiers
  - Location: `src/components/GapIndicator/`

- [ ] **Task 7.3**: Generate opportunity suggestions
  - Suggest new SKU tiers to fill gaps
  - Recommend pricing and quota levels
  - Display as actionable insights

- [ ] **Task 7.4**: Create gap analysis panel
  - Dedicated UI section for gap insights
  - List all detected gaps and opportunities
  - Allow users to explore or dismiss suggestions

---

## Phase 8: Scenario Analysis Tools

Build tools for exploring different scenarios and edge cases.

- [ ] **Task 8.1**: Create scenario presets
  - Predefined scenarios (high usage, budget-constrained, etc.)
  - Quick-load different user states
  - Location: `src/data/scenarios.ts`

- [ ] **Task 8.2**: Implement "What-If" analysis
  - Compare current state vs. potential SKU change
  - Show cost differences, quota changes, feature changes
  - Side-by-side comparison view

- [ ] **Task 8.3**: Create scenario comparison table
  - Matrix view of different scenarios
  - Highlight key differences and trade-offs
  - Location: `src/components/ScenarioComparison/`

- [ ] **Task 8.4**: Add scenario notes/annotations
  - Allow users to annotate scenarios
  - Save notes with URL state
  - Help document reasoning and decisions

---

## Phase 9: State-based UI Components

Build UI components that respond to different user states.

- [ ] **Task 9.1**: Create announcement banner component
  - Display state-specific messages (quota warnings, recommendations)
  - Different severity levels (info, warning, critical)
  - Dismissible with persistence
  - Location: `src/components/AnnouncementBanner/`

- [ ] **Task 9.2**: Create upgrade/downgrade buttons
  - Context-aware CTAs based on current state
  - Show upgrade benefits or downgrade savings
  - Trigger SKU change in simulation
  - Location: `src/components/SkuActionButtons/`

- [ ] **Task 9.3**: Create license management UI panel
  - Display current license details
  - Show seat allocation, usage, renewals
  - Allow adjustments and modifications
  - Location: `src/components/LicenseManagement/`

- [ ] **Task 9.4**: Implement state-based UI logic
  - Conditional rendering based on user state
  - Show/hide components based on SKU tier
  - Dynamic messaging and recommendations

---

## Phase 10: Polish & Refinements

Final touches, performance, and user experience improvements.

- [ ] **Task 10.1**: Responsive design pass
  - Ensure all components work on different screen sizes
  - Mobile-friendly interactions
  - Test on various devices

- [ ] **Task 10.2**: Accessibility audit
  - Verify keyboard navigation throughout app
  - Test with screen readers
  - Ensure proper ARIA labels and focus management

- [ ] **Task 10.3**: Performance optimization
  - Optimize re-renders and state updates
  - Lazy load components if needed
  - Minimize bundle size

- [ ] **Task 10.4**: Documentation and examples
  - Add inline code documentation
  - Create usage examples in README
  - Document URL state format

- [ ] **Task 10.5**: Error handling and edge cases
  - Graceful handling of invalid states
  - User-friendly error messages
  - Fallback UI for missing data

- [ ] **Task 10.6**: Visual polish
  - Consistent spacing and typography
  - Smooth transitions and animations
  - Loading states and feedback

---

## Notes

- This plan is a living document - update as requirements evolve
- Feel free to break down tasks further if needed
- Add new tasks or phases as you discover them
- Mark blockers or dependencies in task descriptions
- Use task numbers when asking Copilot for help (e.g., "Help with Task 3.2")

---

**Last Updated**: [Date will be updated as plan evolves]
