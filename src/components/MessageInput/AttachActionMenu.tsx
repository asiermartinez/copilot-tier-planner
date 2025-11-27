"use client";

import { Button } from "@primer/react";
import { PlusIcon } from "@primer/octicons-react";

/**
 * AttachActionMenu Component (Placeholder)
 *
 * Provides functionality to add repositories, files, and spaces.
 * This is a placeholder implementation that can be expanded later.
 */
export default function AttachActionMenu() {
  const handleAddClick = () => {
    console.log(
      "Add repositories, files, and spaces - placeholder implementation"
    );
  };

  return (
    <Button
      variant="invisible"
      size="medium"
      leadingVisual={PlusIcon}
      onClick={handleAddClick}
      style={{ color: "var(--fgColor-muted)" }}
    >
      Add repositories, files, and spaces
    </Button>
  );
}
