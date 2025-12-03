"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
} from "@xyflow/react";
import { IconButton } from "@primer/react";
import { StarFillIcon, StarIcon } from "@primer/octicons-react";
import styles from "./CustomEdge.module.css";

/**
 * Extended edge data with custom properties
 */
interface CustomEdgeData {
  type?: string;
  desired?: boolean;
  shouldAnimate?: boolean;
  onMarkDesired?: (edgeId: string, desired: boolean) => void;
  showMarkButton?: boolean;
}

/**
 * Custom edge component that handles dynamic marker colors for selection states
 * and marching ants animation for desired paths
 */
export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  label,
  data,
}: EdgeProps) {
  // Cast data to our custom type
  const edgeData = data as CustomEdgeData | undefined;

  // Determine edge type - use smoothstep for budget edges, bezier for others
  const isSmoothStep = edgeData?.type === "smoothstep";
  const isDesired = edgeData?.desired === true;
  const shouldAnimate = edgeData?.shouldAnimate === true;
  const onMarkDesired = edgeData?.onMarkDesired;
  const showMarkButton = edgeData?.showMarkButton === true;

  // Get the appropriate path
  const pathResult = isSmoothStep
    ? getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      })
    : getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });

  const [edgePath, labelX, labelY] = pathResult;

  // Determine marker color based on selection state and animation
  let markerColor = selected ? "#0969da" : "#d0d7de";
  let markerOpacity = selected ? 1 : 0.6;

  // Use success color for animating desired paths
  if (shouldAnimate && isDesired) {
    markerColor = "#1a7f37"; // --borderColor-success-emphasis
    markerOpacity = 1;
  }

  // Create unique marker ID for this edge's state
  const markerId = `arrow-${id}-${selected ? "selected" : shouldAnimate ? "animating" : "default"}`;

  // Determine edge style based on state
  let edgeStyle = { ...style };
  let edgeClassName = "";

  if (shouldAnimate && isDesired) {
    // Marching ants animation for desired paths when parent node is selected
    edgeClassName = styles.marchingAnts;
    edgeStyle = {
      ...edgeStyle,
      stroke: "var(--borderColor-success-emphasis)",
      strokeWidth: 2,
      strokeDasharray: "8,4",
    };
  }

  return (
    <>
      {/* SVG marker definition */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={markerColor}
            opacity={markerOpacity}
          />
        </marker>
      </defs>

      {/* Edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={`url(#${markerId})`}
        className={edgeClassName}
      />

      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 400,
              color: selected
                ? "var(--fgColor-accent)"
                : "var(--fgColor-muted)",
              background: "var(--bgColor-default)",
              padding: "2px 6px",
              borderRadius: 2,
              pointerEvents: "all",
              cursor: "pointer",
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Mark as desired button - shown when edge is selected and recommended paths is enabled */}
      {selected && onMarkDesired && showMarkButton && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 30}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <IconButton
              size="small"
              variant={isDesired ? "primary" : "default"}
              icon={isDesired ? StarFillIcon : StarIcon}
              aria-label={isDesired ? "Desired path" : "Mark as desired"}
              onClick={e => {
                e.stopPropagation();
                if (onMarkDesired) {
                  onMarkDesired(id, !isDesired);
                }
              }}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
