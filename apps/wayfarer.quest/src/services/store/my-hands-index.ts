import * as AtomIO from "atom.io"
import { findRelations } from "atom.io/data"
import { IMPLICIT } from "atom.io/internal"
import { myUsernameState } from "atom.io/realtime-client"

import {
	handIndex,
	ownersOfGroups,
} from "~/apps/core.wayfarer.quest/src/store/game"

export const myHandsIndex = AtomIO.selector<string[]>({
	key: `myHands`,
	get: ({ get }) => {
		const myUsername = get(myUsernameState)
		if (!myUsername) {
			return []
		}
		console.log(`❗❗❗❗❗`, IMPLICIT.STORE)
		const myCardGroupIds = get(
			findRelations(ownersOfGroups, myUsername).groupKeysOfPlayer,
		)
		const allHandIds = get(handIndex)
		const myHandIds = myCardGroupIds.filter((handId) => allHandIds.has(handId))
		console.log(`❗❗❗❗❗`, { myHandIds, myCardGroupIds, allHandIds })
		return myHandIds
	},
})
