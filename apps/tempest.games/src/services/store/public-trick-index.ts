import * as AtomIO from "atom.io"

import * as CardGroups from "~/apps/node/lodge/src/store/game/card-groups"
import { myRoomState } from "./my-room"

export const publicTrickIndex = AtomIO.selector<string[]>({
	key: `publicTrickIndex`,
	get: ({ get, find }) => {
		const myRoomId = get(myRoomState)
		if (!myRoomId) {
			return []
		}
		const trickIndex = find(CardGroups.trickIndices, myRoomId)
		const trickIds = get(trickIndex)
		const unownedTrickIds = [...trickIds].filter((trickId) => {
			const { playerKeyOfGroup } = CardGroups.ownersOfGroups.findState
			const ownerOfTrick = get(find(playerKeyOfGroup, trickId))
			const trickIsNotOwned = ownerOfTrick === null
			return trickIsNotOwned
		})
		return unownedTrickIds
	},
})
