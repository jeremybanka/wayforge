import { mapObject } from "anvl/object"
import type { ReadonlyRecord } from "fp-ts/ReadonlyRecord"

export function* createIterator(
	callback: (idx: number) => string,
): Generator<string> {
	let currentIteration = 0

	while (true) {
		yield callback(currentIteration)
		currentIteration++
	}
}

export const IDX_ID = {
	style_000000_$: (idx: number) => `_${idx}`.padStart(8, `0`),
	style_$_000000: (idx: number) => `${idx}_`.padEnd(8, `0`),
} as const

export const ID: ReadonlyRecord<keyof typeof IDX_ID, () => () => string> =
	mapObject(IDX_ID, (callback) => () => {
		const iterator = createIterator(callback)
		return () => iterator.next().value
	})
