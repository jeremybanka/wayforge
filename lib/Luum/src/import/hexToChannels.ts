import type { ChannelObject } from "~"

import normalizeHex from "./normalizeHex"

export default (maybeHex: string): ChannelObject => {
  const hex = normalizeHex(maybeHex)
  const getHexcodeChannel = (nameOfChannel: `b` | `g` | `r`) => {
    switch (nameOfChannel) {
      /* eslint-disable prettier/prettier */
      case `r`: return hex.slice(0, 2)
      case `g`: return hex.slice(2, 4)
      case `b`: return hex.slice(4, 6)
      default: throw new Error(`strange channel name`)
      /* eslint-enable prettier/prettier */
    }
  }
  const rBase10 = parseInt(getHexcodeChannel(`r`), 16)
  const gBase10 = parseInt(getHexcodeChannel(`g`), 16)
  const bBase10 = parseInt(getHexcodeChannel(`b`), 16)

  return {
    R: rBase10,
    G: gBase10,
    B: bBase10,
  }
}
