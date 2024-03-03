import type { ReadableToken, RegularAtomToken } from "atom.io"
import { atom, atomFamily, belongsTo, isToken, setState } from "atom.io"

describe(`validators`, () => {
	describe(`isToken`, () => {
		it(`returns true for a match, and infers the type`, () => {
			const knownToken: RegularAtomToken<number> = atom({
				key: `count`,
				default: 0,
			})
			const unknownToken: ReadableToken<number> = { type: `atom`, key: `count` }
			const result = isToken(knownToken, unknownToken)
			expect(result).toBe(true)
			if (result) {
				setState(unknownToken, 5)
			}
		})

		it(`returns false for a mismatch`, () => {
			const knownToken: RegularAtomToken<number> = { type: `atom`, key: `count` }
			const unknownToken: ReadableToken<number> = {
				type: `readonly_selector`,
				key: `count2`,
			}
			expect(isToken(knownToken, unknownToken)).toBe(false)
		})
	})

	describe(`belongsTo`, () => {
		it(`returns true for a match, and infers the type`, () => {
			const family = atomFamily({
				key: `count`,
				default: 0,
			})
			const unknownToken: ReadableToken<number> = {
				type: `atom`,
				key: `count("a")`,
				family: { key: `count`, subKey: `"a"` },
			}
			const result = belongsTo(family, unknownToken)
			expect(result).toBe(true)
			if (result) {
				setState(unknownToken, 5)
			}
		})
		it(`returns false for a mismatch`, () => {
			const family = atomFamily({
				key: `count`,
				default: 0,
			})
			const unknownToken: ReadableToken<number> = {
				type: `selector`,
				key: `name("a")`,
				family: { key: `name`, subKey: `"a"` },
			}
			expect(belongsTo(family, unknownToken)).toBe(false)
		})
	})
})
