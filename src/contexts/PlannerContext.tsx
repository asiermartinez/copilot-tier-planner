"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type {
  UserState,
  SimpleUserState,
  AccountType,
} from "@/types/userState";
import type { Sku, SkuId } from "@/types/sku";
import type {
  CustomMessages,
  CustomThresholds,
} from "@/types/messages/customMessages";
import type { ThresholdsConfig } from "@/types/thresholds";
import { DEFAULT_THRESHOLDS } from "@/types/thresholds";
import {
  getHighestPriorityAlert,
  clearStaticBannerStates,
} from "@/utils/alerts/generateThresholdAlerts";
import { useScenario } from "./ScenarioContext";
import { usePlannerState } from "@/hooks/usePlannerState";
import { useUrlState } from "@/hooks/useUrlState";
import {
  getDefaultSimpleState,
  getFirstRenderSimpleState,
  toSimpleState,
  generateStateFromSimple,
} from "@/utils/simpleStateHelpers";

/**
 * Set of dismissed alert IDs
 */
export type DismissedAlerts = Set<string>;

/**
 * Context value interface
 */
interface PlannerContextValue {
  /** Current user state (full state object) */
  userState: UserState;

  /** Custom messages for banner system */
  customMessages: CustomMessages | undefined;

  /** Custom alert thresholds */
  customThresholds: CustomThresholds | undefined;

  /** Configurable thresholds for alerts */
  thresholdsConfig: ThresholdsConfig;

  /** Update thresholds configuration */
  updateThresholdsConfig: (config: ThresholdsConfig) => void;

  /** Active alert ID for focusing corresponding message field */
  activeAlertId: string | null;

  /** Set active alert ID */
  setActiveAlertId: (alertId: string | null) => void;

  /** Set of dismissed alert IDs */
  dismissedAlerts: DismissedAlerts;

  /** Dismiss an alert */
  dismissAlert: (alertId: string) => void;

  /** Clear all dismissed alerts */
  clearDismissedAlerts: () => void;

  /** Update the SKU (generates new state) */
  updateSku: (skuId: SkuId) => void;

  /** Update account type (generates new state) */
  updateAccountType: (accountType: AccountType) => void;

  /** Update account type and SKU together (generates new state) */
  updateAccountTypeAndSku: (accountType: AccountType, skuId: SkuId) => void;

  /** Update number of seats (for org/enterprise) */
  updateSeats: (seats: number) => void;

  /** Update premium requests usage */
  updatePremiumRequests: (used: number) => void;

  /** Update chat messages usage */
  updateChatMessages: (used: number) => void;

  /** Update code completions usage */
  updateCodeCompletions: (used: number) => void;

  /** Update overage budget */
  updateOverageBudget: (budgetUsd: number | null) => void;

  /** Update days into billing period */
  updateDaysIntoPeriod: (days: number) => void;

  /** Update custom messages */
  updateCustomMessages: (messages: CustomMessages | undefined) => void;

  /** Update custom thresholds */
  updateCustomThresholds: (thresholds: CustomThresholds | undefined) => void;

  /** Load a preset state by ID */
  loadPreset: (presetId: string) => void;

  /** Reset to default state */
  reset: () => void;

  /** Get simplified state for URL sharing */
  getSimpleState: () => SimpleUserState;

  /** Load state from simplified state object */
  loadFromSimpleState: (simpleState: SimpleUserState) => void;
}

/**
 * Context instance
 */
const PlannerContext = createContext<PlannerContextValue | undefined>(
  undefined
);

/**
 * Provider component props
 */
interface PlannerProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages tier planner state
 */
export function PlannerProvider({ children }: PlannerProviderProps) {
  // Access scenario context for SKU variations
  const { currentScenario } = useScenario();

  // URL state management
  const { readFromUrl, updateUrl } = useUrlState();

  // Deterministic first render, so hydration matches the prerendered page
  const getInitialState = (): UserState => {
    const firstRenderState = getFirstRenderSimpleState();
    return generateStateFromSimple(
      firstRenderState,
      currentScenario.skuVariations?.[firstRenderState.skuId],
      currentScenario.customSkus
    );
  };

  // State management with reducer pattern
  const {
    state: baseUserState,
    updateSku,
    updateAccountType,
    updateAccountTypeAndSku,
    updateSeats,
    updatePremiumRequests,
    updateChatMessages,
    updateCodeCompletions,
    updateOverageBudget,
    updateDaysIntoPeriod,
    setState,
    loadFromSimpleState,
  } = usePlannerState({
    initialState: getInitialState(),
    skuVariations: currentScenario.skuVariations,
    customSkus: currentScenario.customSkus,
  });

  // Custom messages and thresholds state
  const [customMessages, setCustomMessages] = useState<
    CustomMessages | undefined
  >();
  const [customThresholds, setCustomThresholds] = useState<
    CustomThresholds | undefined
  >();

  // Configurable thresholds
  const [thresholdsConfig, setThresholdsConfigInternal] =
    useState<ThresholdsConfig>({
      thresholds: DEFAULT_THRESHOLDS,
    });

  // Threshold data (crossed thresholds, alert message) is derived from the
  // usage state and the thresholds config during render. Computing it in an
  // effect and dispatching it back caused a second full re-render after every
  // usage change, with a frame where the threshold data was missing.
  const userState = useMemo(
    () =>
      withThresholdData(
        baseUserState,
        thresholdsConfig,
        currentScenario.customSkus
      ),
    [baseUserState, thresholdsConfig, currentScenario.customSkus]
  );

  // Wrapper to automatically set modifiedAt timestamp
  const updateThresholdsConfig = useCallback((config: ThresholdsConfig) => {
    setThresholdsConfigInternal({
      ...config,
      modifiedAt: new Date().toISOString(),
    });
  }, []);

  // Active alert tracking
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  // Dismissed alerts tracking
  const [dismissedAlerts, setDismissedAlerts] = useState<DismissedAlerts>(
    new Set()
  );

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  }, []);

  const clearDismissedAlerts = useCallback(() => {
    setDismissedAlerts(new Set());
    clearStaticBannerStates();
  }, []);

  // Memoize stringified variations for dependency tracking
  const skuVariationsKey = useMemo(
    () => JSON.stringify(currentScenario.skuVariations),
    [currentScenario.skuVariations]
  );

  // Regenerate user state when SKU variations change for the current SKU
  useEffect(() => {
    const currentSkuId = userState.subscription.skuId;
    const variation = currentScenario.skuVariations?.[currentSkuId];
    const simpleState = toSimpleState(userState);
    const newState = generateStateFromSimple(
      simpleState,
      variation,
      currentScenario.customSkus
    );

    // Only update if the limits actually changed (to avoid infinite loops)
    const oldLimit = userState.usage.premiumRequests.limit;
    const newLimit = newState.usage.premiumRequests.limit;

    if (oldLimit !== newLimit) {
      setState(newState);
    }
  }, [
    skuVariationsKey,
    currentScenario.skuVariations,
    currentScenario.customSkus,
    userState,
    setState,
  ]);

  // Load the real state after hydration: the URL if it has one, otherwise
  // defaults based on today's date. Runs once, so later changes to the scenario
  // can't overwrite what the user has done since.
  useEffect(() => {
    loadFromSimpleState(readFromUrl() ?? getDefaultSimpleState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state to URL
  useEffect(() => {
    const simpleState = toSimpleState(userState);
    updateUrl(simpleState);
  }, [userState, updateUrl]);

  // Load a preset state (placeholder - will be implemented when presets are finalized)
  const loadPreset = useCallback((presetId: string) => {
    // TODO: Import and load preset by ID when presets are available
    console.log("Loading preset:", presetId);
  }, []);

  // Reset to default state
  const reset = useCallback(() => {
    const defaultState = getDefaultSimpleState();
    const variation = currentScenario.skuVariations?.[defaultState.skuId];
    const newState = generateStateFromSimple(
      defaultState,
      variation,
      currentScenario.customSkus
    );
    setState(newState);
  }, [currentScenario.skuVariations, currentScenario.customSkus, setState]);

  // Get simplified state for URL sharing
  const getSimpleState = useCallback(() => {
    return toSimpleState(userState);
  }, [userState]);

  const value = useMemo<PlannerContextValue>(
    () => ({
      userState,
      customMessages,
      customThresholds,
      thresholdsConfig,
      updateThresholdsConfig,
      activeAlertId,
      setActiveAlertId,
      dismissedAlerts,
      dismissAlert,
      clearDismissedAlerts,
      updateSku,
      updateAccountType,
      updateAccountTypeAndSku,
      updateSeats,
      updatePremiumRequests,
      updateChatMessages,
      updateCodeCompletions,
      updateOverageBudget,
      updateDaysIntoPeriod,
      updateCustomMessages: setCustomMessages,
      updateCustomThresholds: setCustomThresholds,
      loadPreset,
      reset,
      getSimpleState,
      loadFromSimpleState,
    }),
    [
      userState,
      customMessages,
      customThresholds,
      thresholdsConfig,
      activeAlertId,
      dismissedAlerts,
      dismissAlert,
      clearDismissedAlerts,
      updateThresholdsConfig,
      updateSku,
      updateAccountType,
      updateAccountTypeAndSku,
      updateSeats,
      updatePremiumRequests,
      updateChatMessages,
      updateCodeCompletions,
      updateOverageBudget,
      updateDaysIntoPeriod,
      loadPreset,
      reset,
      getSimpleState,
      loadFromSimpleState,
    ]
  );

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  );
}

/**
 * Hook to access planner context
 */
export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error("usePlanner must be used within PlannerProvider");
  }
  return context;
}

/**
 * Attach the threshold-derived fields (configured alert thresholds, last
 * crossed threshold and its message) for the current plan to a user state.
 */
function withThresholdData(
  state: UserState,
  thresholdsConfig: ThresholdsConfig,
  customSkus?: Sku[]
): UserState {
  const alert = getHighestPriorityAlert(state, thresholdsConfig, customSkus);
  const currentSkuId = state.subscription.skuId;

  const thresholdsFor = (area: "quota" | "overage") =>
    Array.from(
      new Set(
        thresholdsConfig.thresholds
          .filter(
            t =>
              t.enabled &&
              t.plans.includes(currentSkuId) &&
              t.areas.includes(area)
          )
          .map(t => t.percentage)
      )
    ).sort((a, b) => a - b);

  const lastCrossed = (thresholds: number[], percentage: number) =>
    thresholds.filter(t => percentage >= t).pop() ?? null;

  const quotaThresholds = thresholdsFor("quota");
  const overageThresholds = thresholdsFor("overage");

  return {
    ...state,
    usage: {
      ...state.usage,
      premiumRequests: {
        ...state.usage.premiumRequests,
        alertThresholds: quotaThresholds.length > 0 ? quotaThresholds : null,
        lastCrossedThreshold: lastCrossed(
          quotaThresholds,
          state.usage.premiumRequests.percentageUsed ?? 0
        ),
        lastCrossedThresholdMessage: alert?.message ?? undefined,
      },
    },
    overageBudget: state.overageBudget
      ? {
          ...state.overageBudget,
          alertThresholds: overageThresholds,
          lastCrossedThreshold: lastCrossed(
            overageThresholds,
            state.overageBudget.percentageConsumed ?? 0
          ),
        }
      : null,
  };
}
