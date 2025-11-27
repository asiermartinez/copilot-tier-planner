"use client";

import { IconButton } from "@primer/react";
import { ToolsIcon } from "@primer/octicons-react";

/**
 * ToolsSelectPanel Component (Placeholder)
 *
 * Provides tools selection functionality for the message input.
 * This is a placeholder implementation that can be expanded later.
 */
export default function ToolsSelectPanel() {
  const handleToolsClick = () => {
    console.log("Tools clicked - placeholder implementation");
  };

  return (
    <IconButton
      variant="invisible"
      icon={ToolsIcon}
      aria-label="Select tools"
      onClick={handleToolsClick}
    />
  );
}
