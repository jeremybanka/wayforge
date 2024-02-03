import * as AtomIO from "atom.io"
import { myIdState } from "atom.io/realtime-client"

import { handIndex, ownersOfGroups } from "~/apps/node/lodge/src/store/game"
import { myRoomKeyState } from "./my-room"

export const myHandsIndex = AtomIO.selector<string[]>({
	key: `myHands`,
	get: ({ get, find }) => {
		const myId = get(myIdState)
		const myRoomId = get(myRoomKeyState)
		if (!myId || !myRoomId) {
			return []
		}
		const { groupKeysOfPlayer } = ownersOfGroups.states
		const myCardGroupIds = get(find(groupKeysOfPlayer, myId))
		const allHandIds = get(handIndex)
		const myHandIds = myCardGroupIds.filter((handId) => allHandIds.has(handId))
		return myHandIds
	},
})
