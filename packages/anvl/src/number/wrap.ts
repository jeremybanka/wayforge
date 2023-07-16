import type { Modifier } from "../function"

export const wrapInto =
	(min: number, max: number): Modifier<number> =>
	(value) =>
		value < min
			? max - ((min - value) % (max - min))
			: min + ((value - min) % (max - min))
