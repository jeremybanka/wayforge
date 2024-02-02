import { transaction } from "atom.io"

import * as CardGroups from "../card-game-stores/card-groups-store"
import {
	cardValuesIndex,
	valuesOfCards,
} from "../card-game-stores/card-values-store"
import { cardIndex, findCardState } from "../card-game-stores/cards-store"
import { CARD_VALUES } from "../playing-card-data"

export const spawnClassicDeckTX = transaction<
	(deckId: string, cardIds: string[]) => void
>({
	key: `spawnClassicDeck`,
	do: (transactors, deckId, cardIds) => {
		if (cardIds.length !== 52) {
			throw new Error(`${cardIds.length} cards were provided. 52 were expected`)
		}
		const { set, find } = transactors
		const deckState = find(CardGroups.deckStates, deckId)
		set(deckState, { type: `deck`, name: `Classic 52-Card Deck` })

		set(CardGroups.deckIndex, (current) => {
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
