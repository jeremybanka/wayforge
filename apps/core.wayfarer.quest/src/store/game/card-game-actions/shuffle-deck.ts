import { transaction } from "atom.io"

import { editRelations, findRelations } from "atom.io/data"
import { IMPLICIT } from "atom.io/internal"
import { deckIndex, groupsOfCards } from "../card-game-stores/card-groups-store"

const rngOut: number[] = []

function LCG(seed: number) {
	const a = 1664525
	const c = 1013904223
	const m = 2 ** 32

	let state = seed

	this.next = (): number => {
		state = (a * state + c) % m
		const n = state / m
		rngOut.push(n)
		return n
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
		const { get, env } = transactors
		const rng = new LCG(shuffleSeed)
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
		if (env().global) {
			// process.stderr.write(`Shuffled deck "${deckId}"`)
			// process.stderr.write(`🎲 ${rngOut.join(` `)}`)
		}
	},
})
