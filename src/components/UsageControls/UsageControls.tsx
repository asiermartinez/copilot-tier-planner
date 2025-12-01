"use client";

import { FormControl, Stack, TextInput, ToggleSwitch } from "@primer/react";
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
 * - Billing period (days into period)
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
    updateOverageBudget,
    updateDaysIntoPeriod,
    getSimpleState,
    loadFromSimpleState,
  } = usePlanner();

  const currentSku = SKU_MAP[userState.subscription.skuId];
  const usage = userState.usage;
  const overageBudget = userState.overageBudget;
  const overagesEnabled = overageBudget !== null;
  const supportsOverages =
    currentSku.limits.premiumRequestsOveragePolicy?.allowBudgetCap ?? false;

  // Billing period info
  const billingPeriod = userState.billingPeriod;
  const daysIntoPeriod =
    billingPeriod.daysInPeriod - billingPeriod.daysRemaining;
  const totalDays = billingPeriod.daysInPeriod;

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

  // Calculate additional premium requests based on budget
  const calculateAdditionalRequests = (budgetUsd: number): number => {
    const pricePerRequest =
      currentSku.limits.premiumRequestsOveragePolicy?.pricePerUnit ?? 0;
    if (pricePerRequest === 0) return 0;
    return Math.floor(budgetUsd / pricePerRequest);
  };

  const additionalRequests = overageBudget
    ? calculateAdditionalRequests(overageBudget.maxBudgetUsd)
    : 0;

  // Determine max slider values from plan limits
  // When overages are enabled, allow going beyond the plan limit
  const planPremiumRequestsLimit =
    currentSku.limits.premiumRequestsPerMonth ?? 1000;
  const premiumRequestsMax = overagesEnabled
    ? planPremiumRequestsLimit + additionalRequests // Plan quota + additional requests from budget
    : planPremiumRequestsLimit;

  const chatMessagesMax = currentSku.limits.chatMessagesPerMonth ?? 10000;

  const codeCompletionsMax =
    currentSku.limits.codeCompletionsPerMonth ?? 100000;

  // Handle overage toggle
  const handleOverageToggle = () => {
    if (!overagesEnabled) {
      // Enable overages with default budget of $10
      updateOverageBudget(10);
    } else {
      // Disable overages and cap premium requests if needed (in one state update)
      const simpleState = getSimpleState();
      simpleState.overageBudgetUsd = null;
      if (simpleState.premiumRequestsUsed > planPremiumRequestsLimit) {
        simpleState.premiumRequestsUsed = planPremiumRequestsLimit;
      }
      loadFromSimpleState(simpleState);
    }
  };

  // Handle budget input change
  const handleBudgetChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      updateOverageBudget(1); // Minimum budget of $1
    } else {
      updateOverageBudget(Math.max(1, numValue));
    }
  };

  return (
    <div className={styles.container}>
      <Stack direction="vertical" gap="normal">
        {/* Premium Requests Slider */}
        <FormControl className={styles.formControl}>
          <FormControl.Label>Premium requests</FormControl.Label>
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
            <div className={styles.numberInput}>
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
                aria-label="Premium requests usage value"
              />
            </div>
          </div>
          <FormControl.Caption>
            {currentSku.limits.premiumRequestsPerMonth
              ? `Plan quota: ${currentSku.limits.premiumRequestsPerMonth.toLocaleString()} per month${overagesEnabled ? " (overages enabled)" : ""}`
              : "Unlimited quota"}
          </FormControl.Caption>
        </FormControl>

        {/* Overage Budget Configuration */}
        {supportsOverages && (
          <>
            <FormControl className={styles.formControl}>
              <FormControl.Label visuallyHidden>
                Enable overage budget
              </FormControl.Label>
              <div className={styles.toggleContainer}>
                <span className={styles.toggleLabel} id="overage-budget-label">
                  Enable overage budget
                </span>
                <ToggleSwitch
                  size="small"
                  checked={overagesEnabled}
                  onClick={handleOverageToggle}
                  aria-labelledby="overage-budget-label"
                />
              </div>
            </FormControl>
            {overagesEnabled && (
              <FormControl className={styles.formControl}>
                <FormControl.Label>Budget in USD</FormControl.Label>
                <div className={styles.numberInput}>
                  <TextInput
                    type="number"
                    min={1}
                    step="0.01"
                    value={overageBudget?.maxBudgetUsd ?? 10}
                    onChange={e => handleBudgetChange(e.target.value)}
                    aria-label="Maximum overage budget in USD"
                    leadingVisual="$"
                  />
                </div>
                <FormControl.Caption>
                  Maximum amount to spend on premium request overages per month
                  {additionalRequests > 0 &&
                    ` (up to ${additionalRequests.toLocaleString()} additional requests)`}
                </FormControl.Caption>
              </FormControl>
            )}
          </>
        )}

        {/* Chat Messages Slider */}
        <FormControl className={styles.formControl}>
          <FormControl.Label>Chat messages</FormControl.Label>
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
            <div className={styles.numberInput}>
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
                disabled={currentSku.limits.chatMessagesPerMonth === null}
                aria-label="Chat messages usage value"
              />
            </div>
          </div>
          <FormControl.Caption>
            {currentSku.limits.chatMessagesPerMonth
              ? `Quota: ${currentSku.limits.chatMessagesPerMonth.toLocaleString()} per month`
              : "Unlimited quota"}
          </FormControl.Caption>
        </FormControl>

        {/* Code Completions Slider */}
        <FormControl className={styles.formControl}>
          <FormControl.Label>Code completions</FormControl.Label>
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
            <div className={styles.numberInput}>
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
                disabled={currentSku.limits.codeCompletionsPerMonth === null}
                aria-label="Code completions usage value"
              />
            </div>
          </div>
          <FormControl.Caption>
            {currentSku.limits.codeCompletionsPerMonth
              ? `Quota: ${currentSku.limits.codeCompletionsPerMonth.toLocaleString()} per month`
              : "Unlimited quota"}
          </FormControl.Caption>
        </FormControl>

        {/* Billing Period Controls */}
        <div className={styles.billingPeriodSection}>
          <FormControl className={styles.formControl}>
            <FormControl.Label>Billing period</FormControl.Label>
            <div className={styles.sliderInputContainer}>
              <input
                type="range"
                min="0"
                max={totalDays}
                value={daysIntoPeriod}
                onChange={e => updateDaysIntoPeriod(Number(e.target.value))}
                className={styles.slider}
                aria-label="Days into billing period slider"
              />
              <div className={styles.numberInput}>
                <TextInput
                  type="number"
                  min={0}
                  max={totalDays}
                  value={daysIntoPeriod}
                  onChange={e =>
                    handleNumberInput(
                      e.target.value,
                      totalDays,
                      updateDaysIntoPeriod
                    )
                  }
                  aria-label="Days into billing period value"
                />
              </div>
            </div>
            <FormControl.Caption>
              {daysIntoPeriod} {daysIntoPeriod === 1 ? "day" : "days"} into
              period, {billingPeriod.daysRemaining}{" "}
              {billingPeriod.daysRemaining === 1 ? "day" : "days"} remaining (
              {totalDays} {totalDays === 1 ? "day" : "days"} total)
            </FormControl.Caption>
          </FormControl>
        </div>
      </Stack>
    </div>
  );
}
