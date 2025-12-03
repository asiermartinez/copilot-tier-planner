"use client";

import { SegmentedControl } from "@primer/react";
import { useScenario } from "@/contexts";
import type { ViewMode } from "@/types/scenario";

const VIEW_MODES: ViewMode[] = ["messages", "visual"];

export default function ModeToggle() {
  const { viewMode, setViewMode } = useScenario();

  const handleChange = (index: number) => {
    setViewMode(VIEW_MODES[index]);
  };

  return (
    <SegmentedControl
      aria-label="View mode"
      onChange={handleChange}
      size="small"
    >
      <SegmentedControl.Button selected={viewMode === "messages"}>
        Threshold builder
      </SegmentedControl.Button>
      <SegmentedControl.Button selected={viewMode === "visual"}>
        Plan builder
      </SegmentedControl.Button>
    </SegmentedControl>
  );
}
