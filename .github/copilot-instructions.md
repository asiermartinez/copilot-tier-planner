# Copilot Instructions for SKU Planner

## Development Workflow

This project follows a structured development plan outlined in `PLAN.md` at the root of the repository. Don't create summary documents, update the README or create additional documentation unless explicitly requested. Don't use emojis in code comments or documentation.

**How to work with the plan**:
1. Review `PLAN.md` to understand the current phase and tasks
2. Work on one task at a time, following the phase order
3. Update task status in `PLAN.md` as you progress:
   - `[ ]` = TODO (not started)
   - `[-]` = IN PROGRESS (currently working on)
   - `[x]` = DONE (completed)
4. When asking Copilot for help, reference the specific task number (e.g., "Help me with Task 1.1")
5. Complete all tasks in a phase before moving to the next phase
6. Update the plan as needed when requirements change or new tasks are discovered

**When generating code**:
- Always check `PLAN.md` to understand the context and current phase
- Ensure your work aligns with the task requirements and acceptance criteria
- Mark tasks as in-progress `[-]` when you start, and done `[x]` when complete

## Technology Stack

- **Framework**: Next.js 15+ with App Router
- **UI Library**: Primer React (v38+)
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules (preferred), Primer React components
- **Deployment**: GitHub Pages (static export, no SSR)

## Code Standards & Conventions

### Naming Conventions
- **Components**: PascalCase (e.g., `SkuRoadmap`, `PlanSelector`)
- **Utilities/Functions**: camelCase (e.g., `calculateUpgradePath`, `formatSkuName`)
- **Files**: Match the export name (e.g., `SkuRoadmap.tsx`, `skuHelpers.ts`)
- **CSS Modules**: camelCase for class names (e.g., `skuCard`, `roadmapContainer`)

### File Organization
- Organize components in directories for easier imports
- Each component directory should contain:
  - `ComponentName.tsx` - Main component file
  - `ComponentName.module.css` - CSS module (if needed)
  - `index.ts` - Re-export for clean imports
- Example structure:
  ```
  src/
    components/
      SkuRoadmap/
        SkuRoadmap.tsx
        SkuRoadmap.module.css
        index.ts
  ```

### Component Structure
- All components MUST use `"use client"` directive (deployed to GitHub Pages, no SSR)
- Prefer functional components with hooks
- Use TypeScript interfaces for props and state
- Keep components focused and single-responsibility

### State Management
- **Local state**: Use `useState` and `useReducer` for component-specific state
- **Shared state**: Use React Context API when state needs to be shared across multiple components
- Choose based on context:
  - Local state for UI interactions, form inputs, toggles
  - Context for SKU selection, user preferences, simulation settings

### Styling Guidelines

#### Primer React Components
- **Use Primer components exclusively** where possible for consistency with GitHub's design system
- Reference the latest Primer React documentation for component usage

#### Deprecated Components - DO NOT USE
- ❌ `Box` - Use native HTML elements with CSS modules instead
- ❌ `Flex` - Use `Stack` component or native CSS flexbox
- ❌ `Grid` - Use native CSS grid

#### CSS Modules
- **Prefer CSS modules** for custom styling over inline styles or other approaches
- Use semantic class names that describe purpose, not appearance
- Import styles: `import styles from './Component.module.css'`
- Apply classes: `className={styles.myClass}` or use `clsx` for conditional classes

#### Styling Priority
1. Primer React components (first choice)
2. CSS Modules for custom styles
3. Primer design tokens for colors, spacing, typography (via CSS variables)

### TypeScript Guidelines
- Enable strict mode (already configured)
- Define explicit types for all props, state, and function parameters
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` if type is truly unknown
- Use path aliases: `@/` maps to `./src/`

### Accessibility Requirements
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
  - Use semantic HTML elements (`<button>`, `<a>`, etc.)
  - Implement proper focus management
  - Support keyboard shortcuts where appropriate (Escape to close, Arrow keys for navigation, etc.)
- **ARIA attributes**: Add when semantic HTML isn't sufficient
- **Focus indicators**: Ensure visible focus states (Primer handles this by default)
- **Screen reader support**: Use appropriate labels and descriptions
- **Rely on Primer defaults**: Primer components include accessibility features by default

### Data & API
- **No external API calls**: All SKU data and logic is self-contained within the application
- SKU data should be defined in code (TypeScript constants, JSON imports, etc.)
- No data fetching libraries needed

### Testing
- **Skip test generation** for now unless explicitly requested
- Focus on building functional features

### Next.js Specific
- Use App Router conventions (not Pages Router)
- All routes are client-side rendered (GitHub Pages deployment)
- Use `next/link` for internal navigation
- Organize routes using directory structure in `src/app/`

## SKU Domain Knowledge

### SKU Structure
- Copilot SKUs follow a **linear progression**: FREE → [Mid-tier plans] → Enterprise
- Higher plans = more expensive + more quota/features
- Users should be able to visualize and reason about upgrade/downgrade paths

### Core Concepts
- **SKU limits**: Each plan has quotas/constraints that differ by tier
- **Upgrade paths**: Linear progression allows moving up the tier
- **Downgrade paths**: Can move down the tier as well
- **Edge cases**: Help users identify scenarios, missing opportunities, and planning considerations

## Common Patterns

### Creating a New Component
```typescript
"use client";
import { Button } from "@primer/react";
import styles from "./MyComponent.module.css";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <Button onClick={onAction}>Click me</Button>
    </div>
  );
}
```

### Using CSS Modules
```css
/* MyComponent.module.css */
.container {
  padding: var(--base-size-16);
  display: flex;
  flex-direction: column;
  gap: var(--base-size-8);
}

.title {
  color: var(--fgColor-default);
  font-size: var(--text-title-size-medium);
}
```

### Context Pattern
```typescript
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface SkuContextType {
  currentSku: string;
  setCurrentSku: (sku: string) => void;
}

const SkuContext = createContext<SkuContextType | undefined>(undefined);

export function SkuProvider({ children }: { children: ReactNode }) {
  const [currentSku, setCurrentSku] = useState<string>("free");

  return (
    <SkuContext.Provider value={{ currentSku, setCurrentSku }}>
      {children}
    </SkuContext.Provider>
  );
}

export function useSku() {
  const context = useContext(SkuContext);
  if (!context) throw new Error("useSku must be used within SkuProvider");
  return context;
}
```

## Code Generation Guidelines

When generating code:
1. Always include `"use client"` directive at the top of component files
2. Use TypeScript with proper type definitions
3. Import Primer components from `@primer/react` or `@primer/react/experimental`
4. Use CSS modules for custom styling
5. Ensure keyboard accessibility for all interactive elements
6. Use semantic HTML elements
7. Add helpful comments for complex logic
8. Follow the established project structure
9. Use the `@/` path alias for imports from `src/`

## What NOT to Do

- ❌ Don't use deprecated Primer components (Box, Flex, Grid)
- ❌ Don't use `any` type in TypeScript
- ❌ Don't create server components (no "use server" or async components)
- ❌ Don't add API routes or server-side code
- ❌ Don't generate tests unless explicitly asked
- ❌ Don't use inline styles when CSS modules are more appropriate
- ❌ Don't forget keyboard navigation support
- ❌ Don't assume user needs - ask clarifying questions when requirements are unclear

## Development Process

1. **Check the Plan**: Always refer to `PLAN.md` before starting work
2. **One Task at a Time**: Focus on completing one task fully before moving to the next
3. **Update Status**: Keep task statuses current in `PLAN.md`
4. **Follow Phases**: Complete phases in order unless there's a good reason to deviate
5. **Document Changes**: If you discover new tasks or requirements, add them to `PLAN.md`

## Getting Help

- Check Primer React documentation: https://primer.style/react
- Review Next.js App Router docs: https://nextjs.org/docs/app
- Refer to existing code patterns in the project
- Review `PLAN.md` for project roadmap and current tasks
- Ask clarifying questions when requirements or implementation details are unclear
