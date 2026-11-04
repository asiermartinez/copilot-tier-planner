"use client";

import { useEffect, useRef, useState } from "react";
import { BranchName } from "@primer/react";
import { CheckIcon, CopyIcon } from "@primer/octicons-react";
import styles from "./ThresholdConfigurator.module.css";

interface CopyableVariableProps {
  /** Variable name without braces, e.g. "planName" */
  name: string;
}

/**
 * Template variable shown as a branch-name pill with a copy icon beside it.
 * Clicking either copies the variable, braces included, ready to paste into a
 * message.
 */
export default function CopyableVariable({ name }: CopyableVariableProps) {
  const variable = `{${name}}`;
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(variable);
      setCopied(true);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `Copied ${variable}` : `Copy ${variable}`}
      className={styles.copyableVariable}
      data-copied={copied || undefined}
    >
      <BranchName as="span">{variable}</BranchName>
      <Icon size={12} className={styles.copyableVariableIcon} />
    </button>
  );
}
