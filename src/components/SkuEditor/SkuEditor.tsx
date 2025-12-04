"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TextInput,
  FormControl,
  Stack,
  Textarea,
  Select,
  Button,
  Text,
  IconButton,
  ConfirmationDialog,
} from "@primer/react";
import { SyncIcon, TrashIcon } from "@primer/octicons-react";
import { useScenario, usePlanner } from "@/contexts";
import { getSkuById } from "@/data/skus";
import type { SkuId, Sku } from "@/types/sku";
import type { SkuVariation } from "@/types/scenario";
import { EdgeType } from "@/types/scenario";
import { getAllSkus } from "@/data/skus";
import styles from "./SkuEditor.module.css";

/**
 * Infer tier level from monthly price
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

/**
 * SKU Editor - inline editor for selected SKU with threshold card styling
 */
export default function SkuEditor() {
  const { userState, updateAccountTypeAndSku } = usePlanner();
  const {
    currentScenario,
    updateSkuVariation,
    updateCustomSku,
    addEdge,
    deleteEdge,
    deleteCustomSku,
  } = useScenario();

  const currentSkuId = userState.subscription.skuId;

  // Check if this is a custom SKU
  const customSku = useMemo(() => {
    return currentScenario.customSkus?.find(s => s.id === currentSkuId);
  }, [currentScenario.customSkus, currentSkuId]);

  const isCustomSku = !!customSku;

  // Get the base SKU
  const baseSku = useMemo(() => {
    const builtInSku = currentSkuId ? getSkuById(currentSkuId) : undefined;
    return builtInSku || customSku;
  }, [currentSkuId, customSku]);

  const variation = useMemo(
    () =>
      currentSkuId && currentScenario.skuVariations
        ? currentScenario.skuVariations[currentSkuId]
        : undefined,
    [currentSkuId, currentScenario.skuVariations]
  );

  // Local state for editing
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [audience, setAudience] = useState<
    "individual" | "organization" | "enterprise"
  >("individual");
  const [monthlyPrice, setMonthlyPrice] = useState<string>("");
  const [premiumRequests, setPremiumRequests] = useState<string>("");

  // Track if form has been modified
  const [isDirty, setIsDirty] = useState(false);

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Initialize form when SKU changes
  useEffect(() => {
    if (!baseSku) return;

    const pricing = variation?.pricing || baseSku.pricing;
    const limits = variation?.limits || baseSku.limits;

    setName(baseSku.name);
    setDescription(baseSku.description || "");
    setAudience(baseSku.audience);
    setMonthlyPrice(pricing.monthlyUsd.toString());
    setPremiumRequests(limits.premiumRequestsPerMonth.toString());
    setIsDirty(false);
  }, [baseSku, variation, currentSkuId]);

  // Mark as dirty when fields change
  const handleFieldChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!currentSkuId || !baseSku) return;

    if (isCustomSku && customSku) {
      const monthlyUsd =
        parseFloat(monthlyPrice) || customSku.pricing.monthlyUsd;
      const newTier = inferTierFromPrice(monthlyUsd, audience);

      // Check if audience or tier changed
      const audienceChanged = audience !== customSku.audience;
      const tierChanged = newTier !== customSku.tier;

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

      if (audienceChanged || tierChanged) {
        recreateEdgesForSku(currentSkuId, updatedSku);
      }

      updateCustomSku(currentSkuId, updatedSku);
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
      updateSkuVariation(currentSkuId, newVariation);
    }

    setIsDirty(false);
  };

  const handleReset = () => {
    if (!currentSkuId || isCustomSku) return;
    updateSkuVariation(currentSkuId, {});
    setIsDirty(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClose = (
    gesture: "confirm" | "close-button" | "cancel" | "escape"
  ) => {
    if (gesture === "confirm" && currentSkuId && isCustomSku) {
      // If we're deleting the currently selected SKU, switch to FREE first
      if (currentSkuId === userState.subscription.skuId) {
        updateAccountTypeAndSku("individual", "free");
      }
      deleteCustomSku(currentSkuId);
    }
    setIsDeleteDialogOpen(false);
  };

  // Helper function to recreate edges when audience or tier changes
  const recreateEdgesForSku = (skuId: SkuId, updatedSku: Sku) => {
    const builtInSkus = getAllSkus();
    const customSkus = currentScenario.customSkus || [];
    const allSkus = [
      ...builtInSkus,
      ...customSkus.map(s => (s.id === skuId ? updatedSku : s)),
    ];

    // Delete all edges connected to this SKU
    const edgesToDelete = currentScenario.edges.filter(edge => {
      const sourceSkuObj = allSkus.find(s => s.id === edge.source);
      const targetSkuObj = allSkus.find(s => s.id === edge.target);

      if (edge.source === skuId || edge.target === skuId) {
        return true;
      }

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

    // Recreate edges for the same audience
    const sameAudienceSkus = allSkus.filter(
      s => s.audience === updatedSku.audience
    );
    const sortedSkus = [...sameAudienceSkus].sort((a, b) => a.tier - b.tier);

    // Create budget edges
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

    // Create upgrade edges
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

  if (!baseSku || !currentSkuId) return null;

  const hasModifications = variation && Object.keys(variation).length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerContent}>
            <Text className={styles.cardTitle}>{baseSku.name}</Text>
            {hasModifications && !isCustomSku && (
              <span
                className={styles.modifiedDot}
                title="Modified from default"
              />
            )}
          </div>
          <div style={{ display: "flex", gap: "var(--base-size-4)" }}>
            {hasModifications && !isCustomSku && (
              <IconButton
                aria-label="Reset to default"
                icon={SyncIcon}
                size="small"
                variant="invisible"
                onClick={handleReset}
              />
            )}
            {isCustomSku && (
              <IconButton
                aria-label="Delete custom SKU"
                icon={TrashIcon}
                size="small"
                variant="invisible"
                onClick={handleDeleteClick}
              />
            )}
          </div>
        </div>

        <div className={styles.cardBody}>
          <Stack direction="vertical" gap="normal">
            {isCustomSku && (
              <>
                <FormControl>
                  <FormControl.Label>Plan name</FormControl.Label>
                  <TextInput
                    value={name}
                    onChange={e => handleFieldChange(setName, e.target.value)}
                    placeholder="e.g., Custom Pro"
                    block
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>Description</FormControl.Label>
                  <Textarea
                    value={description}
                    onChange={e =>
                      handleFieldChange(setDescription, e.target.value)
                    }
                    placeholder="Brief description"
                    block
                    rows={4}
                  />
                </FormControl>

                <FormControl>
                  <FormControl.Label>Audience</FormControl.Label>
                  <Select
                    value={audience}
                    onChange={e => {
                      handleFieldChange(
                        setAudience as (value: string) => void,
                        e.target.value
                      );
                    }}
                    block
                  >
                    <Select.Option value="individual">Individual</Select.Option>
                    <Select.Option value="organization">
                      Organization
                    </Select.Option>
                    <Select.Option value="enterprise">Enterprise</Select.Option>
                  </Select>
                </FormControl>
              </>
            )}

            <FormControl>
              <FormControl.Label>
                {audience === "individual"
                  ? "Monthly price"
                  : "Monthly price per seat"}
              </FormControl.Label>
              <div className={styles.inputWithSuffix}>
                <TextInput
                  type="number"
                  value={monthlyPrice}
                  onChange={e =>
                    handleFieldChange(setMonthlyPrice, e.target.value)
                  }
                  placeholder="0"
                  block
                />
                <span className={styles.inputSuffix}>USD</span>
              </div>
            </FormControl>

            <FormControl>
              <FormControl.Label>Premium requests per month</FormControl.Label>
              <div className={styles.inputWithSuffix}>
                <TextInput
                  type="number"
                  value={premiumRequests}
                  onChange={e =>
                    handleFieldChange(setPremiumRequests, e.target.value)
                  }
                  placeholder="0"
                  block
                />
                <span className={styles.inputSuffix}>requests</span>
              </div>
            </FormControl>

            {isDirty && (
              <div className={styles.actions}>
                <Button variant="primary" onClick={handleSave} block>
                  Save changes
                </Button>
              </div>
            )}
          </Stack>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <ConfirmationDialog
          onClose={handleDeleteClose}
          title="Delete custom SKU"
          confirmButtonContent="Delete"
          cancelButtonContent="Cancel"
          confirmButtonType="danger"
        >
          Are you sure you want to delete &quot;{baseSku?.name}&quot;? This
          action cannot be undone.
        </ConfirmationDialog>
      )}
    </div>
  );
}
