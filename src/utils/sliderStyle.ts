import type { CSSProperties } from "react";

/**
 * Inline style that tells a slider's CSS how far to fill its track.
 *
 * @param value - Current slider value
 * @param max - Slider maximum (the minimum is always 0)
 */
export function getSliderStyle(value: number, max: number): CSSProperties {
  const progress = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  return { "--slider-progress": progress } as CSSProperties;
}
