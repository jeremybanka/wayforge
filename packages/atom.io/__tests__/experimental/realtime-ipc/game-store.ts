import type { RegularAtomToken } from "atom.io"
import { atomFamily } from "atom.io"
import { findState } from "atom.io/ephemeral"
import { continuity } from "atom.io/realtime"
import type { UserKey } from "atom.io/realtime-server"

export const letterAtoms = atomFamily<string | null, number>({
	key: `letter`,
	default: null,
})
export const letterIndex = atomFamily<
	RegularAtomToken<string | null>[],
	UserKey
>({
	key: `letterIndex`,
	default: Array.from({ length: 5 }).map((_, i) => findState(letterAtoms, i)),
})

export const gameContinuity = continuity({
	key: `game`,
	config: (group) => group.add(letterAtoms, letterIndex),
})
