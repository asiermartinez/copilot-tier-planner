"use client";

import { useState, useEffect, useRef } from "react";
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
} from "@primer/react";
import {
  TrashIcon,
  PlusIcon,
  XIcon,
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
  ThresholdMetric,
  ThresholdSeverity,
  ThresholdPlanFilter,
} from "@/types/thresholds";
import { DEFAULT_THRESHOLDS } from "@/types/thresholds";
import { usePlanner } from "@/contexts";
import styles from "./ThresholdConfigurator.module.css";

interface ThresholdConfiguratorProps {
  config: ThresholdsConfig;
  onChange: (config: ThresholdsConfig) => void;
}

/**
 * Determine appropriate metric based on current state
 */
function suggestMetric(
  quotaPercentage: number,
  overagePercentage: number,
  hasOverageBudget: boolean
): ThresholdMetric {
  // If no overage budget, must be quota
  if (!hasOverageBudget) {
    return "quota";
  }

  // If using overages (quota exceeded), suggest overage metric
  if (quotaPercentage >= 100) {
    return "overage";
  }

  // Otherwise suggest quota
  return "quota";
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

type CombinedMetricFilter =
  | "quota-all"
  | "quota-free"
  | "quota-paid"
  | "overage-paid"
  | "both-all"
  | "both-paid";

const COMBINED_OPTIONS: { value: CombinedMetricFilter; label: string }[] = [
  { value: "quota-all", label: "Quota (all plans)" },
  { value: "quota-free", label: "Quota (free only)" },
  { value: "quota-paid", label: "Quota (paid only)" },
  { value: "overage-paid", label: "Overage (paid only)" },
  { value: "both-all", label: "Both (all plans)" },
  { value: "both-paid", label: "Both (paid only)" },
];

const SEVERITY_OPTIONS: { value: ThresholdSeverity; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
  { value: "upsell", label: "Upsell" },
];

function getCombinedValue(
  appliesTo: ThresholdMetric,
  planFilter?: ThresholdPlanFilter
): CombinedMetricFilter {
  const filter = planFilter ?? "all";

  if (appliesTo === "quota") {
    if (filter === "free-only") return "quota-free";
    if (filter === "paid-only") return "quota-paid";
    return "quota-all";
  }

  if (appliesTo === "overage") {
    return "overage-paid"; // Overage only works on paid plans
  }

  if (appliesTo === "both") {
    if (filter === "paid-only") return "both-paid";
    return "both-all";
  }

  return "quota-all";
}

function splitCombinedValue(combined: CombinedMetricFilter): {
  appliesTo: ThresholdMetric;
  planFilter: ThresholdPlanFilter;
} {
  switch (combined) {
    case "quota-all":
      return { appliesTo: "quota", planFilter: "all" };
    case "quota-free":
      return { appliesTo: "quota", planFilter: "free-only" };
    case "quota-paid":
      return { appliesTo: "quota", planFilter: "paid-only" };
    case "overage-paid":
      return { appliesTo: "overage", planFilter: "paid-only" };
    case "both-all":
      return { appliesTo: "both", planFilter: "all" };
    case "both-paid":
      return { appliesTo: "both", planFilter: "paid-only" };
  }
}

export default function ThresholdConfigurator({
  config,
  onChange,
}: ThresholdConfiguratorProps) {
  const { clearDismissedAlerts, userState, activeAlertId } = usePlanner();
  const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"export" | "import">("export");
  const [exportedJson, setExportedJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "current">("all");

  // Refs for each threshold card to enable highlighting
  const thresholdRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Highlight the threshold card when active alert changes
  useEffect(() => {
    if (activeAlertId) {
      const cardElement = thresholdRefs.current.get(activeAlertId);
      if (cardElement) {
        // Scroll into view if not visible
        cardElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
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

  const handleAddThreshold = () => {
    // Get current state to pre-configure the threshold
    const quotaPercentage = userState.usage.premiumRequests.percentageUsed ?? 0;
    const overagePercentage = userState.overageBudget?.percentageConsumed ?? 0;
    const hasOverageBudget = userState.overageBudget !== null;

    // Determine which metric is active
    const activeMetric = suggestMetric(
      quotaPercentage,
      overagePercentage,
      hasOverageBudget
    );

    // Use the current percentage, rounded to nearest 5
    const currentPercentage =
      activeMetric === "overage" ? overagePercentage : quotaPercentage;
    const suggestedPercentage = Math.min(
      100,
      Math.max(0, Math.round(currentPercentage / 5) * 5)
    );

    // Suggest severity based on percentage
    const suggestedSeverity = suggestSeverity(suggestedPercentage);

    // Create appropriate message based on metric
    const suggestedMessage =
      activeMetric === "overage"
        ? "You've used {budgetPercentage}% of your overage budget"
        : "You've used {percentage}% of your quota";

    const newId = `threshold-${Date.now()}`;
    const newThreshold: ThresholdConfig = {
      id: newId,
      percentage: suggestedPercentage,
      appliesTo: activeMetric,
      severity: suggestedSeverity,
      message: suggestedMessage,
      enabled: true,
      dismissable: true,
      static: false,
    };
    onChange({ thresholds: [...config.thresholds, newThreshold] });
  };

  const handleResetToDefaults = () => {
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
          const planFilter = threshold.planFilter ?? "all";

          if (planFilter === "all") return true;
          if (planFilter === "free-only") return currentSkuId === "free";
          if (planFilter === "paid-only") return currentSkuId !== "free";

          return true;
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
            aria-label="Clear dismissed alerts"
            icon={XIcon}
            size="small"
            onClick={clearDismissedAlerts}
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
          title="Threshold Configuration"
          onClose={() => setShowThresholdDialog(false)}
        >
          <div style={{ padding: "16px" }}>
            <div style={{ marginBottom: "16px" }}>
              <SegmentedControl
                aria-label="Threshold mode"
                onChange={index =>
                  setDialogMode(index === 0 ? "export" : "import")
                }
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
                  <p
                    style={{
                      marginBottom: "12px",
                      color: "var(--fgColor-muted)",
                    }}
                  >
                    Copy this JSON configuration to save your thresholds:
                  </p>
                  <div style={{ position: "relative" }}>
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
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p
                    style={{
                      marginBottom: "12px",
                      color: "var(--fgColor-muted)",
                    }}
                  >
                    Paste your JSON configuration below:
                  </p>
                  <textarea
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                    placeholder="Paste JSON here..."
                    style={{
                      width: "100%",
                      height: "300px",
                      fontFamily: "var(--fontStack-monospace)",
                      fontSize: "12px",
                      padding: "12px",
                      border: "1px solid var(--borderColor-default)",
                      borderRadius: "6px",
                      backgroundColor: "var(--bgColor-default)",
                      resize: "none",
                    }}
                  />
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "8px",
                    }}
                  >
                    <Button onClick={() => setShowThresholdDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleImportConfirm}
                      disabled={!importJson.trim()}
                    >
                      Import
                    </Button>
                  </div>
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
              activeAlertId === threshold.id ? styles.activeCard : ""
            }`}
          >
            <div className={styles.cardHeader}>
              <Text className={styles.cardTitle}>
                {threshold.percentage}%{" "}
                {
                  COMBINED_OPTIONS.find(
                    opt =>
                      opt.value ===
                      getCombinedValue(
                        threshold.appliesTo,
                        threshold.planFilter
                      )
                  )?.label
                }
              </Text>
              <div className={styles.cardActions}>
                <FormControl>
                  <Checkbox
                    checked={threshold.enabled}
                    onChange={e =>
                      handleUpdateThreshold(threshold.id, {
                        enabled: e.target.checked,
                      })
                    }
                  />
                  <FormControl.Label>Enabled</FormControl.Label>
                </FormControl>
                <IconButton
                  aria-label="Remove threshold"
                  icon={TrashIcon}
                  size="small"
                  variant="danger"
                  onClick={() => handleRemoveThreshold(threshold.id)}
                />
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.row}>
                <ActionMenu>
                  <ActionMenu.Anchor>
                    <Button trailingAction={TriangleDownIcon}>
                      <span
                        style={{
                          color: "var(--fgColor-muted)",
                          display: "inline-block",
                        }}
                      >
                        Plans:
                      </span>{" "}
                      {
                        COMBINED_OPTIONS.find(
                          opt =>
                            opt.value ===
                            getCombinedValue(
                              threshold.appliesTo,
                              threshold.planFilter
                            )
                        )?.label
                      }
                    </Button>
                  </ActionMenu.Anchor>
                  <ActionMenu.Overlay align="end">
                    <ActionList selectionVariant="single">
                      {COMBINED_OPTIONS.map(option => (
                        <ActionList.Item
                          key={option.value}
                          selected={
                            getCombinedValue(
                              threshold.appliesTo,
                              threshold.planFilter
                            ) === option.value
                          }
                          onSelect={() => {
                            const { appliesTo, planFilter } =
                              splitCombinedValue(option.value);
                            handleUpdateThreshold(threshold.id, {
                              appliesTo,
                              planFilter,
                            });
                          }}
                        >
                          {option.label}
                        </ActionList.Item>
                      ))}
                    </ActionList>
                  </ActionMenu.Overlay>
                </ActionMenu>

                <ActionMenu>
                  <ActionMenu.Anchor>
                    <Button trailingAction={TriangleDownIcon}>
                      <span
                        style={{
                          color: "var(--fgColor-muted)",
                          display: "inline-block",
                        }}
                      >
                        Severity:
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
              </div>

              <FormControl className={styles.formControl}>
                <FormControl.Label>Percentage</FormControl.Label>
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

              <FormControl className={styles.messageControl}>
                <FormControl.Label>Message</FormControl.Label>
                <Textarea
                  value={threshold.message}
                  onChange={e =>
                    handleUpdateThreshold(threshold.id, {
                      message: e.target.value,
                    })
                  }
                  rows={3}
                  block
                  placeholder="Enter message template with {variables}"
                  resize="vertical"
                />
              </FormControl>

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
                    onChange={e =>
                      handleUpdateThreshold(threshold.id, {
                        cta: e.target.checked
                          ? { label: "Take action" }
                          : undefined,
                      })
                    }
                  />
                  <FormControl.Label>
                    Add call-to-action button
                  </FormControl.Label>
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
