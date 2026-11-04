/**
 * SKU Helper Utilities
 *
 * Lookup helpers for SKU data.
 */

import { Sku, SkuId } from "@/types/sku";
import { SKU_MAP } from "@/data/skus";

/**
 * Get a SKU by its ID
 * @param id - The SKU ID to look up
 * @returns The SKU object, or null if not found
 */
export function getSkuById(id: SkuId): Sku | null {
  return SKU_MAP[id] || null;
}

/**
 * Get the overage price per premium request for a SKU
 * @param skuId - SKU ID
 * @returns Price per request in USD, or null if not applicable
 */
export function getOveragePricePerRequest(skuId: SkuId): number | null {
  const sku = getSkuById(skuId);
  if (!sku) return null;

  return sku.limits.premiumRequestsOveragePolicy.pricePerUnit || null;
}
