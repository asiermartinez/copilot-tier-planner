"use client";

import { useState } from "react";
import { IconButton } from "@primer/react";
import { CopyIcon, CheckIcon } from "@primer/octicons-react";
import type { UserState } from "@/types/userState";
import styles from "./StatePayloadView.module.css";

interface StatePayloadViewProps {
  userState: UserState;
}

export default function StatePayloadView({ userState }: StatePayloadViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const json = JSON.stringify(userState, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formattedJson = JSON.stringify(userState, null, 2);

  return (
    <div className={styles.container}>
      <div className={styles.jsonContainer}>
        <IconButton
          aria-label={copied ? "Copied" : "Copy JSON"}
          icon={copied ? CheckIcon : CopyIcon}
          onClick={handleCopy}
          className={styles.copyButton}
          variant="invisible"
        />
        <pre className={styles.jsonPre}>
          <code className={styles.jsonCode}>{formattedJson}</code>
        </pre>
      </div>
    </div>
  );
}
