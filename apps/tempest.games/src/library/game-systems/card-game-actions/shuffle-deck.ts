import { transaction } from "atom.io"

import type { DeckKey } from "../card-game-stores/card-collections-store"
import {
	cardCollectionAtoms,
	deckKeysAtom,
} from "../card-game-stores/card-collections-store"

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
