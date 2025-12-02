"use client";

import { useState } from "react";
import { ActionMenu, ActionList, Button } from "@primer/react";
import { TriangleDownIcon } from "@primer/octicons-react";
import type { SkuId } from "@/types/sku";
import { SKU_MAP } from "@/data/skus";

type AccountType = "individual" | "organization" | "enterprise";

interface SkuSelectorProps {
  value: SkuId;
  accountType: AccountType;
  onChange: (skuId: SkuId) => void;
}

const SKU_LABELS: Record<SkuId, string> = {
  free: "Free",
  pro: "Pro",
  "pro-trial": "Pro (Trial)",
  "pro-plus": "Pro+",
  business: "Business",
  enterprise: "Enterprise",
};

// Get available SKU IDs based on account type
function getAvailableSkuIds(accountType: AccountType): SkuId[] {
  if (accountType === "individual") {
    return ["free", "pro-trial", "pro", "pro-plus"];
  } else if (accountType === "organization") {
    // Organizations can have Business or Enterprise
    return ["business", "enterprise"];
  } else {
    // Enterprises can also have Business or Enterprise
    return ["business", "enterprise"];
  }
}

export default function SkuSelector({
  value,
  accountType,
  onChange,
}: SkuSelectorProps) {
  const [open, setOpen] = useState(false);

  // Get available SKU IDs for the current account type
  const availableSkuIds = getAvailableSkuIds(accountType);

  const currentLabel = SKU_LABELS[value] || "Select SKU";

  const handleSelect = (newValue: SkuId) => {
    setOpen(false);
    onChange(newValue);
  };

  return (
    <ActionMenu open={open} onOpenChange={setOpen}>
      <ActionMenu.Anchor>
        <Button trailingAction={TriangleDownIcon}>
          <span
            style={{
              color: "var(--fgColor-muted)",
              display: "inline-block",
            }}
          >
            Base tier:
          </span>{" "}
          {currentLabel}
        </Button>
      </ActionMenu.Anchor>
      <ActionMenu.Overlay align="end">
        <ActionList selectionVariant="single">
          {availableSkuIds.map(skuId => (
            <ActionList.Item
              key={skuId}
              selected={value === skuId}
              onSelect={() => handleSelect(skuId)}
            >
              {SKU_MAP[skuId].name}
            </ActionList.Item>
          ))}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
