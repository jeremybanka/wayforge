import {
	findRelations,
	join,
	mutableAtom,
	selector,
	selectorFamily,
} from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

import { playerTurnOrderAtom } from "../stores/game-setup-turn-order-and-spectators"
import { groupsOfCards } from "./card-groups-store"

export const trickContributions = join({
	key: `trickContributions`,
	between: [`player`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
export const trickWinners = join({
	key: `trickWinners`,
	between: [`player`, `trick`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export const trickKeysAtom = mutableAtom<UList<string>>({
	key: `trickKeys`,
	class: UList,
})

export type TrickContent = [playerId: string, cardId: string | undefined]
export const trickContentsStates = selectorFamily<TrickContent[], string>({
	key: `trickContents`,
	get:
		(trickId) =>
		({ get }) => {
			const playerTurnOrder = get(playerTurnOrderAtom)
			const cardIdsInTrick = get(
				findRelations(groupsOfCards, trickId).cardKeysOfGroup,
			)
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

export const trickIsCompleteSelector = selectorFamily<boolean, string>({
	key: `trickIsComplete`,
	get:
		(trickId) =>
		({ find, get }) => {
			const trickContents = get(find(trickContentsStates, trickId))
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
