import type { Modifier } from "anvl/function"
import { become, pipe } from "anvl/function"
import { wrapInto } from "anvl/number"

import type { LuumSpec } from ".."
import type { LuumApplicator } from "."

export const setHue: LuumApplicator<number> = (newHue) => (currentColor) => {
	const newColor = {
		...currentColor,
		hue: pipe(currentColor.hue, become(newHue), wrapInto(0, 360)),
	}
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
