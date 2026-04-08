import { atom, selector, Silo } from "atom.io"
import { expect, test } from "vitest"

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const doubledSelector = selector<number>({
	key: `doubled`,
	get: ({ get }) => get(countAtom) * 2,
})

test(`doubledSelector can be tested without React`, () => {
	const store = new Silo({
		name: `guide-test`,
		lifespan: `ephemeral`,
		isProduction: false,
	})

	store.setState(countAtom, 3)

	expect(store.getState(doubledSelector)).toBe(6)
})
