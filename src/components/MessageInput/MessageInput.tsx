"use client";

import { Textarea, IconButton } from "@primer/react";
import { PaperAirplaneIcon } from "@primer/octicons-react";
import { useState, useRef, useLayoutEffect, memo } from "react";
import styles from "./MessageInput.module.css";

import AttachActionMenu from "./AttachActionMenu";
import ModelActionMenu from "./ModelActionMenuNext";
import ToolsSelectPanel from "./ToolsSelectPanel";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

/**
 * Chat input. The draft text and history live here (not in the page) so
 * typing only re-renders this component instead of the whole planner.
 */
function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaretToEnd = useRef(false);

  // Auto-size before paint so the box doesn't flicker while typing
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 300);
    textarea.style.height = `${newHeight}px`;

    if (pendingCaretToEnd.current) {
      pendingCaretToEnd.current = false;
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
    }
  }, [value]);

  const send = () => {
    const message = value.trim();
    if (!message || disabled) return;
    onSendMessage(message);
    setHistory(prev => [message, ...prev]);
    setHistoryIndex(-1);
    setValue("");
  };

  const recallHistory = (index: number) => {
    setHistoryIndex(index);
    setValue(index >= 0 ? history[index] : "");
    pendingCaretToEnd.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter while an IME composition is in progress
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === "ArrowUp") {
      // Only navigate history when the caret is at the start or the box is empty
      if (e.currentTarget.selectionStart === 0 || !value) {
        const nextIndex = Math.min(historyIndex + 1, history.length - 1);
        if (nextIndex >= 0 && nextIndex !== historyIndex) {
          e.preventDefault();
          recallHistory(nextIndex);
        }
      }
    } else if (e.key === "ArrowDown" && historyIndex > -1) {
      e.preventDefault();
      recallHistory(historyIndex - 1);
    }
  };

  const disabledWrapperStyle = {
    pointerEvents: disabled ? "none" : "auto",
    opacity: disabled ? 0.6 : 1,
  } as const;

  return (
    <div className={`${styles.container} ${isFocused ? styles.focused : ""}`}>
      <div className={styles.inputWrapper}>
        <Textarea
          placeholder="Ask anything"
          resize="none"
          rows={1}
          block
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          ref={textareaRef}
          disabled={disabled}
          className={styles.textarea}
        />
      </div>
      <div className={styles.actionsContainer}>
        <div style={disabledWrapperStyle}>
          <AttachActionMenu />
        </div>
        <div className={styles.actionsWrapper}>
          <div style={disabledWrapperStyle}>
            <ModelActionMenu />
          </div>
          <div className={styles.toolsContainer}>
            <div style={disabledWrapperStyle}>
              <ToolsSelectPanel />
            </div>
            <IconButton
              variant="invisible"
              icon={PaperAirplaneIcon}
              aria-label="Send now"
              disabled={disabled || !value.trim()}
              onClick={send}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MessageInput);
