import type { RegularAtomToken } from "atom.io"
import { atomFamily } from "atom.io"
import { continuity } from "atom.io/realtime"

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
