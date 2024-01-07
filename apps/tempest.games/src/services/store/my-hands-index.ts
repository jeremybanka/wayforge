import * as AtomIO from "atom.io"
import { myIdState } from "atom.io/realtime-client"

import { handIndices, ownersOfGroups } from "~/apps/node/lodge/src/store/game"
import { myRoomState } from "./my-room"

export const myHandsIndex = AtomIO.selector<string[]>({
	key: `myHands`,
	get: ({ get, find }) => {
		const myId = get(myIdState)
		const myRoomId = get(myRoomState)
		if (!myId || !myRoomId) {
			return []
		}
		const { groupKeysOfPlayer } = ownersOfGroups.findState
		const myCardGroupIds = get(find(groupKeysOfPlayer, myId))
		const allHandIds = get(find(handIndices, myRoomId))
		const myHandIds = myCardGroupIds.filter((handId) => allHandIds.has(handId))
		return myHandIds
	},
})
