"use client";

import { useEffect } from "react";
import { Button } from "@primer/react";
import type { UserState } from "@/types/userState";
import AlertBanner from "@/components/AlertBanner";
import { getHighestPriorityAlert } from "@/utils/alerts/generateThresholdAlerts";
import { usePlanner } from "@/contexts";
import styles from "./UIMessagesView.module.css";

interface UIMessagesViewProps {
  userState: UserState;
}

export default function UIMessagesView({ userState }: UIMessagesViewProps) {
  const { thresholdsConfig, setActiveAlertId, dismissedAlerts, dismissAlert } =
    usePlanner();
  const alert = getHighestPriorityAlert(userState, thresholdsConfig);

  // Filter out dismissed alerts
  const visibleAlert = alert && !dismissedAlerts.has(alert.id) ? alert : null;

  // Update active alert ID whenever the displayed alert changes
  useEffect(() => {
    setActiveAlertId(visibleAlert?.id ?? null);
  }, [visibleAlert?.id, setActiveAlertId]);

  const handleDismiss = () => {
    if (visibleAlert) {
      dismissAlert(visibleAlert.id);
    }
  };

  const handleCta = () => {
    // TODO: Implement CTA action
    console.log("CTA clicked:", visibleAlert?.cta?.label);
  };

  return (
    <div className={styles.container}>
      {visibleAlert && (
        <AlertBanner
          severity={visibleAlert.severity}
          message={visibleAlert.message}
          onDismiss={visibleAlert.dismissable ? handleDismiss : undefined}
          primaryAction={
            visibleAlert.cta ? (
              <Button onClick={handleCta}>{visibleAlert.cta.label}</Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
