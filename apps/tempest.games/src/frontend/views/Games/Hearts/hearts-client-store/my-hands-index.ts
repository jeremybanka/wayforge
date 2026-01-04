import * as AtomIO from "atom.io"
import { findRelations } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { myUserKeyAtom } from "atom.io/realtime-client"

import { handIndex, ownersOfGroups } from "../../../../../library/topdeck"

export const myHandsIndex = AtomIO.selector<string[]>({
	key: `myHands`,
	get: ({ get }) => {
		const myUserKey = get(myUserKeyAtom)
		if (!myUserKey) {
			return []
		}
		console.log(`❗❗❗❗❗`, IMPLICIT.STORE)
		const myCardGroupIds = get(
			findRelations(ownersOfGroups, myUserKey).groupKeysOfPlayer,
		)
		const allHandIds = get(handIndex)
		const myHandIds = myCardGroupIds.filter((handId) => allHandIds.has(handId))
		console.log(`❗❗❗❗❗`, { myHandIds, myCardGroupIds, allHandIds })
		return myHandIds
	},
})
