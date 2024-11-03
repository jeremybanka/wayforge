import { atom, selector, selectorFamily } from "atom.io"
import { findRelations, join } from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import { groupsOfCards, isTrickKey, type TrickKey } from "./card-groups-store"
import { type CardKey, isCardKey } from "./cards-store"
import { gamePlayerIndex } from "./game-players-store"

export const trickContributions = join({
	key: `trickContributions`,
	between: [`player`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: isCardKey,
})
export const trickWinners = join({
	key: `trickWinners`,
	between: [`player`, `trick`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: isTrickKey,
})

export const trickIndex = atom<SetRTX<TrickKey>, SetRTXJson<TrickKey>>({
	key: `trickIndex`,
	mutable: true,
	default: () => new SetRTX<TrickKey>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export type TrickContent = [playerId: string, cardId: CardKey | undefined]
export const trickContentsStates = selectorFamily<TrickContent[], TrickKey>({
	key: `trickContents`,
	get:
		(key) =>
		({ get }) => {
			const playerIdsInGame = get(gamePlayerIndex)
			const cardIdsInTrick = get(
				findRelations(groupsOfCards, key).cardKeysOfGroup,
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

export const trickIsCompleteState = selectorFamily<boolean, TrickKey>({
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
		const completeTrickIds = trickIds.members.filter((trickId) =>
			get(find(trickIsCompleteState, trickId)),
		)
		return completeTrickIds
	},
})

export const currentTrickIdState = selector<TrickKey | null>({
	key: `currentTrick`,
	get: ({ get, json }) => {
		const completeTrickIds = get(completeTrickIndex)
		const trickIds = get(json(trickIndex))

		const currentTrickId = trickIds.members.at(-1)
		if (!currentTrickId || completeTrickIds.includes(currentTrickId)) {
			return null
		}
		return currentTrickId
	},
})
