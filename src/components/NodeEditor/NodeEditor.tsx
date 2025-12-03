"use client";

import { useState, useEffect } from "react";
import { Dialog, TextInput, FormControl, Stack, Banner } from "@primer/react";
import { useScenario } from "@/contexts";
import { SKU_MAP } from "@/data/skus";
import type { SkuId } from "@/types/sku";
import type { SkuVariation } from "@/types/scenario";

interface NodeEditorProps {
  skuId: SkuId | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Node Editor - allows editing SKU properties
 */
export default function NodeEditor({
  skuId,
  isOpen,
  onClose,
}: NodeEditorProps) {
  const { currentScenario, updateSkuVariation } = useScenario();

  // Get the base SKU and any variations
  const baseSku = skuId ? SKU_MAP[skuId] : null;
  const variation =
    skuId && currentScenario.skuVariations
      ? currentScenario.skuVariations[skuId]
      : undefined;

  // Local state for editing
  const [monthlyPrice, setMonthlyPrice] = useState<string>("");
  const [premiumRequests, setPremiumRequests] = useState<string>("");

  // Initialize form when SKU changes
  useEffect(() => {
    if (!baseSku) return;

    const pricing = variation?.pricing || baseSku.pricing;
    const limits = variation?.limits || baseSku.limits;

    setMonthlyPrice(pricing.monthlyUsd.toString());
    setPremiumRequests(limits.premiumRequestsPerMonth.toString());
  }, [baseSku, variation]);

  const handleSave = () => {
    if (!skuId || !baseSku) return;

    const newVariation: SkuVariation = {
      pricing: {
        ...baseSku.pricing,
        monthlyUsd: parseFloat(monthlyPrice) || baseSku.pricing.monthlyUsd,
      },
      limits: {
        ...baseSku.limits,
        premiumRequestsPerMonth:
          parseInt(premiumRequests) || baseSku.limits.premiumRequestsPerMonth,
      },
    };

    updateSkuVariation(skuId, newVariation);
    onClose();
  };

  const handleReset = () => {
    if (!skuId) return;
    updateSkuVariation(skuId, {});
    onClose();
  };

  if (!baseSku || !skuId || !isOpen) return null;

  const hasModifications = variation && Object.keys(variation).length > 0;

  return (
    <Dialog
      title={`Edit ${baseSku.name}`}
      onClose={onClose}
      footerButtons={[
        {
          buttonType: "default" as const,
          content: "Cancel",
          onClick: onClose,
        },
        ...(hasModifications
          ? [
              {
                buttonType: "danger" as const,
                content: "Reset",
                onClick: handleReset,
              },
            ]
          : []),
        {
          buttonType: "primary" as const,
          content: "Save changes",
          onClick: handleSave,
        },
      ]}
    >
      <Stack direction="vertical" gap="normal">
        {hasModifications && (
          <Banner variant="warning" title="Modified SKU" hideTitle>
            This SKU has custom modifications that differ from the default
            values.
          </Banner>
        )}

        <FormControl>
          <FormControl.Label>Monthly Price (USD)</FormControl.Label>
          <TextInput
            type="number"
            value={monthlyPrice}
            onChange={e => setMonthlyPrice(e.target.value)}
            placeholder="0"
          />
          {baseSku.pricing.perSeat && (
            <FormControl.Caption>Per seat pricing</FormControl.Caption>
          )}
        </FormControl>

        <FormControl>
          <FormControl.Label>Premium Requests per Month</FormControl.Label>
          <TextInput
            type="number"
            value={premiumRequests}
            onChange={e => setPremiumRequests(e.target.value)}
            placeholder="0"
          />
        </FormControl>
      </Stack>
    </Dialog>
  );
}
