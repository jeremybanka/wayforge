import { findRelations, selector } from "atom.io"
import { myRoomKeySelector } from "atom.io/realtime-client"

import {
	deckKeysAtom,
	ownersOfGroups,
} from "../../../../../library/game-systems/card-game-stores"

export const publicDeckKeysSelector = selector<string[]>({
	key: `publicDeckKeys`,
	get: ({ get }) => {
		const myRoomKey = get(myRoomKeySelector)
		if (!myRoomKey) {
			return []
		}
		const deckIds = get(deckKeysAtom)
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
