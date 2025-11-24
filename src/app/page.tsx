"use client";
import { useState } from "react";

import AccountTypeSelector from "@/components/AccountTypeSelector";
import SkuSelector from "@/components/SkuSelector";
import ViewToggle, { type ViewMode } from "@/components/ViewToggle";
import StatePayloadView from "@/components/StatePayloadView";
import UIMessagesView from "@/components/UIMessagesView";
import { usePlanner } from "@/contexts";
import styles from "./page.module.css";

type AccountType = "individual" | "organization" | "enterprise";

export default function RootPage() {
  const { userState, updateAccountTypeAndSku } = usePlanner();
  const [viewMode, setViewMode] = useState<ViewMode>("payload");

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
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1 className={styles.title}>SKU Planner</h1>
            <p className={styles.subtitle}>
              GitHub Copilot tier simulation and UI messaging playground
            </p>
          </div>
          <div className={styles.headerActions}>
            {/* Help button placeholder */}
            <button className={styles.helpButton}>?</button>
          </div>
        </div>
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

      {/* Main Content - Side by Side */}
      <main className={styles.mainContent}>
        {/* Left Panel - Controls */}
        <div className={styles.leftPanel}>
          <div className={styles.panelContent}>
            <h2 className={styles.panelTitle}>Controls</h2>
            <p>Interactive controls will go here</p>
          </div>
        </div>

        {/* Right Panel - Visualization */}
        <div className={styles.rightPanel}>
          <div className={styles.panelContent}>
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <div className={styles.viewContent}>
              {viewMode === "payload" ? (
                <StatePayloadView userState={userState} />
              ) : (
                <UIMessagesView userState={userState} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
