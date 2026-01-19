import { findRelations, selector } from "atom.io"
import { myRoomKeySelector } from "atom.io/realtime-client"

import type { DeckKey } from "../../../../../library/game-systems/card-game-stores"
import {
	deckKeysAtom,
	ownersOfCollections,
} from "../../../../../library/game-systems/card-game-stores"

export const publicDeckKeysSelector = selector<DeckKey[]>({
	key: `publicDeckKeys`,
	get: ({ get }) => {
		const publicDeckKeys: DeckKey[] = []
		const myRoomKey = get(myRoomKeySelector)
		if (!myRoomKey) {
			return publicDeckKeys
		}
		const deckKeys = get(deckKeysAtom)
		for (const deckKey of deckKeys) {
			const ownerOfDeck = get(
				findRelations(ownersOfCollections, deckKey).ownerKeyOfCollection,
			)
			if (ownerOfDeck === null) {
				publicDeckKeys.push(deckKey)
			}
		}
		return publicDeckKeys
	},
})
