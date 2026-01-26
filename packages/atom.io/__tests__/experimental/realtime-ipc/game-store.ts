import type { RegularAtomFamilyToken, RegularAtomToken } from "atom.io"
import { atomFamily, findState } from "atom.io"
import type { ContinuityToken } from "atom.io/realtime"
import { continuity } from "atom.io/realtime"

export const letterAtoms: RegularAtomFamilyToken<string | null, number> =
	atomFamily({
		key: `letter`,
		default: null,
	})
export const letterTokensAtoms: RegularAtomFamilyToken<
	RegularAtomToken<string | null>[],
	string
> = atomFamily({
	key: `letterTokens`,
	default: Array.from({ length: 5 }).map((_, i) => findState(letterAtoms, i)),
})

export const gameContinuity: ContinuityToken = continuity({
	key: `game`,
	config: (group) => group.add(letterAtoms, letterTokensAtoms),
})
