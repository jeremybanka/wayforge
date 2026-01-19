import { transaction } from "atom.io"

import type { CardKey } from "../card-game-stores"
import * as CardGroups from "../card-game-stores/card-collections-store"

export const dealTX = transaction<
	(deckKey: CardGroups.DeckKey, handKey: CardGroups.HandKey) => void
>({
	key: `dealCards`,
	do: (transactors, deckKey, handKey) => {
		const { get, set } = transactors
		const deckKeys = get(CardGroups.deckKeysAtom)
		const deckDoesExist = deckKeys.has(deckKey)
		if (!deckDoesExist) {
			throw new Error(`Deck "${deckKey}" does not exist`)
		}
		const handKeys = get(CardGroups.handKeysAtom)
		const handDoesExist = handKeys.has(handKey)
		if (!handDoesExist) {
			throw new Error(`Hand "${handKey}" does not exist`)
		}

		let fromDeck: CardKey | undefined
		set(CardGroups.cardCollectionAtoms, handKey, (current) => {
			fromDeck = current.pop()
			return current
		})
		if (fromDeck === undefined) {
			throw new Error(`"${handKey}" is empty`)
		}
		const toHand = fromDeck
		set(CardGroups.cardCollectionAtoms, deckKey, (current) => {
			current.push(toHand)
			return current
		})
	},
})
