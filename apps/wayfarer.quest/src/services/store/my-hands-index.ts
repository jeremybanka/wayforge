import * as AtomIO from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { myUsernameState } from "atom.io/realtime-client"

import { handIndex, ownersOfGroups } from "~/apps/node/lodge/src/store/game"

export const myHandsIndex = AtomIO.selector<string[]>({
	key: `myHands`,
	get: ({ get, find }) => {
		const myUsername = get(myUsernameState)
		if (!myUsername) {
			return []
		}
		console.log(`❗❗❗❗❗`, IMPLICIT.STORE)
		const { groupKeysOfPlayer } = ownersOfGroups.states
		const myCardGroupIds = get(find(groupKeysOfPlayer, myUsername))
		const allHandIds = get(handIndex)
		const myHandIds = myCardGroupIds.filter((handId) => allHandIds.has(handId))
		console.log(`❗❗❗❗❗`, { myHandIds, myCardGroupIds, allHandIds })
		return myHandIds
	},
})
