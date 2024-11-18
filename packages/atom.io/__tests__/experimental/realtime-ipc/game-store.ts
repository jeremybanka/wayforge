import { atom, atomFamily } from "atom.io"
import { continuity } from "atom.io/realtime"

export const letterAtoms = atomFamily<string | null, `letter::${number}`>({
	key: `letter`,
	default: null,
})
export const letterIndex = atom<`letter::${number}`[]>({
	key: `letterIndex`,
	default: Array.from({ length: 5 }).map((_, i) => `letter::${i}` as const),
})

export const gameContinuity = continuity({
	key: `game`,
	config: (group) => group.dynamic(letterIndex, letterAtoms),
})
