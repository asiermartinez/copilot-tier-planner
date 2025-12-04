"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Infer tier level from monthly price
 * (Same logic as AddSkuDialog)
 */
function inferTierFromPrice(monthlyPrice: number, audience: string): number {
  if (monthlyPrice === 0) return 0; // FREE
  if (monthlyPrice <= 18) return 1; // PRO

  // For individual plans
  if (audience === "individual") {
    if (monthlyPrice <= 49) return 2; // PRO_PLUS
    if (monthlyPrice <= 99) return 3; // Premium individual
    return 4; // Ultra-premium individual
  }

  // For organization plans
  if (monthlyPrice <= 38) return 3; // BUSINESS
  return 4; // ENTERPRISE
}
import {
  Dialog,
  TextInput,
  FormControl,
  Stack,
  Banner,
  Textarea,
  Select,
} from "@primer/react";
import { useScenario } from "@/contexts";
import { getSkuById, getAllSkus } from "@/data/skus";
import type { SkuId, Sku } from "@/types/sku";
import type { SkuVariation } from "@/types/scenario";
import { EdgeType } from "@/types/scenario";

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
  const {
    currentScenario,
    updateSkuVariation,
    updateCustomSku,
    addEdge,
    deleteEdge,
  } = useScenario();

  // Check if this is a custom SKU and get base SKU - memoized for stable references
  const customSku = useMemo(() => {
    const found = currentScenario.customSkus?.find(s => s.id === skuId);
    return found;
  }, [currentScenario.customSkus, skuId, currentScenario.modifiedAt]);

  const isCustomSku = !!customSku;

  // Get the base SKU and any variations - memoized for stable references
  const baseSku = useMemo(() => {
    const builtInSku = skuId ? getSkuById(skuId) : undefined;
    const result = builtInSku || customSku;
    return result;
  }, [skuId, customSku, currentScenario.modifiedAt]);

  const variation = useMemo(
    () =>
      skuId && currentScenario.skuVariations
        ? currentScenario.skuVariations[skuId]
        : undefined,
    [skuId, currentScenario.skuVariations]
  );

  // Local state for editing - expanded for custom SKUs
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [audience, setAudience] = useState<
    "individual" | "organization" | "enterprise"
  >("individual");
  const [monthlyPrice, setMonthlyPrice] = useState<string>("");
  const [premiumRequests, setPremiumRequests] = useState<string>("");

  // Initialize form when SKU changes or dialog opens
  useEffect(() => {
    if (!baseSku || !isOpen) return;

    const pricing = variation?.pricing || baseSku.pricing;
    const limits = variation?.limits || baseSku.limits;

    setName(baseSku.name);
    setDescription(baseSku.description || "");
    setAudience(baseSku.audience);
    setMonthlyPrice(pricing.monthlyUsd.toString());
    setPremiumRequests(limits.premiumRequestsPerMonth.toString());
  }, [baseSku, variation, isOpen, skuId, isCustomSku]);

  const handleSave = () => {
    if (!skuId || !baseSku) return;

    if (isCustomSku && customSku) {
      const monthlyUsd =
        parseFloat(monthlyPrice) || customSku.pricing.monthlyUsd;
      const newTier = inferTierFromPrice(monthlyUsd, audience);

      // Check if audience or tier changed - if so, recreate edges
      const audienceChanged = audience !== customSku.audience;
      const tierChanged = newTier !== customSku.tier;

      // For custom SKUs, update the actual SKU object
      const updatedSku: Sku = {
        ...customSku,
        name,
        description,
        audience,
        tier: newTier,
        pricing: {
          ...customSku.pricing,
          monthlyUsd,
          perSeat: audience !== "individual",
        },
        limits: {
          ...customSku.limits,
          premiumRequestsPerMonth:
            parseInt(premiumRequests) ||
            customSku.limits.premiumRequestsPerMonth,
        },
      };
      // If audience or tier changed, recreate edges BEFORE updating the SKU
      // This ensures we're working with the current scenario state
      if (audienceChanged || tierChanged) {
        recreateEdgesForSku(skuId, updatedSku);
      }

      // Update the SKU after recreating edges
      updateCustomSku(skuId, updatedSku);
    } else {
      // For built-in SKUs, create a variation
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
    }

    onClose();
  };

  // Helper function to recreate edges when audience or tier changes
  const recreateEdgesForSku = (skuId: SkuId, updatedSku: Sku) => {
    // 1. Get all SKUs for filtering, using the updated SKU for accurate tier info
    const builtInSkus = getAllSkus();
    const customSkus = currentScenario.customSkus || [];
    // Replace the old version of this SKU with the updated one for correct filtering
    const allSkus = [
      ...builtInSkus,
      ...customSkus.map(s => (s.id === skuId ? updatedSku : s)),
    ];

    // 2. Delete ALL upgrade and budget edges in the same audience to recalculate properly
    // This ensures we don't have stale or duplicate edges when tiers change
    const edgesToDelete = currentScenario.edges.filter(edge => {
      const sourceSkuObj = allSkus.find(s => s.id === edge.source);
      const targetSkuObj = allSkus.find(s => s.id === edge.target);

      // Delete if:
      // - This SKU is involved (any edge type)
      if (edge.source === skuId || edge.target === skuId) {
        return true; // Delete all edges connected to this SKU
      }

      // Also delete upgrade and budget edges for SKUs in same audience to recalculate
      if (
        (edge.type === EdgeType.UPGRADE || edge.type === EdgeType.BUDGET) &&
        sourceSkuObj?.audience === updatedSku.audience &&
        targetSkuObj?.audience === updatedSku.audience
      ) {
        return true;
      }

      return false;
    });
    edgesToDelete.forEach(edge => deleteEdge(edge.id));

    // 3. Recreate ALL edges for the same audience to ensure consistency
    const sameAudienceSkus = allSkus.filter(
      s => s.audience === updatedSku.audience
    );

    // Sort by tier to create edges in order
    const sortedSkus = [...sameAudienceSkus].sort((a, b) => a.tier - b.tier);

    // Create budget edges for all SKUs
    sortedSkus.forEach(currentSku => {
      const budgetEdge = {
        id: `${currentSku.id}-budget`,
        source: currentSku.id,
        target: currentSku.id,
        type: EdgeType.BUDGET as unknown as import("@/types/scenario").EdgeType,
        label: "Set overages",
      };
      addEdge(budgetEdge);
    });

    // Create upgrade edges: each SKU -> all higher tier SKUs in same audience
    sortedSkus.forEach(sourceSku => {
      const higherTierSkus = sortedSkus.filter(
        targetSku => targetSku.tier > sourceSku.tier
      );

      higherTierSkus.forEach(targetSku => {
        const upgradeEdge = {
          id: `${sourceSku.id}-to-${targetSku.id}`,
          source: sourceSku.id,
          target: targetSku.id,
          type: EdgeType.UPGRADE as unknown as import("@/types/scenario").EdgeType,
          label: "Upgrade",
        };
        addEdge(upgradeEdge);
      });
    });
  };

  const handleReset = () => {
    if (!skuId) return;
    if (!isCustomSku) {
      updateSkuVariation(skuId, {});
    }
    onClose();
  };

  if (!baseSku || !skuId || !isOpen) return null;

  const hasModifications = variation && Object.keys(variation).length > 0;

  return (
    <Dialog
      title={`Edit ${baseSku?.name || "SKU"}`}
      onClose={onClose}
      footerButtons={[
        {
          buttonType: "default" as const,
          content: "Cancel",
          onClick: onClose,
        },
        ...(hasModifications && !isCustomSku
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
        {hasModifications && !isCustomSku && (
          <Banner variant="warning" title="Modified SKU" hideTitle>
            This SKU has custom modifications that differ from the default
            values.
          </Banner>
        )}

        {isCustomSku && (
          <>
            <FormControl required>
              <FormControl.Label>Plan Name</FormControl.Label>
              <TextInput
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Custom Pro"
                block
              />
            </FormControl>

            <FormControl>
              <FormControl.Label>Description</FormControl.Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of this plan"
                block
                rows={2}
              />
            </FormControl>

            <FormControl required>
              <FormControl.Label>Audience</FormControl.Label>
              <Select
                value={audience}
                onChange={e =>
                  setAudience(
                    e.target.value as
                      | "individual"
                      | "organization"
                      | "enterprise"
                  )
                }
                block
              >
                <Select.Option value="individual">Individual</Select.Option>
                <Select.Option value="organization">Organization</Select.Option>
                <Select.Option value="enterprise">Enterprise</Select.Option>
              </Select>
            </FormControl>
          </>
        )}

        <FormControl>
          <FormControl.Label>Monthly Price (USD)</FormControl.Label>
          <TextInput
            type="number"
            value={monthlyPrice}
            onChange={e => setMonthlyPrice(e.target.value)}
            placeholder="0"
          />
          {baseSku?.pricing.perSeat && (
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
