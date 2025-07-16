import type { Modifier } from "anvl/function"
import { become, pipe } from "anvl/function"
import { clampInto } from "anvl/number"

import type { HSL, LuumSpec } from ".."
import { hexToSpec, specToHex } from ".."
import type { LuumApplicator } from "."

export const resetColor = (color: LuumSpec): LuumSpec =>
	pipe(color, specToHex, hexToSpec, (hsl: HSL) => ({
		...hsl,
		prefer: color.prefer,
	}))

export const setLum: LuumApplicator<number> = (newLum) => (currentColor) => {
	const newColor = {
		...currentColor,
		lum: pipe(currentColor.lum, become(newLum), clampInto(0, 1)),
	}
	return newColor
}
export const tintBy =
	(tintAmount: number): Modifier<LuumSpec> =>
	(color) =>
		setLum((lum) => (lum * 100 + tintAmount) / 100)(resetColor(color))

export const shadeBy =
	(shadeAmount: number): Modifier<LuumSpec> =>
	(color) =>
		setLum((lum) => (lum * 100 - shadeAmount) / 100)(resetColor(color))

export const tint = (color: LuumSpec, tintAmount: number): LuumSpec =>
	tintBy(tintAmount)(color)

export const shade = (color: LuumSpec, shadeAmount: number): LuumSpec =>
	shadeBy(shadeAmount)(color)
