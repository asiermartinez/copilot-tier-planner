"use client";

import { IconButton } from "@primer/react";
import { DownloadIcon } from "@primer/octicons-react";
import styles from "./ExportButton.module.css";

interface ExportButtonProps {
  onClick: () => void;
  showBadge?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "invisible";
  ariaLabel?: string;
}

/**
 * Export button with optional notification badge
 *
 * Shows a blue dot badge when there are unsaved changes (showBadge=true)
 */
export default function ExportButton({
  onClick,
  showBadge = false,
  size = "medium",
  variant = "default",
  ariaLabel = "Export configuration",
}: ExportButtonProps) {
  return (
    <div className={styles.container}>
      <IconButton
        aria-label={ariaLabel}
        icon={DownloadIcon}
        onClick={onClick}
        variant={variant}
        size={size}
      />
      {showBadge && (
        <span className={styles.badge} aria-label="Unsaved changes" />
      )}
    </div>
  );
}
