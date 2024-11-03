import * as AtomIO from "atom.io"
import { findRelations } from "atom.io/data"
import { IMPLICIT } from "atom.io/internal"
import { myUsernameState } from "atom.io/realtime-client"

import type { HandKey } from "~/apps/core.wayfarer.quest/src/store/game"
import {
	handIndex,
	isHandKey,
	ownersOfGroups,
} from "~/apps/core.wayfarer.quest/src/store/game"

export const myHandsIndex = AtomIO.selector<HandKey[]>({
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
		const myHandIds = myCardGroupIds.filter(
			(myCardGroupId): myCardGroupId is HandKey =>
				isHandKey(myCardGroupId) && allHandIds.has(myCardGroupId),
		)
		console.log(`❗❗❗❗❗`, { myHandIds, myCardGroupIds, allHandIds })
		return myHandIds
	},
})
