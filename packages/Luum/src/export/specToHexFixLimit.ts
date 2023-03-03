import type {
  Filter,
  Hex,
  LuumFix,
  LuumLimit,
  LuumSpec,
} from "~/packages/Luum/src"

import channelsToHex from "./channelsToHex"
import specToChannels from "./specToChannelsFixLimit"

type SpecToHexFixLimit = (
  spec: LuumSpec,
  filter?: Filter
) => {
  hex: Hex
  fix: LuumFix
  limit: LuumLimit
}

const specToHexFixLimit: SpecToHexFixLimit = (
  { hue, sat, lum, prefer },
  filter
) => {
  const { channels, fix, limit } = specToChannels(
    {
      hue,
      sat,
      lum,
      prefer,
    },
    filter
  )
  const { R, G, B } = channels
  const hex = channelsToHex({ R, G, B })

  // console.log('--- newHex', hex)

  return { hex, fix, limit }
}

export default specToHexFixLimit
