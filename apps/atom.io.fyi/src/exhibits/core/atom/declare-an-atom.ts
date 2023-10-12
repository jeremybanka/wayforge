import { atom } from "atom.io"

export const countState = atom<number>({
	key: `count`,
	default: 0,
})
