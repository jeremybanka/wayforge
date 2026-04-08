import { atom, getState, selector, setState } from "atom.io"
import { resetImplicitStore } from "atom.io/testing"

describe(`testing`, () => {
	it(`resets the implicit store after each test while preserving setup state`, () => {
		const afterEachCallbacks: Array<() => void> = []
		const countAtom = atom<number>({
			key: `count`,
			default: 0,
		})
		const doubledSelector = selector<number>({
			key: `doubled`,
			get: ({ get }) => get(countAtom) * 2,
		})

		resetImplicitStore((callback) => {
			afterEachCallbacks.push(callback)
		})

		setState(countAtom, 3)
		expect(getState(doubledSelector)).toBe(6)

		afterEachCallbacks[0]?.()

		expect(getState(countAtom)).toBe(0)
		expect(getState(doubledSelector)).toBe(0)
	})
})
