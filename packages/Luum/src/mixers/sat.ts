import { pipe } from "fp-ts/function"

import type { Modifier } from "~/packages/anvl/src/function"
import { become } from "~/packages/anvl/src/function"
import { clampInto } from "~/packages/anvl/src/number/clamp"

import type { LuumApplicator } from "."
import type { LuumSpec } from ".."

export const setSat: LuumApplicator<number> = (newSat) => (currentColor) => {
	const newColor = {
		...currentColor,
		sat: pipe(currentColor.sat, become(newSat), clampInto([0, 255])),
	}
	console.log(newColor)
	return newColor
}
export const ampBy =
	(value: number): Modifier<LuumSpec> =>
	(color) =>
		setSat((sat) => sat + value)(color)

export const muteBy =
	(value: number): Modifier<LuumSpec> =>
	(color) =>
		setSat((sat) => sat - value)(color)

export const amp = (color: LuumSpec, value: number): LuumSpec =>
	ampBy(value)(color)

export const mute = (color: LuumSpec, value: number): LuumSpec =>
	muteBy(value)(color)
