import { atom, atomFamily, selector, selectorFamily } from "atom.io"
import { join } from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { MutableAtomToken, RegularAtomToken } from "atom.io"
import { cardIndex } from "./cards-store"
import { gamePlayerIndex } from "./game-players-store"

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
export const deckIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `deckIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
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
export const deckView = selectorFamily<RegularAtomToken<Deck>[], string>({
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
export const handIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `handIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
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
export const handView = selectorFamily<RegularAtomToken<Hand>[], string>({
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
export const pileIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `pileIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
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
export const pileView = selectorFamily<RegularAtomToken<Pile>[], string>({
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
export const trickIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `trickIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const trickGlobalView = selector<RegularAtomToken<Trick>[]>({
	key: `trickGlobalView`,
	get: ({ get, find }) => {
		const trickTokens: RegularAtomToken<Trick>[] = []
		const trickIds = get(trickIndex)
		for (const trickId of trickIds) {
			const trickToken = find(trickStates, trickId)
			trickTokens.push(trickToken)
		}
		return trickTokens
	},
})
export const trickView = selectorFamily<RegularAtomToken<Trick>[], string>({
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
		const trickIds = get(trickIndex)
		return [...deckIds, ...handIds, ...pileIds, ...trickIds]
	},
})

export const groupsOfCards = join({
	key: `groupsOfCards`,
	between: [`group`, `card`],
	cardinality: `1:n`,
})
export const groupsOfCardsGlobalView = selector<
	MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[]
>({
	key: `groupsOfCardsGlobalView`,
	get: ({ find, get }) => {
		const tokens: MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[] = []
		const groupIds = get(cardGroupIndex)
		for (const groupId of groupIds) {
			const token = find(groupsOfCards.core.findRelatedKeysState, groupId)
			tokens.push(token)
		}
		const cardIds = get(cardIndex)
		for (const cardId of cardIds) {
			const token = find(groupsOfCards.core.findRelatedKeysState, cardId)
			tokens.push(token)
		}
		return tokens
	},
})
export const groupsOfCardsView = selectorFamily<
	MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[],
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
})
export const ownersOfGroupsGlobalView = selector<
	MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[]
>({
	key: `ownersOfGroupsGlobalView`,
	get: ({ find, get }) => {
		const tokens: MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[] = []
		const groupIds = get(cardGroupIndex)
		for (const groupId of groupIds) {
			const token = find(ownersOfGroups.core.findRelatedKeysState, groupId)
			tokens.push(token)
		}
		const playerIds = get(gamePlayerIndex)
		for (const playerId of playerIds) {
			const token = find(ownersOfGroups.core.findRelatedKeysState, playerId)
			tokens.push(token)
		}
		return tokens
	},
})
export const ownersOfGroupsView = selectorFamily<
	MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[],
	string
>({
	key: `ownersOfGroupsView`,
	get:
		() =>
		({ get }) =>
			get(ownersOfGroupsGlobalView),
})
