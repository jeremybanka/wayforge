import {
	findRelations,
	join,
	mutableAtom,
	selector,
	selectorFamily,
} from "atom.io"
import type { UserKey } from "atom.io/realtime"
import { isUserKey } from "atom.io/realtime"
import { UList } from "atom.io/transceivers/u-list"

import { playerTurnOrderAtom } from "../game-setup-turn-order-and-spectators"
import type { TrickKey } from "./card-collections-store"
import { cardCollectionAtoms, isTrickKey } from "./card-collections-store"
import type { CardKey } from "./cards-store"
import { isCardKey } from "./cards-store"

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
			const trickContents = playerTurnOrder.map<TrickContent>((playerId) => {
				const cardsThisPlayerHasInTricks = get(
					findRelations(trickContributions, playerId).cardKeysOfPlayer,
				)
				const cardId = cardsThisPlayerHasInTricks.find((id) =>
					cardIdsInTrick.includes(id),
				)
				return [playerId, cardId]
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
	get: ({ find, get, json }) => {
		const trickIds = get(json(trickKeysAtom))
		const completeTrickIds = trickIds.filter((trickId) =>
			get(find(trickIsCompleteSelector, trickId)),
		)
		return completeTrickIds
	},
})

export const currentTrickSelector = selector<string | null>({
	key: `currentTrick`,
	get: ({ get, json }) => {
		const completeTrickIds = get(completeTrickKeysSelector)
		const trickIds = get(json(trickKeysAtom))

		const currentTrickId = trickIds.at(-1)
		if (!currentTrickId || completeTrickIds.includes(currentTrickId)) {
			return null
		}
		return currentTrickId
	},
})
