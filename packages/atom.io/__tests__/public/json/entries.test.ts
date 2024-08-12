import type { Entries } from "atom.io/json"
import { fromEntries } from "atom.io/json"

describe(`fromEntries`, () => {
	it(`type-safely converts an array of entries to an object`, () => {
		const myEntries = [
			[`a`, 1],
			[`b`, 1],
			[`c`, 1],
		] as const satisfies Entries
		const { a, b, c } = fromEntries(myEntries)
		expect(a + b + c).toBe(3)
	})
})
