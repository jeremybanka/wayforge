import { atom, getState, selector, setState } from "atom.io"
import { type RootStore, Store } from "atom.io/internal"
import { afterEach, beforeEach } from "bun:test"
import { expect, test } from "vitest"

let STORE_TEMPLATE: Store
export function testWithClientStore(
	store: Store = ATOM_IO_IMPLICIT_STORE!,
): void {
	STORE_TEMPLATE = new Store(
		{ isProduction: false, lifespan: `ephemeral`, name: `TEMPLATE` },
		store,
	)
	afterEach(() => {
		globalThis.ATOM_IO_IMPLICIT_STORE = new Store(
			{ isProduction: false, lifespan: `ephemeral`, name: `TEST` },
			STORE_TEMPLATE,
		) as RootStore
	})
}

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const doubledSelector = selector<number>({
	key: `doubled`,
	get: ({ get }) => get(countAtom) * 2,
})

beforeEach(() => {})

test(`doubledSelector can be tested without React`, () => {
	setState(countAtom, 3)
	expect(getState(doubledSelector)).toBe(6)
})
