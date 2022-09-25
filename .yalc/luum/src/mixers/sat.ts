import { pipe } from "fp-ts/lib/function"

import type { Modifier } from "~/lib/fp-tools"
import { clampInto, to } from "~/lib/fp-tools"

import type { LuumApplicator } from "."
import type { LuumSpec } from ".."

export const setSat: LuumApplicator<number> = (newSat) => (currentColor) => {
  const newColor = {
    ...currentColor,
    sat: pipe(currentColor.sat, to(newSat), clampInto([0, 255])),
  }
  console.log(newColor)
  return newColor
}
export const amp =
  (value: number): Modifier<LuumSpec> =>
  (color) =>
    setSat((sat) => sat + value)(color)

export const mute =
  (value: number): Modifier<LuumSpec> =>
  (color) =>
    setSat((sat) => sat - value)(color)
