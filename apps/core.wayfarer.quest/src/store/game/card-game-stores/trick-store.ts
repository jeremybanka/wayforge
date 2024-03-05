import { atom, selector, selectorFamily } from "atom.io"
import { findRelations, join } from "atom.io/data"
import { IMPLICIT, getJsonToken } from "atom.io/internal"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import { groupsOfCards } from "./card-groups-store"
import { gamePlayerIndex } from "./game-players-store"

export const trickContributions = join({
	key: `trickContributions`,
	between: [`player`, `card`],
	cardinality: `1:n`,
})
export const trickWinners = join({
	key: `trickWinners`,
	between: [`player`, `trick`],
	cardinality: `1:n`,
})

export const trickIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `trickIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
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
				const cardId = cardsThisPlayerHasInTricks.find((cardId) =>
					cardIdsInTrick.includes(cardId),
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
		({ get }) => {
			const trickContents = get(trickContentsStates(trickId))
			return trickContents.every(([, cardId]) => cardId !== undefined)
		},
})

export const completeTrickIndex = selector<string[]>({
	key: `completeTrickIndex`,
	get: ({ get }) => {
		const trickIdJson = getJsonToken(trickIndex)
		const trickIds = get(trickIdJson)
		const completeTrickIds = trickIds.members.filter((trickId) =>
			get(trickIsCompleteState(trickId)),
		)
		return completeTrickIds
	},
})

export const currentTrickIdState = selector<string | null>({
	key: `currentTrick`,
	get: ({ get }) => {
		const completeTrickIds = get(completeTrickIndex)
		const trickIdJson = getJsonToken(trickIndex)
		const trickIds = get(trickIdJson)

		const currentTrickId = trickIds.members.at(-1)
		if (!currentTrickId || completeTrickIds.includes(currentTrickId)) {
			return null
		}
		return currentTrickId
	},
})
