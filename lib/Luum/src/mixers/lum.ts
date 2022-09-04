import { pipe } from "fp-ts/lib/function"

import type { Modifier } from "~/lib/fp-tools/index"
import { become, clampInto } from "~/lib/fp-tools/index"

import type { LuumApplicator } from "."
import type { LuumSpec } from "^"

export const setLum: LuumApplicator<number> = (newLum) => (currentColor) => {
  const newColor = {
    ...currentColor,
    lum: pipe(currentColor.lum, become(newLum), clampInto([0, 1])),
  }
  console.log(newColor)
  return newColor
}
export const tint =
  (tintAmount: number): Modifier<LuumSpec> =>
  (color) =>
    setLum((lum) => (lum * 100 + tintAmount) / 100)(color)

export const shade =
  (shadeAmount: number): Modifier<LuumSpec> =>
  (color) =>
    setLum((lum) => (lum * 100 - shadeAmount) / 100)(color)
