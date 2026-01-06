import type { MutableAtomToken, RegularAtomToken } from "atom.io"
import {
	atomFamily,
	findRelations,
	getInternalRelations,
	join,
	mutableAtom,
	selector,
	selectorFamily,
} from "atom.io"
import type { Json } from "atom.io/json"
import { UList } from "atom.io/transceivers/u-list"

import type { Identified } from "../../utility-types"
import {
	currentTrickSelector,
	groupsOfCards,
	handIndex,
	ownersOfGroups,
	pileIndex,
} from "."

export const cardValueAtoms = atomFamily<Identified & Json.Object, string>({
	key: `cardValue`,
	default: () => ({ id: `` }),
})
export const cardValueIndex = mutableAtom<UList<string>>({
	key: `cardValuesIndex`,
	class: UList,
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
	readonly RegularAtomToken<Identified & Json.Object>[],
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
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export const visibleCardIndices = selectorFamily<string[], string>({
	key: `visibleCardIndices`,
	get:
		(username) =>
		({ get }) => {
			const cardIds: string[] = []
			const pileIds = get(pileIndex)
			for (const pileId of pileIds) {
				const pileCardIndex = findRelations(
					groupsOfCards,
					pileId,
				).cardKeysOfGroup
				const pileCardIds = get(pileCardIndex)
				for (const pileCardId of pileCardIds) {
					cardIds.push(pileCardId)
				}
			}

			const currentTrickId = get(currentTrickSelector)
			if (currentTrickId) {
				const trickCardIndex = findRelations(
					groupsOfCards,
					currentTrickId,
				).cardKeysOfGroup
				const trickCardIds = get(trickCardIndex)
				for (const trickCardId of trickCardIds) {
					cardIds.push(trickCardId)
				}
			}
			const handIds = get(handIndex)
			for (const handId of handIds) {
				const handOwnerIdState = findRelations(
					ownersOfGroups,
					handId,
				).playerKeyOfGroup
				const handOwnerId = get(handOwnerIdState)
				if (handOwnerId === username) {
					const handCardIndex = findRelations(
						groupsOfCards,
						handId,
					).cardKeysOfGroup
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
	MutableAtomToken<UList<string>>[],
	string
>({
	key: `valuesOfCardsView`,
	get:
		(username) =>
		({ find, get }) => {
			const visibleCardIndex = find(visibleCardIndices, username)
			const visibleCardIds = get(visibleCardIndex)
			const tokens = visibleCardIds.map((cardId) => {
				return find(getInternalRelations(valuesOfCards), cardId)
			})
			return tokens
		},
})
