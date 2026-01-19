import { transaction } from "atom.io"
import { nanoid } from "nanoid"

import {
	cardCollectionAtoms,
	CardKey,
	cardKeysAtom,
	DeckKey,
	deckKeysAtom,
} from "../card-game-stores"
import {
	PLAYING_CARD_VALUES,
	playingCardValueAtoms,
} from "../standard-deck-game-state"

export const createClassicDeckTX = transaction<() => DeckKey>({
	key: `createClassicDeck`,
	do: (transactors) => {
		const deckKey = DeckKey(nanoid)
		const { set } = transactors
		set(deckKeysAtom, (permanent) => {
			permanent.add(deckKey)
			return permanent
		})
		for (const playingCardValue of PLAYING_CARD_VALUES) {
			const cardKey = CardKey(nanoid)
			set(playingCardValueAtoms, cardKey, playingCardValue)
			set(cardKeysAtom, (permanent) => {
				permanent.add(cardKey)
				return permanent
			})
			set(cardCollectionAtoms, deckKey, (permanent) => {
				permanent.push(cardKey)
				return permanent
			})
		}
		return deckKey
	},
})
