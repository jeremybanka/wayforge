import type { LuumSpec } from ".."
import { become, type Modifier, pipe, wrapInto } from "../utils/internal"
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
