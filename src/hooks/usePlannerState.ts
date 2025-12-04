"use client";

import { useCallback, useReducer } from "react";
import type {
  UserState,
  SimpleUserState,
  AccountType,
} from "@/types/userState";
import type { SkuId, Sku } from "@/types/sku";
import type { SkuVariation } from "@/types/scenario";
import {
  generateStateFromSimple,
  toSimpleState,
} from "@/utils/simpleStateHelpers";
import { getSkuById } from "@/data/skus";

type PlannerStateAction =
  | { type: "SET_STATE"; payload: UserState }
  | { type: "UPDATE_SKU"; payload: { skuId: SkuId; customSkus?: Sku[] } }
  | {
      type: "UPDATE_ACCOUNT_TYPE";
      payload: {
        accountType: AccountType;
        customSkus?: Sku[];
      };
    }
  | {
      type: "UPDATE_ACCOUNT_TYPE_AND_SKU";
      payload: {
        accountType: AccountType;
        skuId: SkuId;
        variation?: SkuVariation;
        customSkus?: Sku[];
      };
    }
  | {
      type: "UPDATE_SEATS";
      payload: { seats: number; variation?: SkuVariation; customSkus?: Sku[] };
    }
  | {
      type: "UPDATE_PREMIUM_REQUESTS";
      payload: { used: number; variation?: SkuVariation; customSkus?: Sku[] };
    }
  | {
      type: "UPDATE_CHAT_MESSAGES";
      payload: { used: number; variation?: SkuVariation; customSkus?: Sku[] };
    }
  | {
      type: "UPDATE_CODE_COMPLETIONS";
      payload: { used: number; variation?: SkuVariation; customSkus?: Sku[] };
    }
  | {
      type: "UPDATE_OVERAGE_BUDGET";
      payload: {
        budgetUsd: number | null;
        variation?: SkuVariation;
        customSkus?: Sku[];
      };
    }
  | {
      type: "UPDATE_DAYS_INTO_PERIOD";
      payload: { days: number; variation?: SkuVariation; customSkus?: Sku[] };
    }
  | {
      type: "UPDATE_THRESHOLD_DATA";
      payload: {
        quotaThresholds: number[] | null;
        overageThresholds: number[];
        premiumLastCrossed: number | null;
        overageLastCrossed: number | null;
        lastCrossedThresholdMessage?: string;
      };
    };

function plannerStateReducer(
  state: UserState,
  action: PlannerStateAction
): UserState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;

    case "UPDATE_SKU": {
      const simpleState = toSimpleState(state);
      simpleState.skuId = action.payload.skuId;

      // Clear overage budget when switching to a SKU that doesn't allow budget caps
      let sku = getSkuById(action.payload.skuId);

      // If not found in built-in SKUs, check custom SKUs
      if (!sku && action.payload.customSkus) {
        sku = action.payload.customSkus.find(
          s => s.id === action.payload.skuId
        );
      }

      const allowsOverageBudget =
        sku?.limits.premiumRequestsOveragePolicy?.allowBudgetCap ?? false;

      if (!allowsOverageBudget) {
        simpleState.overageBudgetUsd = null;
      }

      return generateStateFromSimple(
        simpleState,
        undefined,
        action.payload.customSkus
      );
    }

    case "UPDATE_ACCOUNT_TYPE": {
      const simpleState = toSimpleState(state);
      simpleState.accountType = action.payload.accountType;
      return generateStateFromSimple(
        simpleState,
        undefined,
        action.payload.customSkus
      );
    }

    case "UPDATE_ACCOUNT_TYPE_AND_SKU": {
      const simpleState = toSimpleState(state);
      simpleState.accountType = action.payload.accountType;
      simpleState.skuId = action.payload.skuId;
      return generateStateFromSimple(
        simpleState,
        action.payload.variation,
        action.payload.customSkus
      );
    }

    case "UPDATE_SEATS": {
      const simpleState = toSimpleState(state);
      simpleState.seats = action.payload.seats;
      return generateStateFromSimple(
        simpleState,
        action.payload.variation,
        action.payload.customSkus
      );
    }

    case "UPDATE_PREMIUM_REQUESTS": {
      const simpleState = toSimpleState(state);
      simpleState.premiumRequestsUsed = action.payload.used;
      return generateStateFromSimple(
        simpleState,
        action.payload.variation,
        action.payload.customSkus
      );
    }

    case "UPDATE_CHAT_MESSAGES": {
      const simpleState = toSimpleState(state);
      simpleState.chatMessagesUsed = action.payload.used;
      return generateStateFromSimple(
        simpleState,
        action.payload.variation,
        action.payload.customSkus
      );
    }

    case "UPDATE_CODE_COMPLETIONS": {
      const simpleState = toSimpleState(state);
      simpleState.codeCompletionsUsed = action.payload.used;
      return generateStateFromSimple(
        simpleState,
        action.payload.variation,
        action.payload.customSkus
      );
    }

    case "UPDATE_OVERAGE_BUDGET": {
      const simpleState = toSimpleState(state);
      simpleState.overageBudgetUsd = action.payload.budgetUsd;
      return generateStateFromSimple(
        simpleState,
        action.payload.variation,
        action.payload.customSkus
      );
    }

    case "UPDATE_DAYS_INTO_PERIOD": {
      const simpleState = toSimpleState(state);
      simpleState.daysIntoPeriod = action.payload.days;
      return generateStateFromSimple(
        simpleState,
        action.payload.variation,
        action.payload.customSkus
      );
    }

    case "UPDATE_THRESHOLD_DATA": {
      return {
        ...state,
        usage: {
          ...state.usage,
          premiumRequests: {
            ...state.usage.premiumRequests,
            alertThresholds: action.payload.quotaThresholds,
            lastCrossedThreshold: action.payload.premiumLastCrossed,
            lastCrossedThresholdMessage:
              action.payload.lastCrossedThresholdMessage,
          },
        },
        overageBudget: state.overageBudget
          ? {
              ...state.overageBudget,
              alertThresholds: action.payload.overageThresholds,
              lastCrossedThreshold: action.payload.overageLastCrossed,
            }
          : null,
      };
    }

    default:
      return state;
  }
}

interface UsePlannerStateOptions {
  initialState: UserState;
  skuVariations?: Record<string, SkuVariation>;
  customSkus?: Sku[];
}

export function usePlannerState({
  initialState,
  skuVariations,
  customSkus,
}: UsePlannerStateOptions) {
  const [state, dispatch] = useReducer(plannerStateReducer, initialState);

  const updateSku = useCallback(
    (skuId: SkuId) => {
      dispatch({ type: "UPDATE_SKU", payload: { skuId, customSkus } });
    },
    [customSkus]
  );

  const updateAccountType = useCallback(
    (accountType: AccountType) => {
      dispatch({
        type: "UPDATE_ACCOUNT_TYPE",
        payload: { accountType, customSkus },
      });
    },
    [customSkus]
  );

  const updateAccountTypeAndSku = useCallback(
    (accountType: AccountType, skuId: SkuId) => {
      const variation = skuVariations?.[skuId];
      dispatch({
        type: "UPDATE_ACCOUNT_TYPE_AND_SKU",
        payload: { accountType, skuId, variation, customSkus },
      });
    },
    [skuVariations, customSkus]
  );

  const updateSeats = useCallback(
    (seats: number) => {
      const variation = skuVariations?.[state.subscription.skuId];
      dispatch({
        type: "UPDATE_SEATS",
        payload: { seats, variation, customSkus },
      });
    },
    [state.subscription.skuId, skuVariations, customSkus]
  );

  const updatePremiumRequests = useCallback(
    (used: number) => {
      const variation = skuVariations?.[state.subscription.skuId];
      dispatch({
        type: "UPDATE_PREMIUM_REQUESTS",
        payload: { used, variation, customSkus },
      });
    },
    [state.subscription.skuId, skuVariations, customSkus]
  );

  const updateChatMessages = useCallback(
    (used: number) => {
      const variation = skuVariations?.[state.subscription.skuId];
      dispatch({
        type: "UPDATE_CHAT_MESSAGES",
        payload: { used, variation, customSkus },
      });
    },
    [state.subscription.skuId, skuVariations, customSkus]
  );

  const updateCodeCompletions = useCallback(
    (used: number) => {
      const variation = skuVariations?.[state.subscription.skuId];
      dispatch({
        type: "UPDATE_CODE_COMPLETIONS",
        payload: { used, variation, customSkus },
      });
    },
    [state.subscription.skuId, skuVariations, customSkus]
  );

  const updateOverageBudget = useCallback(
    (budgetUsd: number | null) => {
      const variation = skuVariations?.[state.subscription.skuId];
      dispatch({
        type: "UPDATE_OVERAGE_BUDGET",
        payload: { budgetUsd, variation, customSkus },
      });
    },
    [state.subscription.skuId, skuVariations, customSkus]
  );

  const updateDaysIntoPeriod = useCallback(
    (days: number) => {
      const variation = skuVariations?.[state.subscription.skuId];
      dispatch({
        type: "UPDATE_DAYS_INTO_PERIOD",
        payload: { days, variation, customSkus },
      });
    },
    [state.subscription.skuId, skuVariations, customSkus]
  );

  const updateThresholdData = useCallback(
    (payload: {
      quotaThresholds: number[] | null;
      overageThresholds: number[];
      premiumLastCrossed: number | null;
      overageLastCrossed: number | null;
      lastCrossedThresholdMessage?: string;
    }) => {
      dispatch({ type: "UPDATE_THRESHOLD_DATA", payload });
    },
    []
  );

  const setState = useCallback((newState: UserState) => {
    dispatch({ type: "SET_STATE", payload: newState });
  }, []);

  const loadFromSimpleState = useCallback(
    (simpleState: SimpleUserState) => {
      const variation = skuVariations?.[simpleState.skuId];
      const newState = generateStateFromSimple(
        simpleState,
        variation,
        customSkus
      );
      dispatch({ type: "SET_STATE", payload: newState });
    },
    [skuVariations, customSkus]
  );

  return {
    state,
    updateSku,
    updateAccountType,
    updateAccountTypeAndSku,
    updateSeats,
    updatePremiumRequests,
    updateChatMessages,
    updateCodeCompletions,
    updateOverageBudget,
    updateDaysIntoPeriod,
    updateThresholdData,
    setState,
    loadFromSimpleState,
  };
}
