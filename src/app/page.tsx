"use client";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MarkGithubIcon } from "@primer/octicons-react";
import { Button } from "@primer/react";

import PlanSelector from "@/components/PlanSelector";
import type { SkuId } from "@/types/sku";
import type { AccountType } from "@/types/userState";
import ViewToggle from "@/components/ViewToggle";
import StatePayloadView from "@/components/StatePayloadView";
import UIMessagesView from "@/components/UIMessagesView";
import UsageControls from "@/components/UsageControls";
import ThresholdConfigurator from "@/components/ThresholdConfigurator";
import MessageInput from "@/components/MessageInput";
import ModeToggle from "@/components/ModeToggle";
import { VisualBuilder } from "@/components/VisualBuilder";
import { usePlanner, useScenario } from "@/contexts";
import { usePageTitle } from "@/hooks/usePageTitle";
import styles from "./page.module.css";

type ViewToggleMode = "messages" | "payload";

export default function RootPage() {
  const {
    userState,
    updateAccountTypeAndSku,
    thresholdsConfig,
    updateThresholdsConfig,
    updatePremiumRequests,
    dismissedAlerts,
    clearDismissedAlerts,
  } = usePlanner();
  const { viewMode, currentScenario } = useScenario();

  // Track page title with dirty state indicator
  usePageTitle({
    baseTitle: "Copilot Tier Planner",
    scenario: currentScenario,
    thresholds: thresholdsConfig,
  });

  const [innerViewMode, setInnerViewMode] =
    useState<ViewToggleMode>("messages");

  const skuId = userState.subscription.skuId;

  // Handle plan change (updates both account type and SKU)
  const handlePlanChange = (newAccountType: AccountType, newSkuId: SkuId) => {
    updateAccountTypeAndSku(newAccountType, newSkuId);
  };

  // Use the isBlocked flag from userState (already calculated with proper logic)
  const isBlocked = userState.usage.premiumRequests.isBlocked;

  // Read the latest usage through a ref so handleSendMessage keeps a stable
  // identity and the memoized MessageInput doesn't re-render on every send.
  const latestRef = useRef({ userState, updatePremiumRequests });
  useLayoutEffect(() => {
    latestRef.current = { userState, updatePremiumRequests };
  });

  // Each sent message consumes one premium request.
  const handleSendMessage = useCallback((message: string) => {
    const { userState, updatePremiumRequests } = latestRef.current;
    if (userState.usage.premiumRequests.isBlocked) return;
    console.log("Message sent:", message);
    updatePremiumRequests(userState.usage.premiumRequests.current + 1);
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          <MarkGithubIcon size={24} className={styles.titleIcon} />
          Copilot Tier Planner
        </h1>
        <div style={{ marginLeft: "auto" }}>
          <ModeToggle />
        </div>
      </header>

      {/* Main Content - Conditional Layout based on view mode */}
      <main className={styles.mainContent}>
        {viewMode === "visual" ? (
          /* Visual Builder - Full Width */
          <div className={styles.visualContainer}>
            <VisualBuilder />
          </div>
        ) : (
          /* Messages View - Three Column Layout */
          <>
            {/* Left Panel - State Controls */}
            <div className={styles.leftPanel}>
              <div className={styles.panelContent}>
                <div style={{ marginBottom: "var(--base-size-24)" }}>
                  <PlanSelector skuId={skuId} onChange={handlePlanChange} />
                </div>
                <UsageControls />
              </div>
            </div>

            {/* Center Panel - UI Messages, Input & State Payload */}
            <div className={styles.centerPanel}>
              <div className={styles.panelContent}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ViewToggle
                    value={innerViewMode}
                    onChange={setInnerViewMode}
                  />
                  {dismissedAlerts.size > 0 && (
                    <Button
                      variant="invisible"
                      onClick={clearDismissedAlerts}
                      size="small"
                    >
                      Restore banner
                    </Button>
                  )}
                </div>
                <div className={styles.viewContent}>
                  {innerViewMode === "messages" ? (
                    <div className={styles.messagesContainer}>
                      {/* Banner Space - Shows alerts when present */}
                      <div style={{ minHeight: "60px" }}>
                        <UIMessagesView userState={userState} />
                      </div>

                      {/* Message Input - Always visible below banner */}
                      <div style={{ flexShrink: 0 }}>
                        <MessageInput
                          onSendMessage={handleSendMessage}
                          disabled={isBlocked}
                        />
                      </div>
                    </div>
                  ) : (
                    <StatePayloadView userState={userState} />
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Threshold Configurator */}
            <div className={styles.rightPanel}>
              <div className={styles.rightPanelContent}>
                <ThresholdConfigurator
                  config={thresholdsConfig}
                  onChange={updateThresholdsConfig}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
