"use client";

import { SegmentedControl } from "@primer/react";

export type ViewMode = "messages" | "payload";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const VIEW_MODES: ViewMode[] = ["messages", "payload"];

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  const handleChange = (index: number) => {
    onChange(VIEW_MODES[index]);
  };

  return (
    <SegmentedControl
      aria-label="View mode"
      onChange={handleChange}
      size="small"
    >
      <SegmentedControl.Button selected={value === "messages"}>
        UI playground
      </SegmentedControl.Button>
      <SegmentedControl.Button selected={value === "payload"}>
        State
      </SegmentedControl.Button>
    </SegmentedControl>
  );
}
