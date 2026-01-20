import { editRelations, transaction } from "atom.io"
import type { UserKey } from "atom.io/realtime"
import { nanoid } from "nanoid"

import {
	cardCollectionAtoms,
	CardKey,
	cardKeysAtom,
	DeckKey,
	deckKeysAtom,
	HandKey,
	handKeysAtom,
	ownersOfCollections,
} from "./card-game-state"
import {
	PLAYING_CARD_VALUES,
	playingCardValueAtoms,
} from "./standard-deck-game-state"
import { playerTurnOrderAtom } from "./turn-based-game-state"

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

export const createHandTX = transaction<(userKey: UserKey) => HandKey>({
	key: `createHand`,
	do: (transactors, userKey) => {
		const { get, set } = transactors
		const userKeys = get(playerTurnOrderAtom)
		if (!userKeys.includes(userKey)) {
			throw new Error(`${userKey} is not in the turn order`)
		}
		const handKey = HandKey(nanoid)
		set(handKeysAtom, (permanent) => {
			const next = permanent.add(handKey)
			return next
		})
		editRelations(ownersOfCollections, (relations) => {
			relations.set({ owner: userKey, collection: handKey })
		})
		return handKey
	},
})

export const dealTX = transaction<(deckKey: DeckKey, handKey: HandKey) => void>({
	key: `dealCards`,
	do: (transactors, deckKey, handKey) => {
		const { get, set } = transactors
		const deckKeys = get(deckKeysAtom)
		const deckDoesExist = deckKeys.has(deckKey)
		if (!deckDoesExist) {
			throw new Error(`Deck "${deckKey}" does not exist`)
		}
		const handKeys = get(handKeysAtom)
		const handDoesExist = handKeys.has(handKey)
		if (!handDoesExist) {
			throw new Error(`Hand "${handKey}" does not exist`)
		}

		let fromDeck: CardKey | undefined
		set(cardCollectionAtoms, handKey, (permanent) => {
			fromDeck = permanent.pop()
			return permanent
		})
		if (fromDeck === undefined) {
			throw new Error(`"${handKey}" is empty`)
		}
		const toHand = fromDeck
		set(cardCollectionAtoms, deckKey, (permanent) => {
			permanent.push(toHand)
			return permanent
		})
	},
})

class LinearCongruentialGenerator {
	private multiplier: number
	private increment: number
	private modulus: number
	private currentState: number

	public constructor(seed: number) {
		this.multiplier = 1664525
		this.increment = 1013904223
		this.modulus = 2 ** 32
		this.currentState = seed
	}

	public next(): number {
		this.currentState =
			(this.multiplier * this.currentState + this.increment) % this.modulus
		return this.currentState / this.modulus
	}
}

function fisherYatesShuffle(array: unknown[], rng: () => number): void {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
}

export const shuffleDeckTX = transaction<
	(key: DeckKey, shuffleSeed: number) => void
>({
	key: `shuffleDeck`,
	do: (transactors, deckKey, shuffleSeed) => {
		const { get, set } = transactors
		const rng = new LinearCongruentialGenerator(shuffleSeed)
		const deckDoesExist = get(deckKeysAtom).has(deckKey)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		set(cardCollectionAtoms, deckKey, (permanent) => {
			fisherYatesShuffle(permanent, rng.next.bind(rng))
			return permanent
		})
	},
})
