import type {
  ChannelObject,
  Degree,
  Filter,
  Fraction,
  LuumSpec,
  OutOf255,
  Range,
} from "~/packages/Luum/src"

import { unfiltered } from "../constants/filters"
import hueToRelativeChannels from "../import/hueToRelativeChannels"
import {
  lumFromChannels,
  specificLumFromHue,
  maxSatForHueInFilter,
} from "../solveFor"
import { clamp } from "../utils"

const minChannelsForSaturationFromHue = (hue: Degree) => {
  const relativeChannels = hueToRelativeChannels(hue)
  const channelSpreader = (trueSaturation: OutOf255): ChannelObject => {
    const makeMinChannel = (idx: number) =>
      Math.round(relativeChannels[idx] * trueSaturation)
    return {
      R: makeMinChannel(0),
      G: makeMinChannel(1),
      B: makeMinChannel(2),
    }
  }
  return channelSpreader
}

type IlluminationObj = {
  minChannels: ChannelObject
  trueLuminosity: number
  minLum: number
}

const channelsFromIlluminationObj = ({
  minChannels,
  trueLuminosity,
  minLum,
}: IlluminationObj): ChannelObject => {
  const { max, round } = Math
  const maxWhite = 255 - max(...Object.values(minChannels))
  const white = clamp(round((trueLuminosity - minLum) * 255), [0, maxWhite])
  const channels = {
    R: minChannels.R + white,
    G: minChannels.G + white,
    B: minChannels.B + white,
  }
  return channels
}

type SpecToChannelsFixLimit = (
  spec: LuumSpec,
  filter?: Filter
) => {
  channels: ChannelObject
  fix: { sat: number; lum: number }
  limit: { sat: Range; lum: Range }
}

const specToChannelsFixLimit: SpecToChannelsFixLimit = (
  { hue, sat, lum, prefer = `lum` },
  filter = unfiltered
) => {
  const minChannelsForSaturation = minChannelsForSaturationFromHue(hue)

  let trueSaturation: OutOf255
  let trueLuminosity: Fraction
  let minChannels: ChannelObject
  let maxChannels: ChannelObject
  let specificLum: Fraction
  let minLum = 0
  let maxLum = 1
  let maxSat = maxSatForHueInFilter(hue, filter)

  switch (prefer) {
    case `sat`:
      trueSaturation = clamp(Math.min(sat, maxSat), [0, 255])
      minChannels = minChannelsForSaturation(trueSaturation)
      maxChannels = {
        R: minChannels.R + 255 - trueSaturation,
        G: minChannels.G + 255 - trueSaturation,
        B: minChannels.B + 255 - trueSaturation,
      }
      minLum = lumFromChannels(minChannels)
      maxLum = lumFromChannels(maxChannels)
      trueLuminosity = clamp(lum, [minLum, maxLum])

      break
    case `lum`:
      trueLuminosity = clamp(lum, [0, 1])
      specificLum = specificLumFromHue(hue)
      maxSat = Math.min(
        maxSat,
        Math.round(
          trueLuminosity <= specificLum
            ? 255 * (trueLuminosity / specificLum)
            : (255 * (1 - trueLuminosity)) / (1 - specificLum)
        )
      )
      trueSaturation = Math.min(sat, maxSat)
      minChannels = minChannelsForSaturation(trueSaturation)
      minLum = lumFromChannels(minChannels)
      break
  }

  const channels = channelsFromIlluminationObj({
    minChannels,
    trueLuminosity,
    minLum,
  })

  return {
    channels,
    fix: {
      sat: trueSaturation,
      lum: trueLuminosity,
    },
    limit: {
      sat: [0, maxSat],
      lum: [prefer === `lum` ? 0 : minLum, maxLum],
    },
  }
}

export default specToChannelsFixLimit
