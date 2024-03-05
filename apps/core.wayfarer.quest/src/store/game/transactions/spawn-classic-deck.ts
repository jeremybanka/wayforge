import { transaction } from "atom.io"

import { editRelations } from "atom.io/data"
import * as CardGroups from "../card-game-stores/card-groups-store"
import {
	cardValueIndex,
	valuesOfCards,
} from "../card-game-stores/card-values-store"
import { cardIndex } from "../card-game-stores/cards-store"
import { CARD_VALUES } from "../playing-card-data"

export const spawnClassicDeckTX = transaction<
	(deckId: string, cardIds: string[]) => void
>({
	key: `spawnClassicDeck`,
	do: (transactors, deckId, cardIds) => {
		if (cardIds.length !== 52) {
			throw new Error(`${cardIds.length} cards were provided. 3 were expected`)
		}
		const { set, find } = transactors
		const deckState = find(CardGroups.deckAtoms, deckId)
		set(deckState, { type: `deck`, name: `Classic 52-Card Deck` })

		set(CardGroups.deckIndex, (current) => {
			current.add(deckId)
			return current
		})

		editRelations(valuesOfCards, (relations) => {
			let idx = 0
			for (const cardId of cardIds) {
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
		set(cardValueIndex, (current) => {
			current.transaction((next) => {
				for (const { id: cardValueId } of CARD_VALUES) {
					next.add(cardValueId)
				}
				return true
			})
			return current
		})

		editRelations(CardGroups.groupsOfCards, (relations) => {
			relations.replaceRelations(deckId, cardIds)
		})
	},
})
