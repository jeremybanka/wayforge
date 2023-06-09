import type { Fragment, Layer } from "corners"

export const LAYER: Record<string, Fragment<Layer>> = {
  FAINT_SHADOW: { color: `#0003`, spread: -4, blur: 12, offset: { y: -4 } },
  LIGHT_FILL: { color: `#f3f3f3` },
  SOLID_STROKE: {
    color: `transparent`,
    stroke: { color: `#888`, width: 1 },
  },
  DOTTED_STROKE: {
    color: `transparent`,
    stroke: { color: `#555`, width: 2, dashArray: [4, 8] },
  },
  SMALL_SHADOW: {
    color: `#0005`,
    blur: 2,
    offset: { x: 0, y: -2 },
  },
  BG_IN_FG: {
    color: `var(--bg-color)`,
    stroke: { width: 2, color: `var(--fg-color)` },
  },
  BG: {
    color: `var(--bg-color)`,
  },
  FG: {
    color: `var(--fg-color)`,
  },
  FG_STROKE: {
    color: `transparent`,
    stroke: { width: 2, color: `var(--fg-color)` },
  },
}
