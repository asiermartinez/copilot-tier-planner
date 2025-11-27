"use client";

import { Textarea, IconButton } from "@primer/react";
import { PaperAirplaneIcon } from "@primer/octicons-react";
import { useState, useRef, useEffect } from "react";
import styles from "./MessageInput.module.css";

import AttachActionMenu from "./AttachActionMenu";
// import ModelSelectPanel from "./ModelSelectPanel";
// import ModelActionMenu from "./ModelActionMenu";
import ModelActionMenu from "./ModelActionMenuNext";
import ToolsSelectPanel from "./ToolsSelectPanel";

interface MessageInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSendMessage: () => void;
  loading: boolean;
  disabled?: boolean;
  history: string[];
  currentHistoryIndex: number;
  onHistoryIndexChange: (index: number) => void;
}

export default function MessageInput({
  value,
  onValueChange,
  onSendMessage,
  loading,
  disabled = false,
  history,
  currentHistoryIndex,
  onHistoryIndexChange,
}: MessageInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getPlaceholderText = () => {
    return "Ask anything";
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 300);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && isFocused) {
      e.preventDefault();
      onSendMessage();
    } else if (e.key === "ArrowUp" && isFocused) {
      // Only navigate history when cursor is at the beginning of the text or textarea is empty
      const textarea = e.currentTarget;
      if (textarea.selectionStart === 0 || !value) {
        e.preventDefault();
        const nextIndex = Math.min(currentHistoryIndex + 1, history.length - 1);
        if (nextIndex >= 0 && history[nextIndex]) {
          onValueChange(history[nextIndex]);
          onHistoryIndexChange(nextIndex);

          // Move cursor to end of text after setting value
          setTimeout(() => {
            if (textareaRef.current) {
              const length = textareaRef.current.value.length;
              textareaRef.current.selectionStart = length;
              textareaRef.current.selectionEnd = length;
            }
          }, 0);
        }
      }
    } else if (e.key === "ArrowDown" && isFocused && currentHistoryIndex > -1) {
      e.preventDefault();
      const nextIndex = currentHistoryIndex - 1;
      if (nextIndex >= 0) {
        onValueChange(history[nextIndex]);
      } else {
        onValueChange("");
      }
      onHistoryIndexChange(nextIndex);
    }
  };

  return (
    <div className={`${styles.container} ${isFocused ? styles.focused : ""}`}>
      <div className={styles.inputWrapper}>
        <Textarea
          placeholder={getPlaceholderText()}
          resize="none"
          rows={1}
          block
          value={value}
          onChange={e => !disabled && onValueChange(e.target.value)}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={disabled ? undefined : handleKeyDown}
          ref={textareaRef}
          disabled={disabled}
          className={styles.textarea}
        />
      </div>
      <div className={styles.actionsContainer}>
        <div
          style={{
            pointerEvents: disabled ? "none" : "auto",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <AttachActionMenu />
        </div>
        <div className={styles.actionsWrapper}>
          <div
            style={{
              pointerEvents: disabled ? "none" : "auto",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <ModelActionMenu />
          </div>
          <div className={styles.toolsContainer}>
            <div
              style={{
                pointerEvents: disabled ? "none" : "auto",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <ToolsSelectPanel />
            </div>
            <IconButton
              variant="invisible"
              icon={PaperAirplaneIcon}
              aria-label="Send now"
              disabled={disabled || !value.trim() || loading}
              onClick={onSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
