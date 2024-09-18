import { atom, transaction } from "atom.io"
import { continuity } from "atom.io/realtime"

export const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

export const incrementTX = transaction({
	key: `incrementTX`,
	do: ({ set }) => {
		set(countAtom, (current) => current + 1)
	},
})

export const countContinuity = continuity({
	key: `countContinuity`,
	config: (group) => group.add(countAtom).add(incrementTX),
})
