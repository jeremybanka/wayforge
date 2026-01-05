import { findRelations, selector } from "atom.io"
import { myRoomKeySelector, myUserKeyAtom } from "atom.io/realtime-client"

import { ownersOfGroups, trickKeysAtom } from "../../../../../library/topdeck"

export const publicTrickSelector = selector<string[]>({
	key: `publicTrickKeys`,
	get: ({ get }) => {
		const myUserKey = get(myUserKeyAtom)
		if (!myUserKey) {
			return []
		}
		const myRoomKey = get(myRoomKeySelector)
		if (!myRoomKey) {
			return []
		}
		const trickIds = get(trickKeysAtom)
		const unownedTrickIds = [...trickIds].filter((trickId) => {
			const { playerKeyOfGroup } = findRelations(ownersOfGroups, trickId)
			const ownerOfTrick = get(playerKeyOfGroup)
			const trickIsNotOwned = ownerOfTrick === null
			return trickIsNotOwned
		})
		return unownedTrickIds
	},
})
