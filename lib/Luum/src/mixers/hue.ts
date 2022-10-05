import { pipe } from "fp-ts/lib/function"

import type { Modifier } from "~/lib/fp-tools"
import { become, wrapInto } from "~/lib/fp-tools"

import type { LuumApplicator } from "."
import type { LuumSpec } from ".."

export const setHue: LuumApplicator<number> = (newHue) => (currentColor) => {
  const newColor = {
    ...currentColor,
    hue: pipe(currentColor.hue, become(newHue), wrapInto([0, 360])),
  }
  console.log(newColor)
  return newColor
}
export const trine =
  (value: number): Modifier<LuumSpec> =>
  (color) =>
    setHue((hue) => hue + value * 120)(color)

export const tetra =
  (value: number): Modifier<LuumSpec> =>
  (color) =>
    setHue((hue) => hue + value * 90)(color)

export const splitBy =
  (value: number): Modifier<LuumSpec> =>
  (color) =>
    setHue((hue) => hue + value * 150)(color)
