import { useEffect, useRef } from "react";
import type { SimpleUserState } from "@/types/userState";

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
 * Custom hook to manage URL state synchronization
 * Reads initial state from URL and debounces updates to URL
 */
export function useUrlState() {
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Read initial state from URL parameter
   */
  const readFromUrl = (): SimpleUserState | null => {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("state");
    if (encoded) {
      return decodeStateFromUrl(encoded);
    }
    return null;
  };

  /**
   * Update URL with new state (debounced)
   */
  const updateUrl = (state: SimpleUserState) => {
    if (typeof window === "undefined") return;

    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set a new timeout to update URL after 500ms of inactivity
    updateTimeoutRef.current = setTimeout(() => {
      const encoded = encodeStateToUrl(state);
      const params = new URLSearchParams(window.location.search);
      params.set("state", encoded);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }, 500);
  };

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    readFromUrl,
    updateUrl,
  };
}
