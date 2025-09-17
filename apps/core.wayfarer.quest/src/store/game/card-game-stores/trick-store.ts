import {
	findRelations,
	join,
	mutableAtom,
	selector,
	selectorFamily,
} from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

import { groupsOfCards } from "./card-groups-store"
import { gamePlayerIndex } from "./game-players-store"

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

export const trickIndex = mutableAtom<UList<string>>({
	key: `trickIndex`,
	class: UList,
})

export type TrickContent = [playerId: string, cardId: string | undefined]
export const trickContentsStates = selectorFamily<TrickContent[], string>({
	key: `trickContents`,
	get:
		(trickId) =>
		({ get }) => {
			const playerIdsInGame = get(gamePlayerIndex)
			const cardIdsInTrick = get(
				findRelations(groupsOfCards, trickId).cardKeysOfGroup,
			)
			const trickContents = playerIdsInGame.map<TrickContent>((playerId) => {
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

export const trickIsCompleteState = selectorFamily<boolean, string>({
	key: `trickIsComplete`,
	get:
		(trickId) =>
		({ find, get }) => {
			const trickContents = get(find(trickContentsStates, trickId))
			return trickContents.every(([, cardId]) => cardId !== undefined)
		},
})

export const completeTrickIndex = selector<string[]>({
	key: `completeTrickIndex`,
	get: ({ find, get, json }) => {
		const trickIds = get(json(trickIndex))
		const completeTrickIds = trickIds.filter((trickId) =>
			get(find(trickIsCompleteState, trickId)),
		)
		return completeTrickIds
	},
})

export const currentTrickIdState = selector<string | null>({
	key: `currentTrick`,
	get: ({ get, json }) => {
		const completeTrickIds = get(completeTrickIndex)
		const trickIds = get(json(trickIndex))

		const currentTrickId = trickIds.at(-1)
		if (!currentTrickId || completeTrickIds.includes(currentTrickId)) {
			return null
		}
		return currentTrickId
	},
})
