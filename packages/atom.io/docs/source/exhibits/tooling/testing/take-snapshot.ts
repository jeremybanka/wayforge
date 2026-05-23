import { atom, getState, selector, setState } from "atom.io"
import { takeSnapshot } from "atom.io/testing"
import { afterEach, expect, test } from "vitest"

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const doubledSelector = selector<number>({
	key: `doubled`,
	get: ({ get }) => get(countAtom) * 2,
})

const snapshot = takeSnapshot()

afterEach(() => {
	snapshot.restore()
})

test(`doubledSelector can be tested without React`, () => {
	setState(countAtom, 3)
	expect(getState(doubledSelector)).toBe(6)
})

test(`the implicit store is reset after each test`, () => {
	expect(getState(doubledSelector)).toBe(0)
})
