"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  TextInput,
  FormControl,
  Textarea,
  Select,
  Stack,
  Banner,
} from "@primer/react";
import type { Sku, SkuTier } from "@/types/sku";
import { OverageBehavior } from "@/types/sku";
import { useScenario } from "@/contexts";
import { EdgeType } from "@/types/scenario";
import type { SkuEdge } from "@/types/scenario";
import { getAllSkus as getBuiltInSkus } from "@/data/skus";

interface AddSkuDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Convert a name to a valid SKU ID (slug format)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Infer tier level from monthly price
 * Uses Copilot pricing tiers as reference:
 * - $0: FREE (tier 0)
 * - $1-18: PRO (tier 1)
 * - $19-49: PRO_PLUS (tier 2)
 * - $50+: Premium individual (tier 3) or org plans
 *
 * For individual audience: tier 3+ for premium plans ($50+)
 * For org/enterprise audience: tier 3 for $19-38, tier 4 for $39+
 */
function inferTierFromPrice(monthlyPrice: number, audience: string): SkuTier {
  if (monthlyPrice === 0) return 0; // FREE
  if (monthlyPrice <= 18) return 1; // PRO ($10)

  // For individual plans
  if (audience === "individual") {
    if (monthlyPrice <= 49) return 2; // PRO_PLUS ($39)
    if (monthlyPrice <= 99) return 3; // Premium individual (e.g., Pro Max)
    return 4; // Ultra-premium individual (tier 4)
  }

  // For organization plans
  if (monthlyPrice <= 38) return 3; // BUSINESS ($19)
  return 4; // ENTERPRISE ($39+)
}

export default function AddSkuDialog({ isOpen, onClose }: AddSkuDialogProps) {
  const { addCustomSku, currentScenario, addEdge } = useScenario();

  // Track the last added SKU to create edges for it
  const lastAddedSkuRef = useRef<string | null>(null);

  // Form state
  const [name, setName] = useState<string>("");
  const [audience, setAudience] = useState<
    "individual" | "organization" | "enterprise"
  >("individual");
  const [description, setDescription] = useState<string>("");
  const [monthlyPrice, setMonthlyPrice] = useState<string>("10");
  const [premiumRequests, setPremiumRequests] = useState<string>("300");

  // Validation
  const [error, setError] = useState<string>("");

  // Auto-generate SKU ID from name
  const skuId = slugify(name);

  // Auto-calculate annual price (10 months worth - typical SaaS discount)
  const annualPrice = monthlyPrice
    ? (parseFloat(monthlyPrice) * 10).toFixed(2)
    : "";

  // Clear error when name changes
  useEffect(() => {
    if (error) setError("");
  }, [name, error]);

  const handleReset = useCallback(() => {
    setName("");
    setAudience("individual");
    setDescription("");
    setMonthlyPrice("10");
    setPremiumRequests("300");
    setError("");
  }, []);

  const handleSubmit = useCallback(() => {
    // Validate required fields
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!skuId) {
      setError("Name must contain at least one letter or number");
      return;
    }

    // Parse numeric values
    const monthlyUsd = parseFloat(monthlyPrice) || 0;
    const annualUsd = annualPrice ? parseFloat(annualPrice) : undefined;
    const premiumRequestsPerMonth = parseInt(premiumRequests) || 0;
    const tier = inferTierFromPrice(monthlyUsd, audience);

    // Create the new SKU
    const newSku: Sku = {
      id: skuId as unknown as import("@/types/sku").SkuId,
      name,
      tier,
      description: description || `Custom ${name} plan`,
      pricing: {
        monthlyUsd,
        annualUsd,
        perSeat: audience !== "individual",
      },
      limits: {
        premiumRequestsPerMonth,
        premiumRequestsOveragePolicy: {
          behavior: OverageBehavior.BILL,
          pricePerUnit: 0.04,
          maxOverage: null,
          allowBudgetCap: true,
          warningThreshold: 80,
        },
        // Chat messages and code completions are always unlimited
        chatMessagesPerMonth: null,
        chatMessagesOveragePolicy: null,
        codeCompletionsPerMonth: null,
        codeCompletionsOveragePolicy: null,
        canPurchaseAdditionalPremiumRequests: true,
      },
      features: {
        // Default all features to true for custom SKUs
        copilotCodingAgent: true,
        agentMode: true,
        copilotCodeReview: true,
        modelContextProtocol: true,
        chatInIdes: true,
        inlineChat: true,
        slashCommands: true,
        chatInGitHubMobile: true,
        chatInGitHub: true,
        chatInWindowsTerminal: true,
        chatSkillsInIdes: true,
        premiumModelsAccess: true,
        allModelsAccess: true,
        nextEditSuggestions: true,
        repositoryAndPersonalCustomInstructions: true,
        organizationCustomInstructions: audience !== "individual",
        promptFiles: true,
        blockSuggestionsMatchingPublicCode: true,
        excludeSpecifiedFiles: true,
        organizationPolicyManagement: audience !== "individual",
        pullRequestSummaries: true,
        auditLogs: audience !== "individual",
        contentExclusion: true,
        knowledgeBases: true,
        copilotCli: true,
        gitHubSpark: true,
      },
      audience,
      available: true,
    };

    // Add the SKU
    addCustomSku(newSku);

    // Track this SKU so we can create edges for it after it's added
    lastAddedSkuRef.current = skuId;

    // Reset form and close
    handleReset();
    onClose();
  }, [
    name,
    skuId,
    audience,
    description,
    monthlyPrice,
    annualPrice,
    premiumRequests,
    addCustomSku,
    onClose,
    handleReset,
  ]);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  // Create edges after SKU has been added to the scenario
  useEffect(() => {
    if (!lastAddedSkuRef.current) return;

    const skuId = lastAddedSkuRef.current;

    // Check if the SKU exists in the scenario
    const customSku = currentScenario.customSkus?.find(s => s.id === skuId);
    if (!customSku) return;

    // Clear the ref so we don't create edges again
    lastAddedSkuRef.current = null;

    // Get all SKUs (built-in + custom)
    const builtInSkus = getBuiltInSkus();
    const allSkus = [...builtInSkus, ...(currentScenario.customSkus || [])];

    // 1. Budget edge (self-loop for overage budget)
    const budgetEdge: SkuEdge = {
      id: `${skuId}-budget`,
      source: skuId as unknown as import("@/types/sku").SkuId,
      target: skuId as unknown as import("@/types/sku").SkuId,
      type: EdgeType.BUDGET,
      label: "Set overages",
    };
    addEdge(budgetEdge);

    // 2. Upgrade edges TO higher tier SKUs in the same audience
    const higherTierSkus = allSkus.filter(
      s =>
        s.tier > customSku.tier &&
        s.audience === customSku.audience &&
        s.id !== skuId
    );

    higherTierSkus.forEach(targetSku => {
      const upgradeEdge: SkuEdge = {
        id: `${skuId}-to-${targetSku.id}`,
        source: skuId as unknown as import("@/types/sku").SkuId,
        target: targetSku.id as unknown as import("@/types/sku").SkuId,
        type: EdgeType.UPGRADE,
        label: "Upgrade",
      };
      addEdge(upgradeEdge);
    });

    // 3. Upgrade edges FROM immediate lower tier SKUs to this new SKU
    // Only create from tier - 1 to avoid cluttering the graph
    const lowerTierSkus = allSkus.filter(
      s =>
        s.tier === customSku.tier - 1 &&
        s.audience === customSku.audience &&
        s.id !== skuId
    );

    lowerTierSkus.forEach(sourceSku => {
      const upgradeEdge: SkuEdge = {
        id: `${sourceSku.id}-to-${skuId}`,
        source: sourceSku.id as unknown as import("@/types/sku").SkuId,
        target: skuId as unknown as import("@/types/sku").SkuId,
        type: EdgeType.UPGRADE,
        label: "Upgrade",
      };
      addEdge(upgradeEdge);
    });
  }, [currentScenario.customSkus, addEdge]);

  if (!isOpen) return null;

  return (
    <Dialog
      title="Add Custom SKU"
      onClose={handleClose}
      footerButtons={[
        {
          buttonType: "default",
          content: "Cancel",
          onClick: handleClose,
        },
        {
          buttonType: "primary",
          content: "Add SKU",
          onClick: handleSubmit,
        },
      ]}
    >
      <Stack direction="vertical" gap="normal">
        {error && (
          <Banner variant="critical" title="Error">
            {error}
          </Banner>
        )}

        <FormControl required>
          <FormControl.Label>Plan Name</FormControl.Label>
          <TextInput
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Custom Pro, Premium Plus"
            block
            autoFocus
          />
          {skuId && (
            <FormControl.Caption>
              SKU ID: <code>{skuId}</code>
            </FormControl.Caption>
          )}
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
                e.target.value as "individual" | "organization" | "enterprise"
              )
            }
            block
          >
            <Select.Option value="individual">Individual</Select.Option>
            <Select.Option value="organization">Organization</Select.Option>
            <Select.Option value="enterprise">Enterprise</Select.Option>
          </Select>
          {audience !== "individual" && (
            <FormControl.Caption>Per-seat pricing</FormControl.Caption>
          )}
        </FormControl>

        <FormControl required>
          <FormControl.Label>Monthly Price (USD)</FormControl.Label>
          <TextInput
            type="number"
            step="0.01"
            value={monthlyPrice}
            onChange={e => setMonthlyPrice(e.target.value)}
            placeholder="10"
            block
          />
          {annualPrice && parseFloat(annualPrice) > 0 && (
            <FormControl.Caption>
              Annual: ${annualPrice} (10 months of service)
            </FormControl.Caption>
          )}
        </FormControl>

        <FormControl required>
          <FormControl.Label>Premium Requests per Month</FormControl.Label>
          <TextInput
            type="number"
            value={premiumRequests}
            onChange={e => setPremiumRequests(e.target.value)}
            placeholder="300"
            block
          />
          <FormControl.Caption>
            Chat messages and code completions are unlimited. Overages are $0.04
            per request.
          </FormControl.Caption>
        </FormControl>
      </Stack>
    </Dialog>
  );
}
