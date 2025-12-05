"use client";

import { useEffect, useRef } from "react";

interface UsePageTitleOptions {
  baseTitle?: string;
  scenarioModifiedAt?: string;
  thresholdsModifiedAt?: string;
}

/**
 * Custom hook to manage page title with dirty state indicator
 *
 * Tracks changes to scenarios and thresholds and adds an asterisk (*)
 * to the page title when modifications are detected.
 */
export function usePageTitle({
  baseTitle = "Copilot SKU Planner",
  scenarioModifiedAt,
  thresholdsModifiedAt,
}: UsePageTitleOptions = {}) {
  // Track initial timestamps to detect changes
  const initialScenarioTimestamp = useRef<string | undefined>(undefined);
  const initialThresholdsTimestamp = useRef<string | undefined>(undefined);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Initialize refs only once on first mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initialScenarioTimestamp.current = scenarioModifiedAt;
      initialThresholdsTimestamp.current = thresholdsModifiedAt;
    }

    // Check if scenario has been modified
    const scenarioModified =
      scenarioModifiedAt !== initialScenarioTimestamp.current;

    // Check if thresholds have been modified
    const thresholdsModified =
      thresholdsModifiedAt !== initialThresholdsTimestamp.current;

    // Determine if we need to show dirty indicator
    const isDirty = scenarioModified || thresholdsModified;

    // Update page title
    document.title = isDirty ? `* Edited — ${baseTitle}` : baseTitle;
  }, [baseTitle, scenarioModifiedAt, thresholdsModifiedAt]);

  // Cleanup: reset title on unmount
  useEffect(() => {
    return () => {
      document.title = baseTitle;
    };
  }, [baseTitle]);
}
