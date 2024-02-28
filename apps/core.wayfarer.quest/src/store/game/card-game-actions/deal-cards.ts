import { transaction } from "atom.io"

import * as CardGroups from "../card-game-stores/card-groups-store"

export const dealCardsTX = transaction<
	(deckId: string, handId: string, count: number) => { cardIds: string[] }
>({
	key: `dealCards`,
	do: (transactors, deckId, handId, count) => {
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
			find(CardGroups.groupsOfCards.states.cardKeysOfGroup, deckId),
		)
		if (deckCardIds.length < count) {
			throw new Error(`Not enough cards in deck "${deckId}" to deal ${count}`)
		}
		const cardIds = deckCardIds.slice(-count)

		CardGroups.groupsOfCards.transact(transactors, ({ relations }) => {
			for (const cardId of cardIds) {
				relations.set({ card: cardId, group: handId })
			}
		})

		return { cardIds }
	},
})
