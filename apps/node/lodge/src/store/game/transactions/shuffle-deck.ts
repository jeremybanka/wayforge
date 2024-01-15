import { transaction } from "atom.io"

import { deckIndices, groupsOfCards } from "../card-groups"

function LCG(seed: number) {
	// LCG parameters
	const a = 1664525
	const c = 1013904223
	const m = 2 ** 32

	let state = seed

	this.next = (): number => {
		state = (a * state + c) % m
		return state / m
	}
}

export const shuffleDeckTX = transaction<
	(gameId: string, deckId: string, shuffleSeed: number) => void
>({
	key: `shuffleDeck`,
	do: (transactors, gameId, deckId, shuffleSeed) => {
		const { get, find, env } = transactors
		const rng = new LCG(shuffleSeed)
		const deckIndex = find(deckIndices, gameId)
		const deckDoesExist = get(deckIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		const deckCardIndex = find(groupsOfCards.states.cardKeysOfGroup, deckId)
		const cardIds = get(deckCardIndex)
		const i = 0
		const shuffledCardIds = cardIds.toSorted(() => rng.next() - 0.5)
		groupsOfCards.transact(transactors, ({ relations }) => {
			relations.replaceRelations(deckId, shuffledCardIds)
		})
		if (env().runtime === `node`) {
			console.log(`Shuffled deck "${deckId}"`)
		}
	},
})
