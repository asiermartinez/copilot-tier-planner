"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  FormControl,
  Textarea,
  IconButton,
  SegmentedControl,
} from "@primer/react";
import { CopyIcon, CheckIcon } from "@primer/octicons-react";
import type { SkuScenario } from "@/types/scenario";
import type { ThresholdsConfig } from "@/types/thresholds";

interface ConfigExportDialogProps {
  onClose: () => void;
  currentScenario: SkuScenario;
  thresholdsConfig: ThresholdsConfig;
  onImport: (scenario: SkuScenario, thresholds?: ThresholdsConfig) => void;
}

/**
 * Shared dialog component for exporting and importing configurations
 *
 * Handles both unified configuration export (scenario + thresholds)
 * and legacy threshold-only imports for backward compatibility.
 */
export default function ConfigExportDialog({
  onClose,
  currentScenario,
  thresholdsConfig,
  onImport,
}: ConfigExportDialogProps) {
  const [dialogMode, setDialogMode] = useState<"export" | "import">("export");
  const [importJson, setImportJson] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate export JSON
  const exportedJson = JSON.stringify(
    {
      scenario: {
        ...currentScenario,
        thresholds: thresholdsConfig,
      },
      exportedAt: new Date().toISOString(),
      version: "1.0",
    },
    null,
    2
  );

  // Handle import
  const handleImportConfirm = useCallback(() => {
    try {
      const parsed = JSON.parse(importJson);

      // Check for unified configuration format (scenario + thresholds)
      if (parsed.scenario) {
        const scenario = parsed.scenario;

        // Extract thresholds from scenario
        const { thresholds, ...scenarioWithoutThresholds } = scenario;

        // Update scenario with new modifiedAt timestamp
        const updatedScenario = {
          ...scenarioWithoutThresholds,
          modifiedAt: new Date().toISOString(),
        };

        // Call import handler with scenario and optional thresholds
        onImport(
          updatedScenario,
          thresholds && thresholds.thresholds ? thresholds : undefined
        );

        onClose();
        setImportJson("");
      }
      // Legacy format support (thresholds only)
      else if (parsed.thresholds && Array.isArray(parsed.thresholds)) {
        // For legacy format, keep current scenario and only update thresholds
        const thresholdsConfig: ThresholdsConfig = {
          thresholds: parsed.thresholds,
          modifiedAt: new Date().toISOString(),
        };
        onImport(currentScenario, thresholdsConfig);
        onClose();
        setImportJson("");
      } else {
        alert(
          "Invalid configuration format. Please export a valid configuration."
        );
      }
    } catch (err) {
      alert(
        "Invalid JSON format: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  }, [importJson, onImport, currentScenario, onClose]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [exportedJson]);

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setDialogMode("export");
    setImportJson("");
    setCopied(false);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      title={
        dialogMode === "export"
          ? "Export configuration"
          : "Import configuration"
      }
      onClose={handleClose}
      footerButtons={
        dialogMode === "import"
          ? [
              {
                buttonType: "default",
                content: "Cancel",
                onClick: handleClose,
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
                onClick: handleClose,
              },
            ]
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Mode toggle */}
        <div style={{ marginBottom: "var(--base-size-16)" }}>
          <SegmentedControl
            aria-label="Configuration mode"
            onChange={index => setDialogMode(index === 0 ? "export" : "import")}
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

        {/* Content area */}
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
  );
}
