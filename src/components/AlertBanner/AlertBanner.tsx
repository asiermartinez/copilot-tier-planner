"use client";

import { Banner } from "@primer/react";
import { AlertSeverityLevel } from "@/data/alertThresholds";
import styles from "./AlertBanner.module.css";

type BannerVariant = "critical" | "info" | "success" | "upsell" | "warning";

export interface AlertBannerProps {
  /**
   * Alert severity level
   */
  severity: AlertSeverityLevel;
  /**
   * Alert message
   */
  message: string;
  /**
   * Primary action button
   */
  primaryAction?: React.ReactNode;
  /**
   * Secondary action button
   */
  secondaryAction?: React.ReactNode;
  /**
   * Dismiss handler (shows dismiss button if provided)
   */
  onDismiss?: () => void;
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Map alert severity levels to Primer Banner variants
 */
function severityToVariant(severity: AlertSeverityLevel): BannerVariant {
  switch (severity) {
    case AlertSeverityLevel.INFO:
      return "info";
    case AlertSeverityLevel.WARNING:
      return "warning";
    case AlertSeverityLevel.CRITICAL:
      return "warning"; // Primer doesn't have "critical", use warning
    case AlertSeverityLevel.EXCEEDED:
      return "critical";
    default:
      return "info";
  }
}

/**
 * AlertBanner Component
 *
 * Wraps Primer's Banner component with our alert severity levels
 * and provides consistent styling for all alerts in the application.
 */
export default function AlertBanner({
  severity,
  message,
  primaryAction,
  secondaryAction,
  onDismiss,
  className,
}: AlertBannerProps) {
  const variant = severityToVariant(severity);

  return (
    <Banner
      variant={variant}
      title={message}
      description={message}
      hideTitle
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      onDismiss={onDismiss}
      className={className ? `${styles.banner} ${className}` : styles.banner}
    />
  );
}
