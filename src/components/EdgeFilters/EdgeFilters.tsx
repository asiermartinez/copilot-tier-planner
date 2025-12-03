"use client";

import { Stack, Checkbox, Text, FormControl } from "@primer/react";
import { useScenario } from "@/contexts";
import styles from "./EdgeFilters.module.css";

/**
 * Edge filter controls for the visual builder
 */
export default function EdgeFilters() {
  const { visualState, updateEdgeFilters, toggleHighlightDesiredPaths } =
    useScenario();

  const { edgeFilters, highlightDesiredPaths } = visualState;

  return (
    <div className={styles.container}>
      <Text className={styles.title} weight="semibold">
        Show paths
      </Text>
      <Stack direction="vertical" gap="condensed">
        <FormControl>
          <Checkbox
            checked={edgeFilters.showUpgrades}
            onChange={e =>
              updateEdgeFilters({ showUpgrades: e.target.checked })
            }
          />
          <FormControl.Label>Upgrade</FormControl.Label>
        </FormControl>
        <FormControl>
          <Checkbox
            checked={edgeFilters.showBudget}
            onChange={e => updateEdgeFilters({ showBudget: e.target.checked })}
          />
          <FormControl.Label>Overages</FormControl.Label>
        </FormControl>
        <FormControl>
          <Checkbox
            checked={edgeFilters.showOrgJoin}
            onChange={e => updateEdgeFilters({ showOrgJoin: e.target.checked })}
          />
          <FormControl.Label>Org and enterprise upgrade</FormControl.Label>
        </FormControl>
      </Stack>

      <div className={styles.divider} />

      <Stack direction="vertical" gap="condensed">
        <FormControl>
          <Checkbox
            checked={highlightDesiredPaths}
            onChange={toggleHighlightDesiredPaths}
          />
          <FormControl.Label>Recommended paths</FormControl.Label>
        </FormControl>
      </Stack>
    </div>
  );
}
