"use client";

import { Button } from "@primer/react";
import { TriangleDownIcon } from "@primer/octicons-react";

/**
 * ModelActionMenuNext Component (Placeholder)
 *
 * Provides model selection functionality for the message input.
 * This is a placeholder implementation that can be expanded later.
 */
export default function ModelActionMenuNext() {
  const handleModelClick = () => {
    console.log("Model menu clicked - placeholder implementation");
  };

  return (
    <div style={{ marginRight: "var(--base-size-8)" }}>
      <Button
        variant="invisible"
        size="medium"
        trailingVisual={TriangleDownIcon}
        onClick={handleModelClick}
        style={{ color: "var(--fgColor-muted)" }}
      >
        GPT-5.1
      </Button>
    </div>
  );
}
