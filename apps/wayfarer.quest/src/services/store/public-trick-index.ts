import * as AtomIO from "atom.io"

import { ownersOfGroups, trickIndex } from "~/apps/node/lodge/src/store/game"
import { myRoomKeyState } from "./my-room"

export const publicTrickIndex = AtomIO.selector<string[]>({
	key: `publicTrickIndex`,
	get: ({ get, find }) => {
		const myRoomId = get(myRoomKeyState)
		if (!myRoomId) {
			return []
		}
		const trickIds = get(trickIndex)
		const unownedTrickIds = [...trickIds].filter((trickId) => {
			const { playerKeyOfGroup } = ownersOfGroups.states
			const ownerOfTrick = get(find(playerKeyOfGroup, trickId))
			const trickIsNotOwned = ownerOfTrick === null
			return trickIsNotOwned
		})
		return unownedTrickIds
	},
})
