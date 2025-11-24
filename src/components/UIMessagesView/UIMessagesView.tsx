"use client";

import type { UserState } from "@/types/userState";
import styles from "./UIMessagesView.module.css";

interface UIMessagesViewProps {
  userState: UserState;
}

export default function UIMessagesView({ userState }: UIMessagesViewProps) {
  return (
    <div className={styles.container}>
      <p className={styles.placeholder}>
        Dynamic UI messages will appear here based on your current state (quota
        warnings, upgrade CTAs, budget alerts, etc.)
      </p>
      <div className={styles.info}>
        <p>
          <strong>Current SKU:</strong> {userState.subscription.skuId}
        </p>
        <p>
          <strong>Account Type:</strong> {userState.account.accountType}
        </p>
      </div>
    </div>
  );
}
