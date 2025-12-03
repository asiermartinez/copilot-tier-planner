"use client";

import { ActionMenu, ActionList, Button } from "@primer/react";
import { TriangleDownIcon, DotFillIcon } from "@primer/octicons-react";
import type { SkuId } from "@/types/sku";
import { SKU_MAP } from "@/data/skus";
import { useScenario } from "@/contexts";

type AccountType = "individual" | "organization" | "enterprise";

interface PlanSelectorProps {
  skuId: SkuId;
  onChange: (accountType: AccountType, skuId: SkuId) => void;
}

const INDIVIDUAL_PLANS: Array<{ skuId: SkuId; label: string }> = [
  { skuId: "free", label: "Free" },
  { skuId: "pro-trial", label: "Pro (Trial)" },
  { skuId: "pro", label: "Pro" },
  { skuId: "pro-plus", label: "Pro+" },
];

const ORGANIZATION_PLANS: Array<{ skuId: SkuId; label: string }> = [
  { skuId: "business", label: "Business" },
  { skuId: "enterprise", label: "Enterprise" },
];

export default function PlanSelector({ skuId, onChange }: PlanSelectorProps) {
  const { currentScenario } = useScenario();
  const currentLabel = SKU_MAP[skuId].name;
  const isCurrentModified =
    currentScenario.skuVariations?.[skuId] &&
    Object.keys(currentScenario.skuVariations[skuId]).length > 0;

  const handleSelect = (newSkuId: SkuId) => {
    // Determine account type based on selected SKU
    let newAccountType: AccountType;
    if (["free", "pro", "pro-trial", "pro-plus"].includes(newSkuId)) {
      newAccountType = "individual";
    } else if (newSkuId === "business") {
      newAccountType = "organization";
    } else {
      // enterprise SKU
      newAccountType = "enterprise";
    }

    onChange(newAccountType, newSkuId);
  };

  return (
    <ActionMenu>
      <ActionMenu.Anchor>
        <Button trailingAction={TriangleDownIcon} block>
          <span
            style={{
              color: "var(--fgColor-muted)",
              display: "inline-block",
            }}
          >
            Plan:
          </span>{" "}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {currentLabel}
            {isCurrentModified && (
              <DotFillIcon size={16} fill="var(--bgColor-accent-emphasis)" />
            )}
          </span>
        </Button>
      </ActionMenu.Anchor>
      <ActionMenu.Overlay align="end">
        <ActionList>
          <ActionList.Group title="Individual" selectionVariant="single">
            {INDIVIDUAL_PLANS.map(plan => {
              const variation = currentScenario.skuVariations?.[plan.skuId];
              const isModified = variation && Object.keys(variation).length > 0;
              return (
                <ActionList.Item
                  key={plan.skuId}
                  selected={skuId === plan.skuId}
                  onSelect={() => handleSelect(plan.skuId)}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span>{plan.label}</span>
                    {isModified && (
                      <DotFillIcon
                        size={12}
                        fill="var(--bgColor-accent-emphasis)"
                      />
                    )}
                  </span>
                </ActionList.Item>
              );
            })}
          </ActionList.Group>
          <ActionList.Divider />
          <ActionList.Group
            title="Organization and enterprise"
            selectionVariant="single"
          >
            {ORGANIZATION_PLANS.map(plan => {
              const variation = currentScenario.skuVariations?.[plan.skuId];
              const isModified = variation && Object.keys(variation).length > 0;
              return (
                <ActionList.Item
                  key={plan.skuId}
                  selected={skuId === plan.skuId}
                  onSelect={() => handleSelect(plan.skuId)}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span>{plan.label}</span>
                    {isModified && (
                      <DotFillIcon
                        size={12}
                        fill="var(--bgColor-accent-emphasis)"
                      />
                    )}
                  </span>
                </ActionList.Item>
              );
            })}
          </ActionList.Group>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}
