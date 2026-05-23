import { atom, selector, Silo } from "atom.io"

const store = new Silo({
	name: `guide-laziness`,
	lifespan: `ephemeral`,
	isProduction: false,
})

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const doubledSelector = selector<number>({
	key: `doubled`,
	get: ({ get }) => {
		console.log(`computing doubledSelector`)
		return get(countAtom) * 2
	},
})

store.setState(countAtom, 2)
// Still nothing logged. No one has asked for doubledSelector yet.

store.getState(doubledSelector)
// Logs once and returns 4.
