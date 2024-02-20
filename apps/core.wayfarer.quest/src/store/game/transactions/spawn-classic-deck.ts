import { transaction } from "atom.io"

import * as CardGroups from "../card-groups"
import { cardValuesIndex, valuesOfCards } from "../card-values"
import { cardIndex, findCardState } from "../cards"
import { CARD_VALUES } from "../playing-card-data"

export const spawnClassicDeckTX = transaction<
	(gameId: string, deckId: string, cardIds: string[]) => void
>({
	key: `spawnClassicDeck`,
	do: (transactors, gameId, deckId, cardIds) => {
		if (cardIds.length !== 52) {
			throw new Error(`${cardIds.length} cards were provided. 52 were expected`)
		}
		const { set, find } = transactors
		const state = find(CardGroups.deckStates, deckId)
		set(state, { type: `deck`, name: `Classic 52-Card Deck` })

		const deckIndex = find(CardGroups.deckIndices, gameId)
		set(deckIndex, (current) => {
			current.add(deckId)
			return current
		})

		valuesOfCards.transact(transactors, ({ relations }) => {
			let idx = 0
			for (const cardId of cardIds) {
				set(findCardState(cardId), { rotation: 0 })
				relations.set({ card: cardId, value: CARD_VALUES[idx].id })
				idx++
			}
		})

		set(cardIndex, (current) => {
			current.transaction((next) => {
				for (const cardId of cardIds) {
					next.add(cardId)
				}
				return true
			})
			return current
		})
		set(cardValuesIndex, (current) => {
			current.transaction((next) => {
				for (const { id: cardValueId } of CARD_VALUES) {
					next.add(cardValueId)
				}
				return true
			})
			return current
		})

		CardGroups.groupsOfCards.transact(transactors, ({ relations }) => {
			relations.replaceRelations(deckId, cardIds)
		})
	},
})
