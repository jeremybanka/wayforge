import type { ReadableToken, RegularAtomToken } from "atom.io"
import { atom, atomFamily, belongsTo, isToken, setState } from "atom.io"
import * as Internal from "atom.io/internal"

beforeEach(() => {
	Internal.clearStore(Internal.IMPLICIT.STORE)
})

describe(`validators`, () => {
	describe(`isToken`, () => {
		it(`returns true for a match, and infers the type`, () => {
			const countAtom: RegularAtomToken<number> = atom<number>({
				key: `count`,
				default: 0,
			})
			const unknownToken: ReadableToken<number> = { type: `atom`, key: `count` }
			const result = isToken(countAtom, unknownToken)
			expect(result).toBe(true)
			if (result) {
				setState(unknownToken, 5)
			}
		})

		it(`returns false for a mismatch`, () => {
			const knownToken: RegularAtomToken<number> = { type: `atom`, key: `count` }
			const unknownToken: ReadableToken<number> = {
				type: `readonly_pure_selector`,
				key: `count2`,
			}
			expect(isToken(knownToken, unknownToken)).toBe(false)
		})
	})

	describe(`belongsTo`, () => {
		it(`returns true for a match, and infers the type`, () => {
			const countAtoms = atomFamily<number, string>({
				key: `count`,
				default: 0,
			})
			const unknownToken: ReadableToken<number> = {
				type: `atom`,
				key: `count("a")`,
				family: { key: `count`, subKey: `"a"` },
			}
			const result = belongsTo(countAtoms, unknownToken)
			expect(result).toBe(true)
		})
		it(`returns false for a mismatch`, () => {
			const countAtoms = atomFamily<number, string>({
				key: `count`,
				default: 0,
			})
			const unknownToken: ReadableToken<number> = {
				type: `writable_pure_selector`,
				key: `name("a")`,
				family: { key: `name`, subKey: `"a"` },
			}
			expect(belongsTo(countAtoms, unknownToken)).toBe(false)
		})
	})
})
