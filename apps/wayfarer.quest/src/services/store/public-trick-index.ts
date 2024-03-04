import * as AtomIO from "atom.io"

import { findRelations } from "atom.io/data"
import {
	ownersOfGroups,
	trickIndex,
} from "~/apps/core.wayfarer.quest/src/store/game"
import { myRoomKeyState } from "./my-room"

export const publicTrickIndex = AtomIO.selector<string[]>({
	key: `publicTrickIndex`,
	get: ({ get }) => {
		const myRoomId = get(myRoomKeyState)
		if (!myRoomId) {
			return []
		}
		const trickIds = get(trickIndex)
		const unownedTrickIds = [...trickIds].filter((trickId) => {
			const { playerKeyOfGroup } = findRelations(ownersOfGroups, trickId)
			const ownerOfTrick = get(playerKeyOfGroup)
			const trickIsNotOwned = ownerOfTrick === null
			return trickIsNotOwned
		})
		return unownedTrickIds
	},
})
