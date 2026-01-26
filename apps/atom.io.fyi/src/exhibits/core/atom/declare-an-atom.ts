import { atom } from "atom.io"

export const countAtom = atom<number>({
	key: `count`,
	default: 0,
})
