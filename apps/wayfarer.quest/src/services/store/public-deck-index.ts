import * as AtomIO from "atom.io"
import { findRelations } from "atom.io/data"

import type { DeckKey } from "~/apps/core.wayfarer.quest/src/store/game"
import {
	deckIndex,
	ownersOfGroups,
} from "~/apps/core.wayfarer.quest/src/store/game"

import { myRoomKeyState } from "./my-room"

export const publicDeckIndex = AtomIO.selector<DeckKey[]>({
	key: `publicDeckIndex`,
	get: ({ get }) => {
		const myRoomId = get(myRoomKeyState)
		if (!myRoomId) {
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
