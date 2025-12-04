"use client";

import { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { DotFillIcon } from "@primer/octicons-react";
import { usePlanner, useScenario } from "@/contexts";
import { getSkuById } from "@/data/skus";
import type { SkuId, Sku } from "@/types/sku";
import styles from "./SkuNode.module.css";

/**
 * Data stored in each SKU node
 */
export interface SkuNodeData extends Record<string, unknown> {
  skuId: SkuId;
  label: string;
  tier: string;
  isIndividual: boolean;
  /** Monthly price in USD - included to trigger re-renders when pricing changes */
  monthlyUsd: number;
  /** Whether this node is currently being connected from */
  isConnecting?: boolean;
}

/**
 * Custom node component for displaying SKUs in the visual builder
 */
function SkuNode({
  data,
  selected,
}: {
  data: SkuNodeData;
  selected?: boolean;
}) {
  const { userState } = usePlanner();
  const { currentScenario } = useScenario();

  const skuId = data.skuId;

  // Get base SKU from built-in SKUs or custom SKUs - memoized for stable references
  const baseSku = useMemo(() => {
    const builtInSku = getSkuById(skuId);
    if (builtInSku) return builtInSku;

    // If not found in built-in SKUs, check custom SKUs
    if (currentScenario.customSkus) {
      return currentScenario.customSkus.find(s => s.id === skuId);
    }

    return undefined;
  }, [skuId, currentScenario.customSkus]);

  const variation = useMemo(
    () => currentScenario.skuVariations?.[skuId],
    [currentScenario.skuVariations, skuId]
  );

  // Merge base SKU with variations - memoized for stable references
  const sku = useMemo((): Sku | null => {
    if (!baseSku) return null;

    return {
      ...baseSku,
      ...(variation || {}),
      pricing: variation?.pricing
        ? { ...baseSku.pricing, ...variation.pricing }
        : baseSku.pricing,
      limits: variation?.limits
        ? { ...baseSku.limits, ...variation.limits }
        : baseSku.limits,
    };
  }, [baseSku, variation]);

  // If SKU not found, return null (shouldn't happen)
  if (!sku) {
    return null;
  }

  const isCurrentSku = userState.subscription.skuId === skuId;
  const isModified = variation && Object.keys(variation).length > 0;

  // Determine node styling based on state
  const nodeClass = [
    styles.skuNode,
    isCurrentSku && styles.current,
    selected && styles.selected,
    data.isConnecting && "connecting",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={nodeClass}>
        {/* Multiple handles for edge connections - only right one is visible */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          style={{ opacity: 0, pointerEvents: "none" }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className={styles.visibleHandle}
          style={{ right: -12, top: "50%", transform: "translateY(-50%)" }}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{ opacity: 0, pointerEvents: "none" }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          style={{ opacity: 0, pointerEvents: "none" }}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          style={{ opacity: 0, pointerEvents: "none" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className={styles.visibleHandle}
          style={{ right: -12, top: "50%", transform: "translateY(-50%)" }}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          style={{ opacity: 0, pointerEvents: "none" }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          style={{ opacity: 0, pointerEvents: "none" }}
        />

        {/* Custom handle visual - semicircle */}
        <div className={styles.handleVisual} />

        {/* Separate dot element positioned independently */}
        <div className={styles.handleDotIndependent} />

        {/* Header with SKU name and pricing */}
        <div className={styles.nodeHeader}>
          <div className={styles.nodeName}>
            {sku.name}
            {isModified && (
              <span
                style={{
                  marginLeft: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
                aria-label="Modified"
              >
                <DotFillIcon size={12} fill="var(--bgColor-accent-emphasis)" />
              </span>
            )}
          </div>
          <div className={styles.nodePrice}>
            {sku.pricing.monthlyUsd === 0 ? (
              "Free"
            ) : (
              <>
                ${sku.pricing.monthlyUsd}
                {sku.pricing.perSeat && "/seat"}
              </>
            )}
          </div>
        </div>

        {/* Body with product specs */}
        <div className={styles.nodeBody}>
          <div className={styles.limitItem}>
            {sku.limits.premiumRequestsPerMonth} premium requests
          </div>
        </div>
      </div>
    </>
  );
}

export default SkuNode;
