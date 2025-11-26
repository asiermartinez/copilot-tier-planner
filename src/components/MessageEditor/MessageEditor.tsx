"use client";

import { useState, useEffect, useRef } from "react";
import MessageField from "@/components/MessageField";
import type { CustomMessages } from "@/types/messages/customMessages";
import { getDefaultMessages } from "@/utils/messages/defaultMessages";
import { usePlanner } from "@/contexts";
import { getThresholdIdForAlert } from "@/utils/alertFieldMapping";
import styles from "./MessageEditor.module.css";

interface MessageEditorProps {
  onMessagesChange?: (messages: CustomMessages) => void;
}

/**
 * MessageEditor Component
 *
 * Allows users to customize alert messages for testing.
 * Uses reusable MessageField components to reduce code duplication.
 */
export default function MessageEditor({
  onMessagesChange,
}: MessageEditorProps) {
  const { activeAlertId } = usePlanner();
  const [messages, setMessages] =
    useState<CustomMessages>(getDefaultMessages());

  // Refs for all message fields
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Focus and scroll to the threshold field corresponding to the active alert
  useEffect(() => {
    // TODO: Implement threshold field focusing once threshold configuration UI is built
    // For now, this is a placeholder for the threshold-based system
    // const thresholdId = getThresholdIdForAlert(activeAlertId);
  }, [activeAlertId]);

  // Notify parent of changes
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const updateMessage = <
    Category extends keyof CustomMessages,
    Field extends keyof CustomMessages[Category],
  >(
    category: Category,
    field: Field,
    value: string
  ) => {
    setMessages(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  return (
    <div className={styles.container}>
      {/* Block Reasons Section */}
      <div className={styles.section}>
        <div
          ref={el => {
            fieldRefs.current["blockReasons.quotaExceededNoOverages"] = el;
          }}
        >
          <MessageField
            label="Quota Exceeded (No Overages)"
            value={messages.blockReasons.quotaExceededNoOverages}
            onChange={value =>
              updateMessage("blockReasons", "quotaExceededNoOverages", value)
            }
            caption="Shown when FREE plan reaches quota limit"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["blockReasons.limitReached"] = el;
          }}
        >
          <MessageField
            label="Limit Reached"
            value={messages.blockReasons.limitReached}
            onChange={value =>
              updateMessage("blockReasons", "limitReached", value)
            }
            caption="Shown when quota reached without overage budget"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["blockReasons.budgetExhausted"] = el;
          }}
        >
          <MessageField
            label="Budget Exhausted"
            value={messages.blockReasons.budgetExhausted}
            onChange={value =>
              updateMessage("blockReasons", "budgetExhausted", value)
            }
            caption="Shown when overage budget is fully consumed"
          />
        </div>
      </div>

      {/* Quota Warnings Section */}
      <div className={styles.section}>
        <div
          ref={el => {
            fieldRefs.current["quotaWarnings.thresholdReached"] = el;
          }}
        >
          <MessageField
            label="Threshold Reached"
            value={messages.quotaWarnings.thresholdReached}
            onChange={value =>
              updateMessage("quotaWarnings", "thresholdReached", value)
            }
            caption="Use {percentage} as placeholder (e.g., 75%)"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["quotaWarnings.approachingLimit"] = el;
          }}
        >
          <MessageField
            label="Approaching Limit"
            value={messages.quotaWarnings.approachingLimit}
            onChange={value =>
              updateMessage("quotaWarnings", "approachingLimit", value)
            }
            caption="Use {current} and {limit} as placeholders"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["quotaWarnings.usingOverageBudget"] = el;
          }}
        >
          <MessageField
            label="Using Overage Budget"
            value={messages.quotaWarnings.usingOverageBudget}
            onChange={value =>
              updateMessage("quotaWarnings", "usingOverageBudget", value)
            }
            caption="Use {overage} as placeholder"
          />
        </div>
      </div>

      {/* Budget Warnings Section */}
      <div className={styles.section}>
        <div
          ref={el => {
            fieldRefs.current["budgetWarnings.thresholdReached"] = el;
          }}
        >
          <MessageField
            label="Threshold Reached"
            value={messages.budgetWarnings.thresholdReached}
            onChange={value =>
              updateMessage("budgetWarnings", "thresholdReached", value)
            }
            caption="Use {percentage} as placeholder"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["budgetWarnings.nearlyExhausted"] = el;
          }}
        >
          <MessageField
            label="Nearly Exhausted"
            value={messages.budgetWarnings.nearlyExhausted}
            onChange={value =>
              updateMessage("budgetWarnings", "nearlyExhausted", value)
            }
            caption="Use {remaining} as placeholder (e.g., $5.00)"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["budgetWarnings.exhausted"] = el;
          }}
        >
          <MessageField
            label="Exhausted"
            value={messages.budgetWarnings.exhausted}
            onChange={value =>
              updateMessage("budgetWarnings", "exhausted", value)
            }
            caption="Shown when budget is 100% consumed"
          />
        </div>
      </div>

      {/* Info Messages Section */}
      <div className={styles.section}>
        <div
          ref={el => {
            fieldRefs.current["infoMessages.noOverageBudget"] = el;
          }}
        >
          <MessageField
            label="No Overage Budget"
            value={messages.infoMessages.noOverageBudget}
            onChange={value =>
              updateMessage("infoMessages", "noOverageBudget", value)
            }
            caption="Suggestion to set up overage budget"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["infoMessages.trialActive"] = el;
          }}
        >
          <MessageField
            label="Trial Active"
            value={messages.infoMessages.trialActive}
            onChange={value =>
              updateMessage("infoMessages", "trialActive", value)
            }
            caption="Use {daysRemaining} as placeholder"
          />
        </div>
      </div>

      {/* CTA Messages Section */}
      <div className={styles.section}>
        <div
          ref={el => {
            fieldRefs.current["ctaMessages.setupOverageBudget"] = el;
          }}
        >
          <MessageField
            label="Setup Overage Budget"
            value={messages.ctaMessages.setupOverageBudget}
            onChange={value =>
              updateMessage("ctaMessages", "setupOverageBudget", value)
            }
            caption="Encourage users to set up overage budget"
          />
        </div>

        <div
          ref={el => {
            fieldRefs.current["ctaMessages.upgradeForMore"] = el;
          }}
        >
          <MessageField
            label="Upgrade for More"
            value={messages.ctaMessages.upgradeForMore}
            onChange={value =>
              updateMessage("ctaMessages", "upgradeForMore", value)
            }
            caption="Use {nextPlan} as placeholder"
          />
        </div>
      </div>
    </div>
  );
}
