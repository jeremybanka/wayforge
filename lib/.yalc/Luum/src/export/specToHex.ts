import specToHexFixLimit from "./specToHexFixLimit"
import type { Filter, Hex, LuumSpec } from "^"

const specToHex = (
  { hue, sat, lum, prefer }: LuumSpec,
  filter?: Filter
): Hex => {
  const { hex } = specToHexFixLimit({ hue, sat, lum, prefer }, filter)
  return hex
}

export default specToHex
