import { mapObject } from "anvl/object"
import type { ReadonlyRecord } from "fp-ts/ReadonlyRecord"

import { Perspective } from "../src"

function* createIterator(callback: (idx: number) => string): Generator<string> {
	let currentIteration = 0

	while (true) {
		yield callback(currentIteration)
		currentIteration++
	}
}

const IDX_ID = {
	style_000000_$: (idx: number) => `_${idx}`.padStart(8, `0`),
	style_$_000000: (idx: number) => `${idx}_`.padEnd(8, `0`),
} as const

const ID: ReadonlyRecord<keyof typeof IDX_ID, () => () => string> = mapObject(
	IDX_ID,
	(callback) => () => {
		const iterator = createIterator(callback)
		return () => iterator.next().value
	},
)

const idFn = ID.style_000000_$()

describe(`Perspective`, () => {
	it(`constructs`, () => {
		const perspective = new Perspective()
		expect(perspective).toBeInstanceOf(Perspective)
	})
	it(`virtualizes an Identifier`, () => {
		const perspective = new Perspective({ idFn })
		const virtualIdentifier = perspective.occlude({
			id: idFn(),
			type: `Card`,
			isVirtual: false,
		})
		expect(virtualIdentifier).toEqual({
			id: `000000_1`,
			type: `Card`,
			isVirtual: true,
		})
	})
})
