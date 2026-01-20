import {
	findRelations,
	join,
	mutableAtom,
	selector,
	selectorFamily,
	transaction,
} from "atom.io"
import type { UserKey } from "atom.io/realtime"
import { isUserKey } from "atom.io/realtime"
import { UList } from "atom.io/transceivers/u-list"
import { nanoid } from "nanoid"

import type { CardKey } from "./card-game-state"
import {
	cardCollectionAtoms,
	isCardKey,
	isTrickKey,
	TrickKey,
} from "./card-game-state"
import { playerTurnOrderAtom } from "./turn-based-game-state"

export const spawnTrickTX = transaction<() => void>({
	key: `spawnTrick`,
	do: (transactors) => {
		const { set } = transactors
		const trickKey = TrickKey(nanoid)
		set(trickKeysAtom, (current) => {
			const next = current.add(trickKey)
			return next
		})
	},
})

export const trickContributions = join({
	key: `trickContributions`,
	between: [`player`, `card`],
	cardinality: `1:n`,
	isAType: isUserKey,
	isBType: isCardKey,
})
export const trickWinners = join({
	key: `trickWinners`,
	between: [`player`, `trick`],
	cardinality: `1:n`,
	isAType: isUserKey,
	isBType: isTrickKey,
})

export const trickKeysAtom = mutableAtom<UList<TrickKey>>({
	key: `trickKeys`,
	class: UList,
})

export type TrickContent = [UserKey, CardKey | undefined]
export const trickContentsSelectors = selectorFamily<TrickContent[], TrickKey>({
	key: `trickContents`,
	get:
		(trickKey) =>
		({ get }) => {
			const playerTurnOrder = get(playerTurnOrderAtom)
			const cardIdsInTrick = get(cardCollectionAtoms, trickKey)
			const trickContents = playerTurnOrder.map<TrickContent>((playerKey) => {
				const cardsThisPlayerHasInTricks = get(
					findRelations(trickContributions, playerKey).cardKeysOfPlayer,
				)
				const cardKey = cardsThisPlayerHasInTricks.find((key) =>
					cardIdsInTrick.includes(key),
				)
				return [playerKey, cardKey]
			})
			return trickContents
		},
})

export const trickIsCompleteSelector = selectorFamily<boolean, TrickKey>({
	key: `trickIsComplete`,
	get:
		(key) =>
		({ get }) => {
			const trickContents = get(trickContentsSelectors, key)
			return trickContents.every(([, cardId]) => cardId !== undefined)
		},
})

export const completeTrickKeysSelector = selector<string[]>({
	key: `completeTrickKeys`,
	get: ({ get, json }) => {
		const trickKeys = get(json(trickKeysAtom))
		const completeTrickIds = trickKeys.filter((trickId) =>
			get(trickIsCompleteSelector, trickId),
		)
		return completeTrickIds
	},
})

export const currentTrickSelector = selector<string | null>({
	key: `currentTrick`,
	get: ({ get, json }) => {
		const completeTrickKeys = get(completeTrickKeysSelector)
		const trickKeys = get(json(trickKeysAtom))

		const currentTrickKey = trickKeys.at(-1)
		if (!currentTrickKey || completeTrickKeys.includes(currentTrickKey)) {
			return null
		}
		return currentTrickKey
	},
})
