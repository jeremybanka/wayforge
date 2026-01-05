import { atom, atomFamily, selector } from "atom.io"

export const playerScoreAtoms = atomFamily<number, string>({
	key: `playerScore`,
	default: 0,
})
