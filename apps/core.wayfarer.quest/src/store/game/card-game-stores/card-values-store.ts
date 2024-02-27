import type { MutableAtomToken, RegularAtomToken } from "atom.io"
import { atom, atomFamily, selector, selectorFamily } from "atom.io"
import { join } from "atom.io/data"
import type { Json } from "atom.io/json"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Identified } from "~/packages/anvl/src/id"

import {
	currentTrickIdState,
	groupsOfCards,
	handIndex,
	ownersOfGroups,
	pileIndex,
} from "."

export const cardValueAtoms = atomFamily<Identified & Json.Object, string>({
	key: `cardValue`,
	default: () => ({ id: `` }),
})
export const cardValueIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `cardValuesIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const cardValueGlobalView = selector<
	RegularAtomToken<Identified & Json.Object>[]
>({
	key: `cardValueGlobalView`,
	get: ({ get, find }) => {
		const cardValueTokens: RegularAtomToken<Identified & Json.Object>[] = []
		const cardValueIds = get(cardValueIndex)
		for (const cardValueId of cardValueIds) {
			const cardValueToken = find(cardValueAtoms, cardValueId)
			cardValueTokens.push(cardValueToken)
		}
		return cardValueTokens
	},
})
export const cardValueView = selectorFamily<
	RegularAtomToken<Identified & Json.Object>[],
	string
>({
	key: `cardValueView`,
	get:
		() =>
		({ get }) =>
			get(cardValueGlobalView),
})

export const valuesOfCards = join({
	key: `valuesOfCards`,
	between: [`value`, `card`],
	cardinality: `1:n`,
})

export const visibleCardIndices = selectorFamily<string[], string>({
	key: `visibleCardIndices`,
	get:
		(username) =>
		({ find, get }) => {
			const cardIds: string[] = []
			const pileIds = get(pileIndex)
			for (const pileId of pileIds) {
				const pileCardIndex = find(groupsOfCards.states.cardKeysOfGroup, pileId)
				const pileCardIds = get(pileCardIndex)
				for (const pileCardId of pileCardIds) {
					cardIds.push(pileCardId)
				}
			}

			const currentTrickId = get(currentTrickIdState)
			if (currentTrickId) {
				const trickCardIndex = find(
					groupsOfCards.states.cardKeysOfGroup,
					currentTrickId,
				)
				const trickCardIds = get(trickCardIndex)
				for (const trickCardId of trickCardIds) {
					cardIds.push(trickCardId)
				}
			}
			const handIds = get(handIndex)
			for (const handId of handIds) {
				const handOwnerIdState = find(
					ownersOfGroups.states.playerKeyOfGroup,
					handId,
				)
				const handOwnerId = get(handOwnerIdState)
				if (handOwnerId === username) {
					const handCardIndex = find(
						groupsOfCards.states.cardKeysOfGroup,
						handId,
					)
					const handCardIds = get(handCardIndex)
					for (const handCardId of handCardIds) {
						cardIds.push(handCardId)
					}
				}
			}

			return cardIds
		},
})
export const valuesOfCardsView = selectorFamily<
	MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[],
	string
>({
	key: `valuesOfCardsView`,
	get:
		(username) =>
		({ find, get }) => {
			const visibleCardIndex = find(visibleCardIndices, username)
			const visibleCardIds = get(visibleCardIndex)
			const tokens = visibleCardIds.map((cardId) => {
				return find(valuesOfCards.core.findRelatedKeysState, cardId)
			})
			return tokens
		},
})
