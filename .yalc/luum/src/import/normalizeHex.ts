import type { Hex } from "~"

const BASE_16_CHAR_SET = `[a-fA-F0-9]+`

const miniHexToHex = (miniHex: string): Hex => {
  const miniHexArray = miniHex.split(``)
  const hexTemplate = [0, 0, 1, 1, 2, 2]
  return hexTemplate.map((idx) => miniHexArray[idx]).join(``)
}

const normalizeHex = (maybeHex: string): Hex => {
  const hex = maybeHex.replace(/^#/, ``)
  const hexIsCorrectLength = hex.length === 6 || hex.length === 3
  const hexIsCorrectCharSet =
    hex.match(new RegExp(`^${BASE_16_CHAR_SET}$`)) !== null
  const hexIsValid = hexIsCorrectLength && hexIsCorrectCharSet
  if (!hexIsValid) {
    throw new Error(`${maybeHex} is not a valid hex code`)
  }
  if (hex.length === 3) {
    return miniHexToHex(hex)
  }
  return hex
}

export default normalizeHex
