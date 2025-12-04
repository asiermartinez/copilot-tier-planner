"use client";

import { useState, useMemo } from "react";
import { ActionMenu, ActionList, Button } from "@primer/react";
import { TriangleDownIcon } from "@primer/octicons-react";
import type { SkuId } from "@/types/sku";
import {
  SKU_MAP,
  getAllSkus as getBuiltInSkus,
  getSimplifiedSkuName,
} from "@/data/skus";
import { useScenario } from "@/contexts";

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

export default function SkuSelector({
  value,
  accountType,
  onChange,
}: SkuSelectorProps) {
  const [open, setOpen] = useState(false);
  const { currentScenario } = useScenario();

  // Get all SKUs (built-in + custom)
  const allSkus = useMemo(() => {
    const builtIn = getBuiltInSkus();
    return [...builtIn, ...(currentScenario.customSkus || [])];
  }, [currentScenario.customSkus]);

  // Get available SKU IDs for the current account type
  const availableSkuIds = useMemo(() => {
    return allSkus
      .filter(sku => {
        if (accountType === "individual") {
          return sku.audience === "individual";
        } else {
          return (
            sku.audience === "organization" || sku.audience === "enterprise"
          );
        }
      })
      .map(sku => sku.id);
  }, [allSkus, accountType]);

  const currentSku = allSkus.find(s => s.id === value);
  const currentLabel = currentSku
    ? getSimplifiedSkuName(currentSku)
    : SKU_LABELS[value] || "Select SKU";

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
          {availableSkuIds.map(skuId => {
            const sku = allSkus.find(s => s.id === skuId);
            return (
              <ActionList.Item
                key={skuId}
                selected={value === skuId}
                onSelect={() => handleSelect(skuId)}
              >
                {sku
                  ? getSimplifiedSkuName(sku)
                  : SKU_MAP[skuId]?.name || skuId}
              </ActionList.Item>
            );
          })}
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
