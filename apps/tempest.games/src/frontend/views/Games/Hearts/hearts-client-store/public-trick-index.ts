import * as AtomIO from "atom.io"
import { findRelations } from "atom.io"
import { myRoomKeySelector, myUserKeyAtom } from "atom.io/realtime-client"

import { ownersOfGroups, trickIndex } from "../../../../../library/topdeck"

export const publicTrickIndex = AtomIO.selector<string[]>({
	key: `publicTrickIndex`,
	get: ({ get }) => {
		const myUserKey = get(myUserKeyAtom)
		if (!myUserKey) {
			return []
		}
		const myRoomKey = get(myRoomKeySelector)
		if (!myRoomKey) {
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
