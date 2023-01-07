import type { Filter, Hex, LuumSpec } from "~/packages/Luum"

import specToHexFixLimit from "./specToHexFixLimit"

const specToHex = (
  { hue, sat, lum, prefer }: LuumSpec,
  filter?: Filter
): Hex => {
  const { hex } = specToHexFixLimit({ hue, sat, lum, prefer }, filter)
  return hex
}

export default specToHex
