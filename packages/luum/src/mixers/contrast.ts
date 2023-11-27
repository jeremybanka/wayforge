import type { Modifier } from "~/packages/anvl/src/function"
import type { HSL, LuumSpec } from "~/packages/luum/src"

export const contrastMax: Modifier<LuumSpec> = (color) => ({
	...color,
	lum: color.lum > 0.666 ? 0 : 1,
})

export const contrastStrong: Modifier<LuumSpec> = (color) => ({
	...color,
	lum: color.lum > 0.666 ? 0.05 : 0.95,
})

export const contrastSoft: Modifier<LuumSpec> = (color) =>
	color.lum > 0.75
		? { ...color, lum: color.lum / 2 }
		: color.lum < 0.25
		  ? { ...color, lum: color.lum + (1 - color.lum) / 2 }
		  : { ...color, lum: color.lum > 0.666 ? 1 : 0 }

export const offset =
	(offsetAmount: number): Modifier<HSL> =>
	(color) => ({
		...color,
		lum: color.lum > 0.666 ? color.lum - offsetAmount : color.lum + offsetAmount,
	})
