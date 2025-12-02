"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import type { UserState, SimpleUserState } from "@/types/userState";
import type { SkuId } from "@/types/sku";
import { getSkuById } from "@/data/skus";
import { generateUserState } from "@/utils/mockStateGenerator";
import { DEFAULT_ALERT_THRESHOLDS } from "@/data/alertThresholds";
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
  updateAccountType: (
    accountType: "individual" | "organization" | "enterprise"
  ) => void;

  /** Update account type and SKU together (generates new state) */
  updateAccountTypeAndSku: (
    accountType: "individual" | "organization" | "enterprise",
    skuId: SkuId
  ) => void;

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
 * Default simple state (FREE individual user, no usage)
 */
const getDefaultSimpleState = (): SimpleUserState => {
  const now = new Date();
  const currentDay = now.getDate();

  return {
    skuId: "free",
    accountType: "individual",
    premiumRequestsUsed: 0,
    chatMessagesUsed: 0,
    codeCompletionsUsed: 0,
    overageBudgetUsd: null,
    daysIntoPeriod: currentDay,
    currentTimestamp: now.toISOString(),
  };
};

/**
 * Generate full UserState from SimpleUserState
 */
function generateStateFromSimple(simple: SimpleUserState): UserState {
  const accountType = simple.accountType;

  // Check if the SKU allows overage budgets
  const sku = getSkuById(simple.skuId);
  const allowsOverageBudget =
    sku.limits.premiumRequestsOveragePolicy?.allowBudgetCap ?? false;

  // Use fixed timestamp if available, otherwise create new one
  const now = simple.currentTimestamp
    ? new Date(simple.currentTimestamp)
    : new Date();

  // Calculate billing dates based on days into period
  const daysIntoPeriod = simple.daysIntoPeriod ?? now.getDate();

  // Calculate billing start by subtracting days into period from today
  // Use timestamp arithmetic to avoid month boundary issues
  const billingStart = new Date(
    now.getTime() - daysIntoPeriod * 24 * 60 * 60 * 1000
  );
  billingStart.setHours(0, 0, 0, 0);

  // Calculate billing end (exactly one month from billing start)
  const billingEnd = new Date(billingStart);
  billingEnd.setMonth(billingEnd.getMonth() + 1);
  billingEnd.setHours(0, 0, 0, 0);

  // Calculate total days in period
  const totalDays = Math.round(
    (billingEnd.getTime() - billingStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, totalDays - daysIntoPeriod);

  return generateUserState({
    id: `state-${Date.now()}`,
    timestamp: new Date().toISOString(), // Always use current time for timestamp
    skuId: simple.skuId,
    account: {
      userId: "user-playground",
      username: "playground-user",
      accountType,
      email: "user@example.com",
      organizationName:
        accountType === "organization" || accountType === "enterprise"
          ? "Example Org"
          : undefined,
      seats: simple.seats ?? (accountType === "individual" ? undefined : 10),
    },
    billing: {
      startDate: billingStart.toISOString(),
      status: "active",
      billingFrequency: "monthly",
      autoRenew: true,
      nextRenewalDate: billingEnd.toISOString(),
    },
    billingPeriod: {
      startDate: billingStart.toISOString(),
      endDate: billingEnd.toISOString(),
      daysRemaining,
    },
    usage: {
      premiumRequests: simple.premiumRequestsUsed,
      chatMessages: simple.chatMessagesUsed ?? 0,
      codeCompletions: simple.codeCompletionsUsed ?? 0,
    },
    overageBudget:
      allowsOverageBudget &&
      simple.overageBudgetUsd !== null &&
      simple.overageBudgetUsd !== undefined
        ? {
            maxBudgetUsd: simple.overageBudgetUsd,
            alertThresholds: DEFAULT_ALERT_THRESHOLDS,
          }
        : null,
  });
}

/**
 * Convert UserState to SimpleUserState for URL encoding
 */
function toSimpleState(state: UserState): SimpleUserState {
  const simpleState: SimpleUserState = {
    skuId: state.subscription.skuId,
    accountType: state.account.accountType,
    premiumRequestsUsed: state.usage.premiumRequests.current,
    chatMessagesUsed: state.usage.chatMessages.current,
    codeCompletionsUsed: state.usage.codeCompletions.current,
    overageBudgetUsd: state.overageBudget?.maxBudgetUsd ?? null,
    daysIntoPeriod:
      state.billingPeriod.daysInPeriod - state.billingPeriod.daysRemaining,
    currentTimestamp: state.timestamp,
  };

  // Only include seats for organization and enterprise accounts
  if (state.account.accountType !== "individual" && state.account.seats) {
    simpleState.seats = state.account.seats;
  }

  return simpleState;
}

/**
 * Encode simple state to Base64 for URL
 */
function encodeStateToUrl(state: SimpleUserState): string {
  const json = JSON.stringify(state);
  return btoa(json);
}

/**
 * Decode simple state from Base64 URL parameter
 */
function decodeStateFromUrl(encoded: string): SimpleUserState | null {
  try {
    const json = atob(encoded);
    const state = JSON.parse(json);
    return state;
  } catch {
    return null;
  }
}

/**
 * Provider component props
 */
interface PlannerProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages SKU planner state
 */
export function PlannerProvider({ children }: PlannerProviderProps) {
  // Custom messages and thresholds state
  const [customMessages, setCustomMessages] = useState<
    CustomMessages | undefined
  >();
  const [customThresholds, setCustomThresholds] = useState<
    CustomThresholds | undefined
  >();

  // Configurable thresholds
  const [thresholdsConfig, setThresholdsConfig] = useState<ThresholdsConfig>({
    thresholds: DEFAULT_THRESHOLDS,
  });

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

  // Initialize state from URL or default
  const [userState, setUserState] = useState<UserState>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("state");
      if (encoded) {
        const simpleState = decodeStateFromUrl(encoded);
        if (simpleState) {
          return generateStateFromSimple(simpleState);
        }
      }
    }
    return generateStateFromSimple(getDefaultSimpleState());
  });

  // Debounce URL updates to prevent rate limiting
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set a new timeout to update URL after 500ms of inactivity
    updateTimeoutRef.current = setTimeout(() => {
      const simpleState = toSimpleState(userState);
      const encoded = encodeStateToUrl(simpleState);
      const params = new URLSearchParams(window.location.search);
      params.set("state", encoded);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }, 500);

    // Cleanup on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [userState]);

  /**
   * Update userState with threshold-related data whenever thresholds config or plan changes
   */
  useEffect(() => {
    const alert = getHighestPriorityAlert(userState, thresholdsConfig);
    const lastCrossedThresholdMessage = alert?.message ?? undefined;

    const currentSkuId = userState.subscription.skuId;
    // const currentAccountType = userState.account.accountType;

    // Extract quota thresholds for premium requests (filtered by plan and area)
    const quotaThresholds = Array.from(
      new Set(
        thresholdsConfig.thresholds
          .filter(
            t =>
              t.enabled &&
              t.plans.includes(currentSkuId) &&
              t.areas.includes("quota")
          )
          .map(t => t.percentage)
      )
    ).sort((a, b) => a - b);

    // Extract overage budget thresholds (filtered by plan and area)
    const overageThresholds = Array.from(
      new Set(
        thresholdsConfig.thresholds
          .filter(
            t =>
              t.enabled &&
              t.plans.includes(currentSkuId) &&
              t.areas.includes("overage")
          )
          .map(t => t.percentage)
      )
    ).sort((a, b) => a - b);

    // Calculate last crossed threshold for premium requests
    const premiumPercentage =
      userState.usage.premiumRequests.percentageUsed ?? 0;
    const premiumLastCrossed =
      quotaThresholds.length > 0
        ? (quotaThresholds.filter(t => premiumPercentage >= t).pop() ?? null)
        : null;

    // Calculate last crossed threshold for overage budget
    const overagePercentage = userState.overageBudget?.percentageConsumed ?? 0;
    const overageLastCrossed =
      overageThresholds.length > 0
        ? (overageThresholds.filter(t => overagePercentage >= t).pop() ?? null)
        : null;

    // Check if any threshold data needs updating
    const needsUpdate =
      userState.usage.premiumRequests.lastCrossedThresholdMessage !==
        lastCrossedThresholdMessage ||
      JSON.stringify(userState.usage.premiumRequests.alertThresholds) !==
        JSON.stringify(quotaThresholds.length > 0 ? quotaThresholds : null) ||
      userState.usage.premiumRequests.lastCrossedThreshold !==
        premiumLastCrossed ||
      (userState.overageBudget &&
        (JSON.stringify(userState.overageBudget.alertThresholds) !==
          JSON.stringify(
            overageThresholds.length > 0 ? overageThresholds : []
          ) ||
          userState.overageBudget.lastCrossedThreshold !== overageLastCrossed));

    if (needsUpdate) {
      setUserState(prev => ({
        ...prev,
        usage: {
          ...prev.usage,
          premiumRequests: {
            ...prev.usage.premiumRequests,
            alertThresholds:
              quotaThresholds.length > 0 ? quotaThresholds : null,
            lastCrossedThreshold: premiumLastCrossed,
            lastCrossedThresholdMessage,
          },
        },
        overageBudget: prev.overageBudget
          ? {
              ...prev.overageBudget,
              alertThresholds:
                overageThresholds.length > 0 ? overageThresholds : [],
              lastCrossedThreshold: overageLastCrossed,
            }
          : null,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    thresholdsConfig,
    userState.subscription.skuId,
    userState.account.accountType,
    userState.usage.premiumRequests.percentageUsed,
    userState.overageBudget?.percentageConsumed,
  ]);

  /**
   * Update SKU and regenerate state
   */
  const updateSku = useCallback(
    (skuId: SkuId) => {
      const simpleState = toSimpleState(userState);
      simpleState.skuId = skuId;

      // Clear overage budget when switching to a SKU that doesn't allow budget caps
      const sku = getSkuById(skuId);
      const allowsOverageBudget =
        sku.limits.premiumRequestsOveragePolicy?.allowBudgetCap ?? false;

      if (!allowsOverageBudget) {
        simpleState.overageBudgetUsd = null;
      }

      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update account type and regenerate state
   */
  const updateAccountType = useCallback(
    (newAccountType: "individual" | "organization" | "enterprise") => {
      const simpleState = toSimpleState(userState);
      simpleState.accountType = newAccountType;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update account type and SKU together in a single state change
   */
  const updateAccountTypeAndSku = useCallback(
    (
      newAccountType: "individual" | "organization" | "enterprise",
      skuId: SkuId
    ) => {
      const simpleState = toSimpleState(userState);
      simpleState.accountType = newAccountType;
      simpleState.skuId = skuId;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update number of seats
   */
  const updateSeats = useCallback(
    (seats: number) => {
      const simpleState = toSimpleState(userState);
      simpleState.seats = seats;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update premium requests usage
   */
  const updatePremiumRequests = useCallback(
    (used: number) => {
      const simpleState = toSimpleState(userState);
      simpleState.premiumRequestsUsed = used;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update chat messages usage
   */
  const updateChatMessages = useCallback(
    (used: number) => {
      const simpleState = toSimpleState(userState);
      simpleState.chatMessagesUsed = used;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update code completions usage
   */
  const updateCodeCompletions = useCallback(
    (used: number) => {
      const simpleState = toSimpleState(userState);
      simpleState.codeCompletionsUsed = used;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update overage budget
   */
  const updateOverageBudget = useCallback(
    (budgetUsd: number | null) => {
      const simpleState = toSimpleState(userState);
      simpleState.overageBudgetUsd = budgetUsd;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Update days into billing period
   */
  const updateDaysIntoPeriod = useCallback(
    (days: number) => {
      const simpleState = toSimpleState(userState);
      simpleState.daysIntoPeriod = days;
      setUserState(generateStateFromSimple(simpleState));
    },
    [userState]
  );

  /**
   * Load a preset state (placeholder - will be implemented when presets are finalized)
   */
  const loadPreset = useCallback((presetId: string) => {
    // TODO: Import and load preset by ID when presets are available
    console.log("Loading preset:", presetId);
  }, []);

  /**
   * Reset to default state
   */
  const reset = useCallback(() => {
    setUserState(generateStateFromSimple(getDefaultSimpleState()));
  }, []);

  /**
   * Get simplified state for URL sharing
   */
  const getSimpleState = useCallback(() => {
    return toSimpleState(userState);
  }, [userState]);

  /**
   * Load state from simplified state object
   */
  const loadFromSimpleState = useCallback((simpleState: SimpleUserState) => {
    setUserState(generateStateFromSimple(simpleState));
  }, []);

  const value = useMemo<PlannerContextValue>(
    () => ({
      userState,
      customMessages,
      customThresholds,
      thresholdsConfig,
      updateThresholdsConfig: setThresholdsConfig,
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
