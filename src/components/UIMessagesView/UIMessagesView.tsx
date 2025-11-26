"use client";

import { useEffect } from "react";
import type { UserState } from "@/types/userState";
import AlertBanner from "@/components/AlertBanner";
import { generateAlerts } from "@/utils/alerts/generateAlerts";
import { usePlanner } from "@/contexts";
import styles from "./UIMessagesView.module.css";

interface UIMessagesViewProps {
  userState: UserState;
}

export default function UIMessagesView({ userState }: UIMessagesViewProps) {
  const { customMessages, customThresholds, setActiveAlertId } = usePlanner();
  const alerts = generateAlerts(userState, customMessages, customThresholds);
  const alert = alerts[0]; // Only show the highest priority alert

  // Update active alert ID whenever the displayed alert changes
  useEffect(() => {
    setActiveAlertId(alert?.id ?? null);
  }, [alert?.id, setActiveAlertId]);

  return (
    <div className={styles.container}>
      {!alert ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            No alerts or messages at this time. Your usage is within normal
            limits.
          </p>
        </div>
      ) : (
        <AlertBanner severity={alert.severity} message={alert.message} />
      )}
    </div>
  );
}
