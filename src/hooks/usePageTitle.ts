"use client";

import { useEffect } from "react";
import { useDirtyState } from "./useDirtyState";
import type { SkuScenario } from "@/types/scenario";
import type { ThresholdsConfig } from "@/types/thresholds";

interface UsePageTitleOptions {
  baseTitle?: string;
  scenario?: SkuScenario;
  thresholds?: ThresholdsConfig;
}

/**
 * Custom hook to manage page title with dirty state indicator
 *
 * Tracks changes to scenarios and thresholds and adds an asterisk (*)
 * to the page title when modifications are detected.
 */
export function usePageTitle({
  baseTitle = "Copilot Tier Planner",
  scenario,
  thresholds,
}: UsePageTitleOptions = {}) {
  // Use the same dirty state logic as the export buttons
  const isDirty = useDirtyState({ scenario, thresholds });

  useEffect(() => {
    // Update page title based on dirty state
    document.title = isDirty ? `* Edited — ${baseTitle}` : baseTitle;
  }, [baseTitle, isDirty]);

  // Cleanup: reset title on unmount
  useEffect(() => {
    return () => {
      document.title = baseTitle;
    };
  }, [baseTitle]);
}
