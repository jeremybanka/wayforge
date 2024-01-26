import type { RegularAtomToken } from "atom.io"
import { atom, atomFamily } from "atom.io"
import { continuity } from "../../realtime/src/realtime-continuity"

export const letterAtoms = atomFamily<string | null, number>({
	key: `letter`,
	default: null,
})
export const letterIndex = atomFamily<RegularAtomToken<string | null>[], string>(
	{
		key: `letterIndex`,
		default: Array.from({ length: 5 }).map((_, i) => letterAtoms(i)),
	},
)

export const gameContinuity = continuity({
	key: `game`,
	config: (group) => group.add(letterAtoms, letterIndex),
})
