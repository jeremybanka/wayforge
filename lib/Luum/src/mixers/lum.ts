import { pipe } from "fp-ts/lib/function"

import type { Modifier } from "~/lib/Anvil/function"
import { become } from "~/lib/Anvil/function"
import { clampInto } from "~/lib/Anvil/number/clamp"

import type { LuumApplicator } from "."
import { specToHex, hexToSpec } from ".."
import type { LuumSpec } from "^"

export const setLum: LuumApplicator<number> = (newLum) => (currentColor) => {
  const newColor = {
    ...currentColor,
    lum: pipe(currentColor.lum, become(newLum), clampInto([0, 1])),
  }
  return newColor
}
export const tintBy =
  (tintAmount: number): Modifier<LuumSpec> =>
  (color) =>
    setLum((lum) => (lum * 100 + tintAmount) / 100)(
      pipe(color, specToHex, hexToSpec)
    )

export const shadeBy =
  (shadeAmount: number): Modifier<LuumSpec> =>
  (color) =>
    setLum((lum) => (lum * 100 - shadeAmount) / 100)(
      pipe(color, specToHex, hexToSpec)
    )

export const tint = (color: LuumSpec, tintAmount: number): LuumSpec =>
  tintBy(tintAmount)(color)

export const shade = (color: LuumSpec, shadeAmount: number): LuumSpec =>
  shadeBy(shadeAmount)(color)
