"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
} from "@xyflow/react";

/**
 * Custom edge component that handles dynamic marker colors for selection states
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
  // Determine edge type - use smoothstep for budget edges, bezier for others
  const isSmoothStep = data?.type === "smoothstep";

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

  // Determine marker color based on selection state
  const markerColor = selected ? "#0969da" : "#d0d7de";

  // Create unique marker ID for this edge's state
  const markerId = `arrow-${id}-${selected ? "selected" : "default"}`;

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
            opacity={selected ? 1 : 0.6}
          />
        </marker>
      </defs>

      {/* Edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={`url(#${markerId})`}
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
    </>
  );
}
