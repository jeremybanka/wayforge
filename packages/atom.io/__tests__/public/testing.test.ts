import { atom, getState, selector, setState } from "atom.io"
import { takeSnapshot } from "atom.io/testing"

describe(`testing`, () => {
	it(`takes a snapshot and restores the implicit store while preserving setup state`, () => {
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubledSelector = selector<number>({
			key: `doubled`,
			get: ({ get }) => get(countAtom) * 2,
		})

		const { restore } = takeSnapshot()

		setState(countAtom, 3)
		expect(getState(doubledSelector)).toBe(6)

		restore()

		expect(getState(countAtom)).toBe(0)
		expect(getState(doubledSelector)).toBe(0)
	})
})
