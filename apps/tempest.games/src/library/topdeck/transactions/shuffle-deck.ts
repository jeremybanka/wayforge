import { editRelations, findRelations, transaction } from "atom.io"

import { deckIndex, groupsOfCards } from "../card-game-stores"

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
export const shuffleDeckTX = transaction<
	(deckId: string, shuffleSeed: number) => void
>({
	key: `shuffleDeck`,
	do: (transactors, deckId, shuffleSeed) => {
		const { get } = transactors
		const rng = new LinearCongruentialGenerator(shuffleSeed)
		const deckDoesExist = get(deckIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		// const deckCardIndex = find(groupsOfCards.states.cardKeysOfGroup, deckId)
		const deckCardIndex = findRelations(groupsOfCards, deckId).cardKeysOfGroup
		const cardIds = get(deckCardIndex)
		const shuffledCardIds = cardIds.toSorted(() => rng.next() - 0.5)
		editRelations(groupsOfCards, (relations) => {
			relations.replaceRelations(deckId, shuffledCardIds)
		})
		if (typeof global !== `undefined`) {
			console.log(`Shuffled deck "${deckId}"`)
		}
	},
})
