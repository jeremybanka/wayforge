import * as AtomIO from "atom.io"
import { findRelations } from "atom.io"
import { myRoomKeySelector } from "atom.io/realtime-client"

import { deckIndex, ownersOfGroups } from "../../../../../library/topdeck"

export const publicDeckIndex = AtomIO.selector<string[]>({
	key: `publicDeckIndex`,
	get: ({ get }) => {
		const myRoomKey = get(myRoomKeySelector)
		if (!myRoomKey) {
			return []
		}
		const deckIds = get(deckIndex)
		const unownedDeckIds = [...deckIds].filter((deckId) => {
			const ownerOfDeck = get(
				findRelations(ownersOfGroups, deckId).playerKeyOfGroup,
			)
			const deckIsNotOwned = ownerOfDeck === null
			return deckIsNotOwned
		})
		return unownedDeckIds
	},
})
