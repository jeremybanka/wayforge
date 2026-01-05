import type { MutableAtomToken, RegularAtomToken } from "atom.io"
import {
	atomFamily,
	getInternalRelations,
	join,
	mutableAtom,
	selector,
	selectorFamily,
} from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

import { playerTurnOrderAtom } from "../../bug-rangers-game-state"
import { cardIndex } from "./cards-store"
import { trickKeysAtom } from "./trick-store"

export type CardGroup = {
	type: `deck` | `hand` | `pile` | `trick`
	name: string
}

export type Deck = CardGroup & {
	type: `deck`
}
export type Hand = CardGroup & {
	type: `hand`
}
export type Pile = CardGroup & {
	type: `pile`
}
export type Trick = CardGroup & {
	type: `trick`
}

export const deckAtoms = atomFamily<Deck, string>({
	key: `deck`,
	default: {
		type: `deck`,
		name: ``,
	},
})
export const deckIndex = mutableAtom<UList<string>>({
	key: `deckIndex`,
	class: UList,
})
export const deckGlobalView = selector<RegularAtomToken<Deck>[]>({
	key: `deckGlobalView`,
	get: ({ get, find }) => {
		const deckTokens: RegularAtomToken<Deck>[] = []
		const deckValueIds = get(deckIndex)
		for (const deckValueId of deckValueIds) {
			const deckToken = find(deckAtoms, deckValueId)
			deckTokens.push(deckToken)
		}
		return deckTokens
	},
})
export const deckView = selectorFamily<
	readonly RegularAtomToken<Deck>[],
	string
>({
	key: `deckView`,
	get:
		() =>
		({ get }) =>
			get(deckGlobalView),
})

export const handAtoms = atomFamily<Hand, string>({
	key: `hand`,
	default: {
		type: `hand`,
		name: ``,
	},
})
export const handIndex = mutableAtom<UList<string>>({
	key: `handIndex`,
	class: UList,
})
export const handGlobalView = selector<RegularAtomToken<Hand>[]>({
	key: `handGlobalView`,
	get: ({ get, find }) => {
		const handTokens: RegularAtomToken<Hand>[] = []
		const handIds = get(handIndex)
		for (const handId of handIds) {
			const handToken = find(handAtoms, handId)
			handTokens.push(handToken)
		}
		return handTokens
	},
})
export const handView = selectorFamily<
	readonly RegularAtomToken<Hand>[],
	string
>({
	key: `handView`,
	get:
		() =>
		({ get }) =>
			get(handGlobalView),
})

export const pileStates = atomFamily<Pile, string>({
	key: `pile`,
	default: {
		type: `pile`,
		name: ``,
	},
})
export const pileIndex = mutableAtom<UList<string>>({
	key: `pileIndex`,
	class: UList,
})
export const pileGlobalView = selector<RegularAtomToken<Pile>[]>({
	key: `pileGlobalView`,
	get: ({ get, find }) => {
		const pileTokens: RegularAtomToken<Pile>[] = []
		const pileIds = get(pileIndex)
		for (const pileId of pileIds) {
			const pileToken = find(pileStates, pileId)
			pileTokens.push(pileToken)
		}
		return pileTokens
	},
})
export const pileView = selectorFamily<
	readonly RegularAtomToken<Pile>[],
	string
>({
	key: `pileView`,
	get:
		() =>
		({ get }) =>
			get(pileGlobalView),
})

export const trickStates = atomFamily<Trick, string>({
	key: `trick`,
	default: {
		type: `trick`,
		name: ``,
	},
})

export const trickGlobalView = selector<RegularAtomToken<Trick>[]>({
	key: `trickGlobalView`,
	get: ({ get, find }) => {
		const trickTokens: RegularAtomToken<Trick>[] = []
		const trickIds = get(trickKeysAtom)
		for (const trickId of trickIds) {
			const trickToken = find(trickStates, trickId)
			trickTokens.push(trickToken)
		}
		return trickTokens
	},
})
export const trickView = selectorFamily<
	readonly RegularAtomToken<Trick>[],
	string
>({
	key: `trickView`,
	get:
		() =>
		({ get }) =>
			get(trickGlobalView),
})

export const cardGroupIndex = selector<string[]>({
	key: `cardGroupIndex`,
	get: ({ get }) => {
		const deckIds = get(deckIndex)
		const handIds = get(handIndex)
		const pileIds = get(pileIndex)
		const trickIds = get(trickKeysAtom)
		return [...deckIds, ...handIds, ...pileIds, ...trickIds]
	},
})

export const groupsOfCards = join({
	key: `groupsOfCards`,
	between: [`group`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
export const groupsOfCardsGlobalView = selector<
	MutableAtomToken<UList<string>>[]
>({
	key: `groupsOfCardsGlobalView`,
	get: ({ find, get }) => {
		const tokens: MutableAtomToken<UList<string>>[] = []
		const groupIds = get(cardGroupIndex)
		for (const groupId of groupIds) {
			const token = find(getInternalRelations(groupsOfCards), groupId)
			tokens.push(token)
		}
		const cardIds = get(cardIndex)
		for (const cardId of cardIds) {
			const token = find(getInternalRelations(groupsOfCards), cardId)
			tokens.push(token)
		}
		return tokens
	},
})
export const groupsOfCardsView = selectorFamily<
	readonly MutableAtomToken<UList<string>>[],
	string
>({
	key: `groupsOfCardsView`,
	get:
		() =>
		({ get }) =>
			get(groupsOfCardsGlobalView),
})

export const ownersOfGroups = join({
	key: `ownersOfGroups`,
	between: [`player`, `group`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
export const ownersOfGroupsGlobalView = selector<
	MutableAtomToken<UList<string>>[]
>({
	key: `ownersOfGroupsGlobalView`,
	get: ({ find, get }) => {
		const tokens: MutableAtomToken<UList<string>>[] = []
		const groupIds = get(cardGroupIndex)
		for (const groupId of groupIds) {
			const token = find(getInternalRelations(ownersOfGroups), groupId)
			tokens.push(token)
		}
		const userKeys = get(playerTurnOrderAtom)
		for (const userKey of userKeys) {
			const token = find(getInternalRelations(ownersOfGroups), userKey)
			tokens.push(token)
		}
		return tokens
	},
})
export const ownersOfGroupsView = selectorFamily<
	readonly MutableAtomToken<UList<string>>[],
	string
>({
	key: `ownersOfGroupsView`,
	get:
		() =>
		({ get }) =>
			get(ownersOfGroupsGlobalView),
})
