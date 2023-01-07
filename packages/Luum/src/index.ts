export * from "./constants"
export * from "./constants/filters"
export * from "./constants/schemes"
export * from "./export"
export * from "./identify"
export * from "./import"
export * from "./luum"
export * from "./mixers"
export * from "./scheme"
export * from "./solveFor"
export * from "./utils"
export * from "./luum"

export type Degree = number
export type OutOf255 = number
export type Fraction = number
export type Hex = string

export type Range = [min: number, max: number]

export type ChannelObject = {
  R: number
  G: number
  B: number
}

export type ChannelArray = [r: number, g: number, b: number]

export type FilterPoint = {
  hue: number
  sat: number
}

export type Filter = FilterPoint[]

export type HSL = {
  hue: number
  sat: number
  lum: number
}

export interface LuumSpec extends HSL {
  prefer: `lum` | `sat`
}

export type LuumFix = { sat: number; lum: number }
export type LuumLimit = { sat: Range; lum: Range }
