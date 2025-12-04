"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Button,
  FormControl,
  TextInput,
  Textarea,
  IconButton,
  Text,
  Dialog,
  ActionMenu,
  ActionList,
  CheckboxGroup,
  Checkbox,
  SegmentedControl,
  ToggleSwitch,
} from "@primer/react";
import {
  TrashIcon,
  PlusIcon,
  SyncIcon,
  InfoIcon,
  TriangleDownIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
} from "@primer/octicons-react";
import type {
  ThresholdConfig,
  ThresholdsConfig,
  ThresholdArea,
  ThresholdSeverity,
} from "@/types/thresholds";
import type { SkuId, Sku } from "@/types/sku";
import { DEFAULT_THRESHOLDS } from "@/types/thresholds";
import {
  SKU_MAP,
  getSimplifiedSkuName,
  getSkusByAudienceSortedByPrice,
} from "@/data/skus";
import { usePlanner, useScenario } from "@/contexts";
import { clearStaticBannerStates } from "@/utils/alerts/generateThresholdAlerts";
import styles from "./ThresholdConfigurator.module.css";

interface ThresholdConfiguratorProps {
  config: ThresholdsConfig;
  onChange: (config: ThresholdsConfig) => void;
}

/**
 * Determine appropriate areas based on current state
 */
function suggestAreas(
  quotaPercentage: number,
  overagePercentage: number,
  hasOverageBudget: boolean
): ThresholdArea[] {
  // If no overage budget, must be quota only
  if (!hasOverageBudget) {
    return ["quota"];
  }

  // If actively using overages (overage percentage > 0 or quota at/over 100%), suggest overage
  if (overagePercentage > 0 || quotaPercentage >= 100) {
    return ["overage"];
  }

  // Otherwise suggest quota
  return ["quota"];
}

/**
 * Determine appropriate severity based on percentage
 */
function suggestSeverity(percentage: number): ThresholdSeverity {
  if (percentage >= 100) {
    return "critical";
  } else if (percentage >= 90) {
    return "critical";
  } else if (percentage >= 75) {
    return "warning";
  } else {
    return "info";
  }
}

const AREA_OPTIONS: { value: ThresholdArea; label: string }[] = [
  { value: "quota", label: "Quota" },
  { value: "overage", label: "Overage" },
];

const SEVERITY_OPTIONS: { value: ThresholdSeverity; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
  { value: "upsell", label: "Upsell" },
];

/**
 * Get available areas for selected plans
 */
function getAvailableAreas(plans: SkuId[]): ThresholdArea[] {
  const hasPaidPlans = plans.some(p => p !== "free");

  if (!hasPaidPlans) {
    // Only free plan selected - only quota available
    return ["quota"];
  }

  // Paid plans selected - both quota and overage available
  return ["quota", "overage"];
}

export default function ThresholdConfigurator({
  config,
  onChange,
}: ThresholdConfiguratorProps) {
  const { userState, activeAlertId } = usePlanner();
  const { currentScenario } = useScenario();

  // Build plan options from all SKUs (built-in + custom), sorted by price within each audience group
  const planOptions = useMemo(() => {
    const builtInIndividuals = getSkusByAudienceSortedByPrice("individual");
    const builtInOrganizations = getSkusByAudienceSortedByPrice("organization");
    const builtInEnterprises = getSkusByAudienceSortedByPrice("enterprise");

    const customIndividuals = (currentScenario.customSkus || []).filter(
      sku => sku.audience === "individual"
    );
    const customOrganizations = (currentScenario.customSkus || []).filter(
      sku => sku.audience === "organization"
    );
    const customEnterprises = (currentScenario.customSkus || []).filter(
      sku => sku.audience === "enterprise"
    );

    // Combine and sort each audience group by price
    const sortByPrice = (skus: Sku[]) =>
      skus.sort((a, b) => {
        const priceDiff = a.pricing.monthlyUsd - b.pricing.monthlyUsd;
        if (priceDiff !== 0) return priceDiff;
        return a.tier - b.tier;
      });

    const allIndividuals = sortByPrice([
      ...builtInIndividuals,
      ...customIndividuals,
    ]);
    const allOrganizations = sortByPrice([
      ...builtInOrganizations,
      ...customOrganizations,
    ]);
    const allEnterprises = sortByPrice([
      ...builtInEnterprises,
      ...customEnterprises,
    ]);

    const allSkus = [...allIndividuals, ...allOrganizations, ...allEnterprises];

    return allSkus.map(sku => ({
      value: sku.id,
      label: getSimplifiedSkuName(sku),
    }));
  }, [currentScenario.customSkus]);

  /**
   * Format threshold scope for display (compact)
   */
  const formatThresholdScope = useCallback(
    (plans: SkuId[], areas: ThresholdArea[]): string => {
      const planLabels =
        plans.length === planOptions.length
          ? "all plans"
          : plans
              .map(p => planOptions.find(opt => opt.value === p)?.label || p)
              .join(", ");
      const areaLabels = areas
        .map(a =>
          (AREA_OPTIONS.find(opt => opt.value === a)?.label || a).toLowerCase()
        )
        .join(" or ");

      return `${areaLabels} (${planLabels})`;
    },
    [planOptions]
  );

  const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"export" | "import">("export");
  const [exportedJson, setExportedJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "current">("all");

  // Refs for each threshold card to enable highlighting
  const thresholdRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Store CTA labels when checkbox is disabled to restore them when re-enabled
  const ctaLabelsRef = useRef<Map<string, string>>(new Map());

  // Store billing period days when checkbox is disabled to restore them when re-enabled
  const billingPeriodDaysRef = useRef<Map<string, number>>(new Map());

  // Track if user is currently interacting with any threshold card
  const userInteractingWithCard = useRef<string | null>(null);

  // Highlight the threshold card when active alert changes
  useEffect(() => {
    if (activeAlertId) {
      const cardElement = thresholdRefs.current.get(activeAlertId);
      if (cardElement) {
        // Only scroll if user is not currently interacting with a card
        if (!userInteractingWithCard.current) {
          cardElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    }
  }, [activeAlertId]);

  const handleUpdateThreshold = (
    id: string,
    updates: Partial<ThresholdConfig>
  ) => {
    const newThresholds = config.thresholds.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    onChange({ thresholds: newThresholds });
  };

  const handleRemoveThreshold = (id: string) => {
    const newThresholds = config.thresholds.filter(t => t.id !== id);
    onChange({ thresholds: newThresholds });
  };

  const handleDuplicateThreshold = (id: string) => {
    const threshold = config.thresholds.find(t => t.id === id);
    if (!threshold) return;

    // Create a copy with a new ID
    const duplicatedThreshold: ThresholdConfig = {
      ...threshold,
      id: `threshold-${Date.now()}`,
    };

    // Add the duplicated threshold right after the original
    const originalIndex = config.thresholds.findIndex(t => t.id === id);
    const newThresholds = [...config.thresholds];
    newThresholds.splice(originalIndex + 1, 0, duplicatedThreshold);
    onChange({ thresholds: newThresholds });
  };

  const handleAddThreshold = () => {
    // Get current state to pre-configure the threshold
    const quotaPercentage = userState.usage.premiumRequests.percentageUsed ?? 0;
    const overagePercentage = userState.overageBudget?.percentageConsumed ?? 0;
    const hasOverageBudget = userState.overageBudget !== null;

    // Check if current SKU allows overage budgets
    // Get SKU from built-in SKUs or custom SKUs
    let currentSku: Sku | undefined = SKU_MAP[userState.subscription.skuId];

    // If not found in built-in SKUs, check custom SKUs
    if (!currentSku && currentScenario.customSkus) {
      currentSku = currentScenario.customSkus.find(
        s => s.id === userState.subscription.skuId
      );
    }

    const skuAllowsOverageBudget =
      currentSku?.limits.premiumRequestsOveragePolicy?.allowBudgetCap ?? false;

    // Suggest plans based on current SKU
    const currentSkuId = userState.subscription.skuId;
    const suggestedPlans: SkuId[] = [currentSkuId];

    // Determine which areas are active
    const activeAreas = suggestAreas(
      quotaPercentage,
      overagePercentage,
      hasOverageBudget && skuAllowsOverageBudget
    );

    // Use the current percentage based on primary area, rounded to nearest 5
    const primaryArea = activeAreas[0];
    const currentPercentage =
      primaryArea === "overage" ? overagePercentage : quotaPercentage;
    const suggestedPercentage = Math.min(
      100,
      Math.max(0, Math.round(currentPercentage / 5) * 5)
    );

    // Suggest severity based on percentage
    const suggestedSeverity = suggestSeverity(suggestedPercentage);

    // Create appropriate message based on primary area
    const suggestedMessage =
      primaryArea === "overage"
        ? "You've used {budgetPercentage}% of your overage budget"
        : "You've used {percentage}% of your quota";

    const newId = `threshold-${Date.now()}`;

    // Store current billing period days for this new threshold
    // so it's available as default when enabling billing period constraint
    const daysIntoPeriod =
      userState.billingPeriod.daysInPeriod -
      userState.billingPeriod.daysRemaining;
    billingPeriodDaysRef.current.set(newId, daysIntoPeriod);

    const newThreshold: ThresholdConfig = {
      id: newId,
      percentage: suggestedPercentage,
      plans: suggestedPlans,
      areas: activeAreas,
      severity: suggestedSeverity,
      message: suggestedMessage,
      enabled: true,
      dismissable: true,
      static: false,
    };
    onChange({ thresholds: [...config.thresholds, newThreshold] });
  };

  const handleResetToDefaults = () => {
    clearStaticBannerStates();
    onChange({ thresholds: [...DEFAULT_THRESHOLDS] });
  };

  // Export thresholds configuration
  const handleExport = () => {
    const exportData = {
      thresholds: config.thresholds,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    setExportedJson(JSON.stringify(exportData, null, 2));
    setDialogMode("export");
    setShowThresholdDialog(true);
  };

  const handleImportConfirm = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (parsed.thresholds && Array.isArray(parsed.thresholds)) {
        onChange({ thresholds: parsed.thresholds });
        setShowThresholdDialog(false);
        setImportJson("");
      } else {
        alert("Invalid threshold configuration format");
      }
    } catch {
      alert("Invalid JSON format");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Filter thresholds based on mode
  const filteredThresholds =
    filterMode === "current"
      ? config.thresholds.filter(threshold => {
          // Check if threshold applies to current SKU
          const currentSkuId = userState.subscription.skuId;
          return threshold.plans.includes(currentSkuId);
        })
      : config.thresholds;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SegmentedControl
          aria-label="Filter thresholds"
          size="small"
          onChange={index => setFilterMode(index === 0 ? "all" : "current")}
        >
          <SegmentedControl.Button selected={filterMode === "all"}>
            All
          </SegmentedControl.Button>
          <SegmentedControl.Button selected={filterMode === "current"}>
            Current tier
          </SegmentedControl.Button>
        </SegmentedControl>
        <div className={styles.headerActions}>
          <IconButton
            aria-label="Export thresholds"
            icon={DownloadIcon}
            size="small"
            onClick={handleExport}
            variant="invisible"
          />

          <IconButton
            aria-label="Reset to defaults"
            icon={SyncIcon}
            size="small"
            onClick={handleResetToDefaults}
            variant="invisible"
          />
          <IconButton
            aria-label="Show available variables"
            icon={InfoIcon}
            size="small"
            onClick={() => setIsVariablesDialogOpen(true)}
            variant="invisible"
          />
        </div>
      </div>

      {showThresholdDialog && (
        <Dialog
          title="Threshold configuration"
          onClose={() => setShowThresholdDialog(false)}
          footerButtons={
            dialogMode === "import"
              ? [
                  {
                    buttonType: "default",
                    content: "Cancel",
                    onClick: () => setShowThresholdDialog(false),
                  },
                  {
                    buttonType: "primary",
                    content: "Import",
                    onClick: handleImportConfirm,
                    disabled: !importJson.trim(),
                  },
                ]
              : [
                  {
                    buttonType: "default",
                    content: "Close",
                    onClick: () => setShowThresholdDialog(false),
                  },
                ]
          }
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "var(--base-size-16)" }}>
              <SegmentedControl
                aria-label="Threshold mode"
                onChange={index =>
                  setDialogMode(index === 0 ? "export" : "import")
                }
                fullWidth
              >
                <SegmentedControl.Button selected={dialogMode === "export"}>
                  Export
                </SegmentedControl.Button>
                <SegmentedControl.Button selected={dialogMode === "import"}>
                  Import
                </SegmentedControl.Button>
              </SegmentedControl>
            </div>
            <div>
              {dialogMode === "export" ? (
                <>
                  <FormControl style={{ display: "block", width: "100%" }}>
                    <FormControl.Label visuallyHidden>
                      Export configuration
                    </FormControl.Label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <IconButton
                        aria-label={copied ? "Copied" : "Copy JSON"}
                        icon={copied ? CheckIcon : CopyIcon}
                        onClick={handleCopy}
                        variant="invisible"
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          zIndex: 1,
                        }}
                      />
                      <textarea
                        readOnly
                        value={exportedJson}
                        style={{
                          width: "100%",
                          height: "300px",
                          fontFamily: "var(--fontStack-monospace)",
                          fontSize: "12px",
                          padding: "12px",
                          border: "1px solid var(--borderColor-default)",
                          borderRadius: "6px",
                          backgroundColor: "var(--bgColor-muted)",
                          resize: "none",
                          boxSizing: "border-box",
                          display: "block",
                        }}
                      />
                    </div>
                  </FormControl>
                </>
              ) : (
                <>
                  <FormControl style={{ display: "block", width: "100%" }}>
                    <FormControl.Label visuallyHidden>
                      Import configuration
                    </FormControl.Label>
                    <Textarea
                      value={importJson}
                      onChange={e => setImportJson(e.target.value)}
                      placeholder="Paste JSON here..."
                      block
                      resize="none"
                      style={{
                        fontFamily: "var(--fontStack-monospace)",
                        fontSize: "12px",
                        height: "300px",
                        boxSizing: "border-box",
                      }}
                    />
                  </FormControl>
                </>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {isVariablesDialogOpen && (
        <Dialog
          title="Available Variables"
          onClose={() => setIsVariablesDialogOpen(false)}
        >
          <div className={styles.dialogContent}>
            <p className={styles.dialogDescription}>
              Use these variables in your threshold messages and CTA button
              labels. They will be automatically replaced with real-time values.
            </p>
            <div className={styles.variablesGrid}>
              <div>
                <strong>Quota</strong>
                <div className={styles.variableList}>
                  <div>
                    <code>{"{current}"}</code>
                    <span>Current requests used</span>
                  </div>
                  <div>
                    <code>{"{limit}"}</code>
                    <span>Monthly quota limit</span>
                  </div>
                  <div>
                    <code>{"{percentage}"}</code>
                    <span>Quota usage percentage</span>
                  </div>
                  <div>
                    <code>{"{remaining}"}</code>
                    <span>Requests remaining</span>
                  </div>
                  <div>
                    <code>{"{overage}"}</code>
                    <span>Overage request count</span>
                  </div>
                </div>
              </div>
              <div>
                <strong>Overage Budget</strong>
                <div className={styles.variableList}>
                  <div>
                    <code>{"{budget}"}</code>
                    <span>Total budget amount</span>
                  </div>
                  <div>
                    <code>{"{budgetUsed}"}</code>
                    <span>Amount spent</span>
                  </div>
                  <div>
                    <code>{"{budgetRemaining}"}</code>
                    <span>Amount remaining</span>
                  </div>
                  <div>
                    <code>{"{budgetPercentage}"}</code>
                    <span>Budget consumed (%)</span>
                  </div>
                  <div>
                    <code>{"{overageRemaining}"}</code>
                    <span>Overage requests remaining</span>
                  </div>
                </div>
              </div>
              <div>
                <strong>Plan</strong>
                <div className={styles.variableList}>
                  <div>
                    <code>{"{planName}"}</code>
                    <span>Current plan name</span>
                  </div>
                  <div>
                    <code>{"{nextPlan}"}</code>
                    <span>Next tier plan name</span>
                  </div>
                </div>
              </div>
              <div>
                <strong>Billing Period</strong>
                <div className={styles.variableList}>
                  <div>
                    <code>{"{daysRemaining}"}</code>
                    <span>Days left in period</span>
                  </div>
                  <div>
                    <code>{"{daysInPeriod}"}</code>
                    <span>Total days in period</span>
                  </div>
                  <div>
                    <code>{"{resetDate}"}</code>
                    <span>Plan reset date (e.g., Mar 7, 2025)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      <div className={styles.thresholdsList}>
        {filteredThresholds.map(threshold => (
          <div
            key={threshold.id}
            ref={el => {
              if (el) {
                thresholdRefs.current.set(threshold.id, el);
              } else {
                thresholdRefs.current.delete(threshold.id);
              }
            }}
            className={`${styles.thresholdCard} ${
              threshold.id === activeAlertId ? styles.activeCard : ""
            }`}
            onFocus={() => {
              userInteractingWithCard.current = threshold.id;
            }}
            onBlur={() => {
              if (userInteractingWithCard.current === threshold.id) {
                userInteractingWithCard.current = null;
              }
            }}
            onMouseDown={() => {
              userInteractingWithCard.current = threshold.id;
            }}
            onMouseUp={() => {
              // Delay clearing to allow click events to complete
              setTimeout(() => {
                if (userInteractingWithCard.current === threshold.id) {
                  userInteractingWithCard.current = null;
                }
              }, 100);
            }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardActions}>
                <ToggleSwitch
                  size="small"
                  checked={threshold.enabled}
                  onClick={() =>
                    handleUpdateThreshold(threshold.id, {
                      enabled: !threshold.enabled,
                    })
                  }
                  aria-labelledby={`threshold-title-${threshold.id}`}
                  statusLabelPosition="end"
                  buttonLabelOff=""
                  buttonLabelOn=""
                  className={styles.toggleSwitch}
                />
                <Text
                  className={styles.cardTitle}
                  id={`threshold-title-${threshold.id}`}
                >
                  {threshold.percentage}%{" "}
                  {formatThresholdScope(threshold.plans, threshold.areas)}
                </Text>
              </div>
              <div style={{ display: "flex", gap: "var(--base-size-4)" }}>
                <IconButton
                  aria-label="Duplicate threshold"
                  icon={CopyIcon}
                  size="small"
                  variant="invisible"
                  onClick={() => handleDuplicateThreshold(threshold.id)}
                />
                <IconButton
                  aria-label="Delete threshold"
                  icon={TrashIcon}
                  size="small"
                  variant="invisible"
                  onClick={() => handleRemoveThreshold(threshold.id)}
                />
              </div>
            </div>

            <div className={styles.cardContent}>
              <ActionMenu>
                <ActionMenu.Anchor>
                  <Button trailingAction={TriangleDownIcon}>
                    <span
                      style={{
                        color: "var(--fgColor-muted)",
                        display: "inline-block",
                      }}
                    >
                      Threshold:
                    </span>{" "}
                    {formatThresholdScope(threshold.plans, threshold.areas)}
                  </Button>
                </ActionMenu.Anchor>
                <ActionMenu.Overlay align="end">
                  <ActionList>
                    <ActionList.Group title="Plans" selectionVariant="multiple">
                      {planOptions.map(option => (
                        <ActionList.Item
                          key={option.value}
                          selected={threshold.plans.includes(option.value)}
                          onSelect={() => {
                            const isSelected = threshold.plans.includes(
                              option.value
                            );
                            let newPlans: SkuId[];

                            if (isSelected) {
                              // Prevent deselecting the last plan
                              if (threshold.plans.length === 1) {
                                return;
                              }
                              newPlans = threshold.plans.filter(
                                p => p !== option.value
                              );
                            } else {
                              newPlans = [...threshold.plans, option.value];
                            }

                            // Check if areas need to be adjusted
                            const availableAreas = getAvailableAreas(newPlans);
                            const validAreas = threshold.areas.filter(a =>
                              availableAreas.includes(a)
                            );

                            // Ensure at least one area is selected
                            const newAreas =
                              validAreas.length > 0
                                ? validAreas
                                : [availableAreas[0]];

                            handleUpdateThreshold(threshold.id, {
                              plans: newPlans,
                              areas: newAreas,
                            });
                          }}
                        >
                          {option.label}
                        </ActionList.Item>
                      ))}
                    </ActionList.Group>
                    <ActionList.Divider />
                    <ActionList.Group
                      title="Consumption range"
                      selectionVariant="multiple"
                    >
                      {AREA_OPTIONS.map(option => {
                        const availableAreas = getAvailableAreas(
                          threshold.plans
                        );
                        const isAvailable = availableAreas.includes(
                          option.value
                        );
                        const isSelected = threshold.areas.includes(
                          option.value
                        );

                        return (
                          <ActionList.Item
                            key={option.value}
                            selected={isSelected}
                            disabled={!isAvailable}
                            onSelect={() => {
                              if (!isAvailable) return;

                              let newAreas: ThresholdArea[];

                              if (isSelected) {
                                // Prevent deselecting the last area
                                if (threshold.areas.length === 1) {
                                  return;
                                }
                                newAreas = threshold.areas.filter(
                                  a => a !== option.value
                                );
                              } else {
                                newAreas = [...threshold.areas, option.value];
                              }

                              handleUpdateThreshold(threshold.id, {
                                areas: newAreas,
                              });
                            }}
                          >
                            {option.label}
                          </ActionList.Item>
                        );
                      })}
                    </ActionList.Group>
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>

              <FormControl className={styles.formControl}>
                <FormControl.Label>Consumption</FormControl.Label>
                <div className={styles.sliderInputContainer}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={threshold.percentage}
                    onChange={e =>
                      handleUpdateThreshold(threshold.id, {
                        percentage: parseInt(e.target.value, 10),
                      })
                    }
                    className={styles.slider}
                    aria-label="Threshold percentage"
                  />
                  <div className={styles.numberInput}>
                    <TextInput
                      type="number"
                      min={0}
                      max={100}
                      value={threshold.percentage}
                      onChange={e =>
                        handleUpdateThreshold(threshold.id, {
                          percentage: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      trailingVisual="%"
                      size="small"
                      aria-label="Threshold percentage value"
                    />
                  </div>
                </div>
              </FormControl>

              <CheckboxGroup>
                <CheckboxGroup.Label visuallyHidden>
                  Billing period constraint
                </CheckboxGroup.Label>
                <FormControl>
                  <Checkbox
                    checked={!!threshold.billingPeriod}
                    onChange={e => {
                      if (e.target.checked) {
                        // Re-enabling: use stored days or default to 0
                        const storedDays = billingPeriodDaysRef.current.get(
                          threshold.id
                        );
                        handleUpdateThreshold(threshold.id, {
                          billingPeriod: {
                            maxDaysIntoPeriod: storedDays ?? 0,
                          },
                        });
                      } else {
                        // Disabling: store current days before removing
                        if (
                          threshold.billingPeriod?.maxDaysIntoPeriod !==
                          undefined
                        ) {
                          billingPeriodDaysRef.current.set(
                            threshold.id,
                            threshold.billingPeriod.maxDaysIntoPeriod
                          );
                        }
                        handleUpdateThreshold(threshold.id, {
                          billingPeriod: undefined,
                        });
                      }
                    }}
                  />
                  <FormControl.Label>
                    <span style={{ fontWeight: 600 }}>
                      Days into billing period (constraint)
                    </span>
                  </FormControl.Label>
                </FormControl>
              </CheckboxGroup>

              <div className={styles.ctaSection}>
                {threshold.billingPeriod && (
                  <FormControl className={styles.formControl}>
                    <FormControl.Label visuallyHidden>
                      Days into billing period
                    </FormControl.Label>
                    <div className={styles.sliderInputContainer}>
                      <input
                        type="range"
                        min="0"
                        max={userState.billingPeriod.daysInPeriod}
                        value={threshold.billingPeriod.maxDaysIntoPeriod}
                        onChange={e =>
                          handleUpdateThreshold(threshold.id, {
                            billingPeriod: {
                              maxDaysIntoPeriod: Number(e.target.value),
                            },
                          })
                        }
                        className={styles.slider}
                        aria-label="Days into billing period slider"
                      />
                      <div className={styles.numberInput}>
                        <TextInput
                          type="number"
                          min={0}
                          max={userState.billingPeriod.daysInPeriod}
                          value={threshold.billingPeriod.maxDaysIntoPeriod}
                          onChange={e => {
                            const value = Number(e.target.value);
                            if (!isNaN(value)) {
                              handleUpdateThreshold(threshold.id, {
                                billingPeriod: {
                                  maxDaysIntoPeriod: Math.max(
                                    0,
                                    Math.min(
                                      userState.billingPeriod.daysInPeriod,
                                      value
                                    )
                                  ),
                                },
                              });
                            }
                          }}
                          aria-label="Days into billing period value"
                          size="small"
                        />
                      </div>
                    </div>
                    <FormControl.Caption>
                      Threshold applies within first{" "}
                      {threshold.billingPeriod.maxDaysIntoPeriod}{" "}
                      {threshold.billingPeriod.maxDaysIntoPeriod === 1
                        ? "day"
                        : "days"}
                    </FormControl.Caption>
                  </FormControl>
                )}
              </div>

              <FormControl className={styles.messageControl}>
                <FormControl.Label>Message</FormControl.Label>
                <Textarea
                  value={threshold.message}
                  onChange={e =>
                    handleUpdateThreshold(threshold.id, {
                      message: e.target.value,
                    })
                  }
                  rows={4}
                  block
                  placeholder="Enter message template with {variables}"
                  resize="vertical"
                />
              </FormControl>

              <ActionMenu>
                <ActionMenu.Anchor>
                  <Button trailingAction={TriangleDownIcon}>
                    <span
                      style={{
                        color: "var(--fgColor-muted)",
                        display: "inline-block",
                      }}
                    >
                      Type:
                    </span>{" "}
                    {
                      SEVERITY_OPTIONS.find(
                        opt => opt.value === threshold.severity
                      )?.label
                    }
                  </Button>
                </ActionMenu.Anchor>
                <ActionMenu.Overlay align="end">
                  <ActionList selectionVariant="single">
                    {SEVERITY_OPTIONS.map(option => (
                      <ActionList.Item
                        key={option.value}
                        selected={threshold.severity === option.value}
                        onSelect={() =>
                          handleUpdateThreshold(threshold.id, {
                            severity: option.value,
                          })
                        }
                      >
                        {option.label}
                      </ActionList.Item>
                    ))}
                  </ActionList>
                </ActionMenu.Overlay>
              </ActionMenu>

              <CheckboxGroup>
                <CheckboxGroup.Label visuallyHidden>
                  Threshold options
                </CheckboxGroup.Label>
                <FormControl>
                  <Checkbox
                    checked={threshold.dismissable}
                    onChange={e =>
                      handleUpdateThreshold(threshold.id, {
                        dismissable: e.target.checked,
                      })
                    }
                  />
                  <FormControl.Label>Dismissable banner</FormControl.Label>
                </FormControl>

                <FormControl>
                  <Checkbox
                    checked={threshold.static}
                    onChange={e =>
                      handleUpdateThreshold(threshold.id, {
                        static: e.target.checked,
                      })
                    }
                  />
                  <FormControl.Label>
                    Static (freeze state when triggered)
                  </FormControl.Label>
                </FormControl>

                <FormControl>
                  <Checkbox
                    checked={!!threshold.cta}
                    onChange={e => {
                      if (e.target.checked) {
                        // Re-enabling: use stored label or default
                        const storedLabel = ctaLabelsRef.current.get(
                          threshold.id
                        );
                        handleUpdateThreshold(threshold.id, {
                          cta: { label: storedLabel || "Take action" },
                        });
                      } else {
                        // Disabling: store current label before removing
                        if (threshold.cta?.label) {
                          ctaLabelsRef.current.set(
                            threshold.id,
                            threshold.cta.label
                          );
                        }
                        handleUpdateThreshold(threshold.id, {
                          cta: undefined,
                        });
                      }
                    }}
                  />
                  <FormControl.Label>Call-to-action button</FormControl.Label>
                </FormControl>
              </CheckboxGroup>

              <div className={styles.ctaSection}>
                {threshold.cta && (
                  <FormControl className={styles.ctaInput}>
                    <FormControl.Label visuallyHidden>
                      Button text
                    </FormControl.Label>
                    <TextInput
                      value={threshold.cta.label}
                      onChange={e =>
                        handleUpdateThreshold(threshold.id, {
                          cta: { label: e.target.value },
                        })
                      }
                      placeholder="Button text (supports {variables})"
                      size="small"
                      block
                    />
                    <FormControl.Caption>
                      Variables like {"{nextPlan}"}, {"{percentage}"} work here
                      too
                    </FormControl.Caption>
                  </FormControl>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.addButtonContainer}>
        <Button
          variant="primary"
          leadingVisual={PlusIcon}
          onClick={handleAddThreshold}
        >
          Add threshold
        </Button>
      </div>
    </div>
  );
}
