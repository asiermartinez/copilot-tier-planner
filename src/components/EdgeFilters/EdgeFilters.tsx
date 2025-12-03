"use client";

import { useEffect } from "react";
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

  // Listen for auto-enable event from threshold triggers
  useEffect(() => {
    const handleAutoEnable = () => {
      if (!highlightDesiredPaths) {
        toggleHighlightDesiredPaths();
      }
    };

    window.addEventListener("auto-enable-recommended-paths", handleAutoEnable);
    return () => {
      window.removeEventListener(
        "auto-enable-recommended-paths",
        handleAutoEnable
      );
    };
  }, [highlightDesiredPaths, toggleHighlightDesiredPaths]);

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
          <FormControl.Label>Suggested upgrade paths</FormControl.Label>
        </FormControl>
      </Stack>
    </div>
  );
}
