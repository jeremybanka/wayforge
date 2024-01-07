import { transaction } from "atom.io"

import * as CardGroups from "../card-groups"

export const dealCardsTX = transaction<
	(
		gameId: string,
		deckId: string,
		handId: string,
		count: number,
	) => { cardIds: string[] }
>({
	key: `dealCards`,
	do: (transactors, gameId, deckId, handId, count) => {
		const { get, find } = transactors
		const deckIndex = find(CardGroups.deckIndices, gameId)
		const deckIds = get(deckIndex)
		const deckDoesExist = deckIds.has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck "${deckId}" does not exist`)
		}
		const handIndex = find(CardGroups.handIndices, gameId)
		const handIds = get(handIndex)
		const handDoesExist = handIds.has(handId)
		if (!handDoesExist) {
			throw new Error(`Hand "${handId}" does not exist`)
		}

		const deckCardIds = get(
			find(CardGroups.groupsOfCards.findState.cardKeysOfGroup, deckId),
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
