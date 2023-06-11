import type { Layer } from "corners"

import type { Fragment } from "~/packages/anvl/src/object"

export const LAYER: Record<string, Fragment<Layer>> = {
  FAINT_SHADOW: {
    className: `faint-shadow`,
    color: `#0003`,
    spread: -4,
    blur: 12,
    offset: { y: -4 },
  },
  LIGHT_FILL: {
    className: `light-fill`,
    color: `#f3f3f3`,
  },
  SOLID_STROKE: {
    className: `solid-stroke`,
    color: `transparent`,
    stroke: { color: `#888`, width: 1 },
  },
  DOTTED_STROKE: {
    className: `dotted-stroke`,
    color: `transparent`,
    stroke: { color: `#555`, width: 2, dashArray: [4, 8] },
  },
  SMALL_SHADOW: {
    className: `small-shadow`,
    color: `#0005`,
    blur: 2,
    offset: { x: 0, y: -2 },
  },
  BG_IN_FG: {
    className: `bg-in-fg`,
    color: `var(--bg-color)`,
    stroke: { width: 2, color: `var(--fg-color)` },
  },
  BG: {
    className: `bg`,
    color: `var(--bg-color)`,
  },
  FG: {
    className: `fg`,
    color: `var(--fg-color)`,
  },
  FG_STROKE: {
    className: `fg-stroke`,
    color: `transparent`,
    stroke: { width: 2, color: `var(--fg-color)` },
  },
}
