import type { Modifier } from "../function"

export const clampInto =
	(min: number, max: number): Modifier<number> =>
	(value) =>
		value < min ? min : value > max ? max : value
