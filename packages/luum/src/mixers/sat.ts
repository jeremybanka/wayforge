import type { Modifier } from "anvl/function"
import { become, pipe } from "anvl/function"
import { clampInto } from "anvl/number"

import type { LuumSpec } from ".."
import type { LuumApplicator } from "."

export const setSat: LuumApplicator<number> = (newSat) => (currentColor) => {
	const newColor = {
		...currentColor,
		sat: pipe(currentColor.sat, become(newSat), clampInto(0, 255)),
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
