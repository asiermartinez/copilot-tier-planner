"use client";

import { ActionMenu, ActionList, Button } from "@primer/react";
import { TriangleDownIcon, DotFillIcon } from "@primer/octicons-react";
import type { SkuId } from "@/types/sku";
import {
  getAllSkus as getBuiltInSkus,
  getSimplifiedSkuName,
  getSkusByAudienceSortedByPrice,
} from "@/data/skus";
import { useScenario } from "@/contexts";
import { useMemo } from "react";

type AccountType = "individual" | "organization" | "enterprise";

interface PlanSelectorProps {
  skuId: SkuId;
  onChange: (accountType: AccountType, skuId: SkuId) => void;
}

export default function PlanSelector({ skuId, onChange }: PlanSelectorProps) {
  const { currentScenario } = useScenario();

  // Get all SKUs (built-in + custom)
  const allSkus = useMemo(() => {
    const builtIn = getBuiltInSkus();
    return [...builtIn, ...(currentScenario.customSkus || [])];
  }, [currentScenario.customSkus]);

  // Build plan groups sorted by price (cheapest to most expensive)
  const individualPlans = useMemo(() => {
    const builtInIndividuals = getSkusByAudienceSortedByPrice("individual");
    const customIndividuals = (currentScenario.customSkus || []).filter(
      sku => sku.audience === "individual"
    );

    // Combine and sort all individuals by price
    const allIndividuals = [...builtInIndividuals, ...customIndividuals].sort(
      (a, b) => {
        const priceDiff = a.pricing.monthlyUsd - b.pricing.monthlyUsd;
        if (priceDiff !== 0) return priceDiff;
        return a.tier - b.tier;
      }
    );

    return allIndividuals.map(sku => ({
      skuId: sku.id,
      label: getSimplifiedSkuName(sku),
    }));
  }, [currentScenario.customSkus]);

  const organizationPlans = useMemo(() => {
    const builtInOrgs = getSkusByAudienceSortedByPrice("organization");
    const builtInEnterprises = getSkusByAudienceSortedByPrice("enterprise");
    const customOrgsAndEnterprises = (currentScenario.customSkus || []).filter(
      sku => sku.audience === "organization" || sku.audience === "enterprise"
    );

    // Combine and sort all organizations/enterprises by price
    const allOrgsAndEnterprises = [
      ...builtInOrgs,
      ...builtInEnterprises,
      ...customOrgsAndEnterprises,
    ].sort((a, b) => {
      const priceDiff = a.pricing.monthlyUsd - b.pricing.monthlyUsd;
      if (priceDiff !== 0) return priceDiff;
      return a.tier - b.tier;
    });

    return allOrgsAndEnterprises.map(sku => ({
      skuId: sku.id,
      label: getSimplifiedSkuName(sku),
    }));
  }, [currentScenario.customSkus]);

  // Get current SKU info
  const currentSku = allSkus.find(s => s.id === skuId);
  const currentLabel = currentSku
    ? getSimplifiedSkuName(currentSku)
    : "Unknown";
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
            {individualPlans.map(plan => {
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
            {organizationPlans.map(plan => {
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
