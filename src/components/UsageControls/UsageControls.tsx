"use client";

import { FormControl, Heading, Stack, TextInput } from "@primer/react";
import { usePlanner } from "@/contexts";
import { SKU_MAP } from "@/data/skus";
import styles from "./UsageControls.module.css";

/**
 * UsageControls component
 *
 * Provides interactive sliders to adjust usage for:
 * - Premium requests
 * - Chat messages
 * - Code completions
 *
 * Sliders are dynamically configured based on the current SKU's limits.
 * Shows current usage value and percentage of quota used.
 * Includes number inputs for manual entry.
 */
export default function UsageControls() {
  const {
    userState,
    updatePremiumRequests,
    updateChatMessages,
    updateCodeCompletions,
  } = usePlanner();

  const currentSku = SKU_MAP[userState.subscription.skuId];
  const usage = userState.usage;

  // Helper to handle number input changes with validation
  const handleNumberInput = (
    value: string,
    max: number,
    updateFn: (value: number) => void
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      updateFn(0);
    } else {
      updateFn(Math.min(Math.max(0, numValue), max));
    }
  };

  // Determine max slider values from plan limits
  // (Overage blocking will be controlled by budget toggle in the future)

  const premiumRequestsMax = currentSku.limits.premiumRequestsPerMonth ?? 1000;

  const chatMessagesMax = currentSku.limits.chatMessagesPerMonth ?? 10000;

  const codeCompletionsMax =
    currentSku.limits.codeCompletionsPerMonth ?? 100000;

  return (
    <div className={styles.container}>
      <Stack direction="vertical" gap="normal">
        <Heading as="h3" className={styles.heading}>
          Usage Controls
        </Heading>

        {/* Premium Requests Slider */}
        <FormControl>
          <FormControl.Label>Premium Requests</FormControl.Label>
          <div className={styles.sliderInputContainer}>
            <input
              type="range"
              min="0"
              max={premiumRequestsMax}
              value={usage.premiumRequests.current}
              onChange={e => updatePremiumRequests(Number(e.target.value))}
              className={styles.slider}
              aria-label="Premium requests usage slider"
            />
            <TextInput
              type="number"
              min={0}
              max={premiumRequestsMax}
              value={usage.premiumRequests.current}
              onChange={e =>
                handleNumberInput(
                  e.target.value,
                  premiumRequestsMax,
                  updatePremiumRequests
                )
              }
              className={styles.numberInput}
              aria-label="Premium requests usage value"
            />
          </div>
          <FormControl.Caption>
            {currentSku.limits.premiumRequestsPerMonth
              ? `Quota: ${currentSku.limits.premiumRequestsPerMonth.toLocaleString()} per month`
              : "Unlimited quota"}
          </FormControl.Caption>
        </FormControl>

        {/* Chat Messages Slider */}
        <FormControl>
          <FormControl.Label>Chat Messages</FormControl.Label>
          <div className={styles.sliderInputContainer}>
            <input
              type="range"
              min="0"
              max={chatMessagesMax}
              value={usage.chatMessages.current}
              onChange={e => updateChatMessages(Number(e.target.value))}
              className={styles.slider}
              disabled={currentSku.limits.chatMessagesPerMonth === null}
              aria-label="Chat messages usage slider"
            />
            <TextInput
              type="number"
              min={0}
              max={chatMessagesMax}
              value={usage.chatMessages.current}
              onChange={e =>
                handleNumberInput(
                  e.target.value,
                  chatMessagesMax,
                  updateChatMessages
                )
              }
              className={styles.numberInput}
              disabled={currentSku.limits.chatMessagesPerMonth === null}
              aria-label="Chat messages usage value"
            />
          </div>
          <FormControl.Caption>
            {currentSku.limits.chatMessagesPerMonth
              ? `Quota: ${currentSku.limits.chatMessagesPerMonth.toLocaleString()} per month`
              : "Unlimited quota"}
          </FormControl.Caption>
        </FormControl>

        {/* Code Completions Slider */}
        <FormControl>
          <FormControl.Label>Code Completions</FormControl.Label>
          <div className={styles.sliderInputContainer}>
            <input
              type="range"
              min="0"
              max={codeCompletionsMax}
              value={usage.codeCompletions.current}
              onChange={e => updateCodeCompletions(Number(e.target.value))}
              className={styles.slider}
              disabled={currentSku.limits.codeCompletionsPerMonth === null}
              aria-label="Code completions usage slider"
            />
            <TextInput
              type="number"
              min={0}
              max={codeCompletionsMax}
              value={usage.codeCompletions.current}
              onChange={e =>
                handleNumberInput(
                  e.target.value,
                  codeCompletionsMax,
                  updateCodeCompletions
                )
              }
              className={styles.numberInput}
              disabled={currentSku.limits.codeCompletionsPerMonth === null}
              aria-label="Code completions usage value"
            />
          </div>
          <FormControl.Caption>
            {currentSku.limits.codeCompletionsPerMonth
              ? `Quota: ${currentSku.limits.codeCompletionsPerMonth.toLocaleString()} per month`
              : "Unlimited quota"}
          </FormControl.Caption>
        </FormControl>
      </Stack>
    </div>
  );
}
