import { transaction } from "atom.io"

import * as CardGroups from "../card-groups"

export const shuffleDeckTX = transaction<
	(gameId: string, deckId: string) => void
>({
	key: `shuffleDeck`,
	do: (transactors, gameId, deckId) => {
		const { get, find, env } = transactors
		const deckIndex = find(CardGroups.deckIndices, gameId)
		const deckDoesExist = get(deckIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		const cardIds = get(
			CardGroups.groupsOfCards.findState.cardKeysOfGroup(deckId),
		)
		const shuffledCardIds = cardIds.sort(() => Math.random() - 0.5)
		CardGroups.groupsOfCards.transact(transactors, ({ relations }) => {
			relations.replaceRelations(deckId, shuffledCardIds)
		})
		if (env().runtime === `node`) {
			console.log(`Shuffled deck "${deckId}"`)
		}
	},
})
