import { transaction } from "atom.io"

import { deckIndices, groupsOfCards } from "../card-groups"

export const shuffleDeckTX = transaction<
	(gameId: string, deckId: string) => void
>({
	key: `shuffleDeck`,
	do: (transactors, gameId, deckId) => {
		const { get, find, env } = transactors
		const deckIndex = find(deckIndices, gameId)
		const deckDoesExist = get(deckIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		const deckCardIndex = find(groupsOfCards.states.cardKeysOfGroup, deckId)
		const cardIds = get(deckCardIndex)
		const shuffledCardIds = cardIds.toSorted(() => Math.random() - 0.5)
		groupsOfCards.transact(transactors, ({ relations }) => {
			relations.replaceRelations(deckId, shuffledCardIds)
		})
		if (env().runtime === `node`) {
			console.log(`Shuffled deck "${deckId}"`)
		}
	},
})
