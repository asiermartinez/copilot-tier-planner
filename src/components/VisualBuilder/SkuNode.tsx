"use client";

import { memo } from "react";
import { Handle, Position, NodeToolbar } from "@xyflow/react";
import { Button } from "@primer/react";
import { PencilIcon, DotFillIcon } from "@primer/octicons-react";
import { usePlanner, useScenario } from "@/contexts";
import { SKU_MAP } from "@/data/skus";
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
  const baseSku = SKU_MAP[skuId];
  const variation = currentScenario.skuVariations?.[skuId];

  // Merge base SKU with variations
  const sku: Sku = {
    ...baseSku,
    ...(variation || {}),
    pricing: variation?.pricing
      ? { ...baseSku.pricing, ...variation.pricing }
      : baseSku.pricing,
    limits: variation?.limits
      ? { ...baseSku.limits, ...variation.limits }
      : baseSku.limits,
  };

  const isCurrentSku = userState.subscription.skuId === skuId;
  const isModified = variation && Object.keys(variation).length > 0;

  // Determine node styling based on state
  const nodeClass = [
    styles.skuNode,
    isCurrentSku && styles.current,
    selected && styles.selected,
  ]
    .filter(Boolean)
    .join(" ");

  // Handle edit button click
  const handleEdit = () => {
    window.dispatchEvent(
      new CustomEvent("edit-sku-node", { detail: { skuId } })
    );
  };

  return (
    <>
      {/* Toolbar appears when node is selected */}
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <Button
          size="small"
          leadingVisual={PencilIcon}
          onClick={handleEdit}
          variant="default"
        >
          Edit
        </Button>
      </NodeToolbar>

      <div className={nodeClass}>
        {/* Multiple handles for smart edge routing */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className={styles.handle}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className={styles.handle}
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={styles.handle}
          style={{ top: -8 }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className={styles.handle}
          style={{ bottom: -8 }}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          className={styles.handle}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className={styles.handle}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          className={styles.handle}
          style={{ top: -8 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          className={styles.handle}
          style={{ bottom: -8 }}
        />

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
            {sku.limits.premiumRequestsPerMonth >= 2000
              ? `${sku.limits.premiumRequestsPerMonth}+ premium requests`
              : `${sku.limits.premiumRequestsPerMonth} premium requests`}
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(SkuNode);
