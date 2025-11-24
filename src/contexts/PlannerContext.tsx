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
import type { UserState, SimpleUserState } from "@/types/userState";
import type { SkuId } from "@/types/sku";
import { generateUserState } from "@/utils/mockStateGenerator";

/**
 * Context value interface
 */
interface PlannerContextValue {
  /** Current user state (full state object) */
  userState: UserState;

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
const DEFAULT_SIMPLE_STATE: SimpleUserState = {
  skuId: "free",
  accountType: "individual",
  premiumRequestsUsed: 0,
  chatMessagesUsed: 0,
  codeCompletionsUsed: 0,
  overageBudgetUsd: null,
  daysIntoPeriod: 15,
};

/**
 * Generate full UserState from SimpleUserState
 */
function generateStateFromSimple(simple: SimpleUserState): UserState {
  const accountType = simple.accountType;
  const now = new Date();
  const billingStart = new Date(now);
  billingStart.setDate(1);
  const billingEnd = new Date(billingStart);
  billingEnd.setMonth(billingEnd.getMonth() + 1);

  const daysIntoPeriod = simple.daysIntoPeriod ?? 15;
  const totalDays = Math.ceil(
    (billingEnd.getTime() - billingStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = totalDays - daysIntoPeriod;

  return generateUserState({
    id: `state-${Date.now()}`,
    timestamp: now.toISOString(),
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
      simple.overageBudgetUsd !== null && simple.overageBudgetUsd !== undefined
        ? {
            maxBudgetUsd: simple.overageBudgetUsd,
            blockWhenExceeded: false,
            enableAlerts: true,
            alertThresholds: [50, 75, 90, 100],
          }
        : null,
  });
}

/**
 * Convert UserState to SimpleUserState for URL encoding
 */
function toSimpleState(state: UserState): SimpleUserState {
  return {
    skuId: state.subscription.skuId,
    accountType: state.account.accountType,
    seats: state.account.seats,
    premiumRequestsUsed: state.usage.premiumRequests.current,
    chatMessagesUsed: state.usage.chatMessages.current,
    codeCompletionsUsed: state.usage.codeCompletions.current,
    overageBudgetUsd: state.overageBudget?.maxBudgetUsd ?? null,
    daysIntoPeriod:
      state.billingPeriod.daysInPeriod - state.billingPeriod.daysRemaining,
  };
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
    return generateStateFromSimple(DEFAULT_SIMPLE_STATE);
  });

  // Update URL whenever state changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const simpleState = toSimpleState(userState);
    const encoded = encodeStateToUrl(simpleState);
    const params = new URLSearchParams(window.location.search);
    params.set("state", encoded);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [userState]);

  /**
   * Update SKU and regenerate state
   */
  const updateSku = useCallback(
    (skuId: SkuId) => {
      const simpleState = toSimpleState(userState);
      simpleState.skuId = skuId;
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
    setUserState(generateStateFromSimple(DEFAULT_SIMPLE_STATE));
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
    }),
    [
      userState,
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
