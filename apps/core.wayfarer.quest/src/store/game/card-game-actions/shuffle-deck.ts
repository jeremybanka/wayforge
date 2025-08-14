import { editRelations, findRelations, transaction } from "atom.io"

import { deckIndex, groupsOfCards } from "../card-game-stores/card-groups-store"

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

function fisherYatesShuffle<T>(array: T[], rng: () => number): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
	return array
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
		const deckCardIndex = findRelations(groupsOfCards, deckId).cardKeysOfGroup
		const cardIds = get(deckCardIndex)
		const shuffledCardIds = fisherYatesShuffle([...cardIds], rng.next)
		editRelations(groupsOfCards, (relations) => {
			relations.replaceRelations(deckId, shuffledCardIds)
		})
		// IMPLICIT.STORE.logger.info(
		// 	`🎲`,
		// 	`transaction`,
		// 	`shuffleDeck`,
		// 	deckId,
		// 	`seed:`,
		// 	shuffleSeed,
		// 	cardIds.join(` `),
		// 	`->`,
		// 	shuffledCardIds.join(` `),
		// 	rngOut.join(` `),
		// )
		if (typeof global !== `undefined`) {
			// process.stderr.write(`Shuffled deck "${deckId}"`)
			// process.stderr.write(`🎲 ${rngOut.join(` `)}`)
		}
	},
})
