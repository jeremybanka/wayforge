import { editRelations, transaction } from "atom.io"

import { cardKeysAtom } from "../card-game-stores"
import * as CardGroups from "../card-game-stores/card-groups-store"
import {
	cardValueIndex,
	valuesOfCards,
} from "../card-game-stores/card-values-store"
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

		set(cardKeysAtom, (permanent) => {
			for (const cardId of cardIds) {
				permanent.add(cardId)
			}
			return permanent
		})
		set(cardValueIndex, (permanent) => {
			for (const { id: cardValueId } of CARD_VALUES) {
				permanent.add(cardValueId)
			}
			return permanent
		})

		editRelations(CardGroups.groupsOfCards, (relations) => {
			for (const cardId of cardIds) {
				relations.set({ card: cardId, group: deckId })
			}
		})
	},
})
