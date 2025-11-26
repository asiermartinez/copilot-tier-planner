"use client";

import { Banner } from "@primer/react";
import styles from "./AlertBanner.module.css";

type BannerVariant = "critical" | "info" | "success" | "upsell" | "warning";

export interface AlertBannerProps {
  /**
   * Alert severity level (Primer Banner variant)
   */
  severity: BannerVariant;
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
  return (
    <Banner
      variant={severity}
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
