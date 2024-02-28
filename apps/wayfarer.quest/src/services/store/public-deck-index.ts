import * as AtomIO from "atom.io"

import {
	deckIndex,
	ownersOfGroups,
} from "~/apps/core.wayfarer.quest/src/store/game"
import { myRoomKeyState } from "./my-room"

export const publicDeckIndex = AtomIO.selector<string[]>({
	key: `publicDeckIndex`,
	get: ({ get, find }) => {
		const myRoomId = get(myRoomKeyState)
		if (!myRoomId) {
			return []
		}
		const deckIds = get(deckIndex)
		const unownedDeckIds = [...deckIds].filter((deckId) => {
			const { playerKeyOfGroup } = ownersOfGroups.states
			const ownerOfDeck = get(find(playerKeyOfGroup, deckId))
			const deckIsNotOwned = ownerOfDeck === null
			return deckIsNotOwned
		})
		return unownedDeckIds
	},
})
