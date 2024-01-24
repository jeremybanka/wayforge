import { atom, atomFamily } from "atom.io"

export const letterIndex = atom({
	key: `letterIndex`,
	default: [0, 1, 2, 3, 4],
})

export const letterAtoms = atomFamily<string | null, number>({
	key: `letter`,
	default: null,
})
