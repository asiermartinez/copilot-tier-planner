"use client";

import { useEffect, useState } from "react";
import type { SkuScenario } from "@/types/scenario";
import type { ThresholdsConfig } from "@/types/thresholds";

interface UseDirtyStateOptions {
  scenario?: SkuScenario;
  thresholds?: ThresholdsConfig;
}

// Store initial state globally to persist across component remounts
let globalInitialScenario: SkuScenario | undefined = undefined;
let globalInitialThresholds: ThresholdsConfig | undefined = undefined;
let globalHasInitialized = false;

/**
 * Reset the dirty state tracking (useful after import or reset to defaults)
 *
 * @param resetScenario - If true, clears scenario baseline (will reinitialize on next render)
 *                        If a scenario object is provided, sets it as the new baseline
 * @param resetThresholds - If true, clears thresholds baseline (will reinitialize on next render)
 *                          If a thresholds object is provided, sets it as the new baseline
 */
export function resetDirtyState(
  resetScenario?: SkuScenario | boolean,
  resetThresholds?: ThresholdsConfig | boolean
) {
  // Handle scenario reset
  if (resetScenario === true) {
    // Clear scenario baseline - will reinitialize on next render
    globalInitialScenario = undefined;
  } else if (resetScenario && typeof resetScenario === "object") {
    // Set specific scenario as new baseline
    globalInitialScenario = JSON.parse(JSON.stringify(resetScenario));
  }

  // Handle thresholds reset
  if (resetThresholds === true) {
    // Clear thresholds baseline - will reinitialize on next render
    globalInitialThresholds = undefined;
  } else if (resetThresholds && typeof resetThresholds === "object") {
    // Set specific thresholds as new baseline
    globalInitialThresholds = JSON.parse(JSON.stringify(resetThresholds));
  }

  // Only reset initialization flag if both are being cleared
  if (resetScenario === true && resetThresholds === true) {
    globalHasInitialized = false;
  }
}

/**
 * Deep comparison helper for objects
 * Compares all properties except timestamps and undefined fields
 */
function areStatesEqual(
  state1: SkuScenario | ThresholdsConfig | undefined,
  state2: SkuScenario | ThresholdsConfig | undefined
): boolean {
  if (state1 === state2) return true;
  if (!state1 || !state2) return false;

  // Sort object keys recursively for consistent comparison
  const sortKeys = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    if (typeof obj !== "object") return obj;

    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach(key => {
        sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
      });
    return sorted;
  };

  // Normalize objects for comparison
  const normalize = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return null;

    // Create a deep copy
    const copy = JSON.parse(JSON.stringify(obj));

    // Remove timestamp fields that don't affect actual content
    delete copy.modifiedAt;
    delete copy.createdAt;

    // Remove undefined or empty optional fields
    if (copy.customSkus && copy.customSkus.length === 0) {
      delete copy.customSkus;
    }
    if (copy.skuVariations && Object.keys(copy.skuVariations).length === 0) {
      delete copy.skuVariations;
    }
    if (copy.nodePositions && Object.keys(copy.nodePositions).length === 0) {
      delete copy.nodePositions;
    }

    // Round node positions to avoid floating point precision issues
    if (copy.nodePositions) {
      Object.keys(copy.nodePositions).forEach(key => {
        copy.nodePositions[key].x =
          Math.round(copy.nodePositions[key].x * 100) / 100;
        copy.nodePositions[key].y =
          Math.round(copy.nodePositions[key].y * 100) / 100;
      });
    }

    // Sort keys for consistent comparison
    return sortKeys(copy);
  };

  const normalized1 = normalize(state1);
  const normalized2 = normalize(state2);

  // Compare the stringified versions
  const json1 = JSON.stringify(normalized1);
  const json2 = JSON.stringify(normalized2);

  return json1 === json2;
}

/**
 * Custom hook to track dirty state of configuration
 *
 * Tracks changes to scenarios and thresholds by comparing actual state
 * rather than just timestamps. Returns true only if there are real
 * differences from the initial state.
 *
 * Uses global state to persist across component remounts (e.g., view switching).
 */
export function useDirtyState({
  scenario,
  thresholds,
}: UseDirtyStateOptions = {}): boolean {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Initialize global state on the very first render
    // Don't wait for nodePositions - capture the initial state immediately
    if (!globalHasInitialized && scenario && thresholds) {
      globalHasInitialized = true;
      globalInitialScenario = JSON.parse(JSON.stringify(scenario));
      globalInitialThresholds = JSON.parse(JSON.stringify(thresholds));
    }

    // Don't compare until we've captured the initial state
    if (!globalHasInitialized) {
      setIsDirty(false);
      return;
    }

    // Compare current state to initial state
    const scenarioChanged = !areStatesEqual(scenario, globalInitialScenario);
    const thresholdsChanged = !areStatesEqual(
      thresholds,
      globalInitialThresholds
    );

    // Determine if we need to show dirty indicator
    setIsDirty(scenarioChanged || thresholdsChanged);
  }, [scenario, thresholds]);

  return isDirty;
}
