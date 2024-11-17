import { transaction } from "atom.io"
import { editRelations, findRelations } from "atom.io/data"
import type { Actual } from "atom.io/realtime"
import type { UserKey } from "atom.io/realtime-server"

import * as CardGroups from "../card-game-stores/card-groups-store"
import type { CardKey } from "../card-game-stores/cards-store"

export const dealCardsTX = transaction<
	(
		userKey: UserKey<Actual>,
		deckKey: CardGroups.DeckKey,
		handKey: CardGroups.HandKey,
		count: number,
	) => { cardIds: CardKey[] }
>({
	key: `dealCards`,
	do: (transactors, _, deckId, handId, count) => {
		const { get, find } = transactors
		const deckIds = get(CardGroups.deckIndex)
		const deckDoesExist = deckIds.has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck "${deckId}" does not exist`)
		}
		const handIds = get(CardGroups.handIndex)
		const handDoesExist = handIds.has(handId)
		if (!handDoesExist) {
			throw new Error(`Hand "${handId}" does not exist`)
		}

		const deckCardIds = get(
			findRelations(CardGroups.groupsOfCards, deckId).cardKeysOfGroup,
		)
		if (deckCardIds.length < count) {
			throw new Error(`Not enough cards in deck "${deckId}" to deal ${count}`)
		}
		const cardIds = deckCardIds.slice(-count)

		editRelations(CardGroups.groupsOfCards, (relations) => {
			for (const cardId of cardIds) {
				relations.set({ card: cardId, group: handId })
			}
		})

		return { cardIds }
	},
})
