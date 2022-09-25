import { CHANNEL_SPECIFIC_LUM } from "../constants"
import hueToRelativeChannels from "../import/hueToRelativeChannels"

export default (hue: number): number => {
  const [factorR, factorG, factorB] = hueToRelativeChannels(hue)

  const lumR = CHANNEL_SPECIFIC_LUM.R * factorR
  const lumG = CHANNEL_SPECIFIC_LUM.G * factorG
  const lumB = CHANNEL_SPECIFIC_LUM.B * factorB

  const specificLum = lumR + lumG + lumB

  return specificLum
}
