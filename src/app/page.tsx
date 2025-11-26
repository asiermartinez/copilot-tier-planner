"use client";
import { useState } from "react";
import { MarkGithubIcon } from "@primer/octicons-react";

import AccountTypeSelector from "@/components/AccountTypeSelector";
import SkuSelector from "@/components/SkuSelector";
import ViewToggle from "@/components/ViewToggle";
import StatePayloadView from "@/components/StatePayloadView";
import UIMessagesView from "@/components/UIMessagesView";
import UsageControls from "@/components/UsageControls";
import ThresholdConfigurator from "@/components/ThresholdConfigurator";
import { usePlanner } from "@/contexts";
import styles from "./page.module.css";

type ViewToggleMode = "messages" | "payload";

type AccountType = "individual" | "organization" | "enterprise";

export default function RootPage() {
  const {
    userState,
    updateAccountTypeAndSku,
    thresholdsConfig,
    updateThresholdsConfig,
  } = usePlanner();
  const [viewMode, setViewMode] = useState<ViewToggleMode>("messages");

  const accountType = userState.account.accountType;
  const skuId = userState.subscription.skuId;

  // Update SKU when account type changes to ensure it's valid for new audience
  const handleAccountTypeChange = (newAccountType: AccountType) => {
    // Update both account type and SKU atomically to avoid race conditions
    if (newAccountType === "individual") {
      updateAccountTypeAndSku(newAccountType, "free");
    } else {
      // Both organization and enterprise can have Business or Enterprise
      // Default to Business for both
      updateAccountTypeAndSku(newAccountType, "business");
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          <MarkGithubIcon size={24} className={styles.titleIcon} />
          Copilot Tier Planner
        </h1>
        <div className={styles.headerControls}>
          <AccountTypeSelector
            value={accountType}
            onChange={handleAccountTypeChange}
          />
          <SkuSelector
            value={skuId}
            accountType={accountType}
            onChange={newSku => updateAccountTypeAndSku(accountType, newSku)}
          />
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <main className={styles.mainContent}>
        {/* Left Panel - State Controls */}
        <div className={styles.leftPanel}>
          <div className={styles.panelContent}>
            <UsageControls />
          </div>
        </div>

        {/* Center Panel - UI Messages & State Payload */}
        <div className={styles.centerPanel}>
          <div className={styles.panelContent}>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <div className={styles.viewContent}>
              {viewMode === "messages" ? (
                <UIMessagesView userState={userState} />
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
      </main>
    </div>
  );
}
