import type { RegularAtomToken } from "atom.io"
import { atom, atomFamily, selector, selectorFamily } from "atom.io"
import { getInternalRelations, join } from "atom.io/data"
import { getUpdateToken, type Signal } from "atom.io/internal"
import type { Alias } from "atom.io/realtime"
import type { UserKey } from "atom.io/realtime-server"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import { valuesOfCards } from "./card-values-store"
import { type CardKey, isCardKey } from "./cards-store"
import { gamePlayerIndex } from "./game-players-store"
import { isTrickKey, trickIndex } from "./trick-store"

export type CardGroupType = `deck` | `hand` | `pile` | `trick`
export type CardGroup = {
	type: CardGroupType
	name: string
}

export type CardGroupKey = `card_group:${CardGroupType}::${string}`
export const isCardGroupKey = (k: string): k is CardGroupKey =>
	isDeckKey(k) || isHandKey(k) || isPileKey(k) || isTrickKey(k)

export type DeckKey = `card_group:deck::${string}`
export const isDeckKey = (k: string): k is DeckKey => k.startsWith(`deck::`)
export type Deck = CardGroup & {
	type: `deck`
}
export type HandKey = `card_group:hand::${string}`
export const isHandKey = (k: string): k is HandKey => k.startsWith(`hand::`)
export type Hand = CardGroup & {
	type: `hand`
}
export type PileKey = `card_group:pile::${string}`
export const isPileKey = (k: string): k is PileKey => k.startsWith(`pile::`)
export type Pile = CardGroup & {
	type: `pile`
}

export const deckAtoms = atomFamily<Deck, DeckKey>({
	key: `deck`,
	default: {
		type: `deck`,
		name: ``,
	},
})
export const deckIndex = atom<SetRTX<DeckKey>, SetRTXJson<DeckKey>>({
	key: `deckIndex`,
	mutable: true,
	default: () => new SetRTX<DeckKey>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const handAtoms = atomFamily<Hand, HandKey>({
	key: `hand`,
	default: {
		type: `hand`,
		name: ``,
	},
})
export const handIndex = atom<SetRTX<HandKey>, SetRTXJson<HandKey>>({
	key: `handIndex`,
	mutable: true,
	default: () => new SetRTX<HandKey>(),
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

export const pileStates = atomFamily<Pile, PileKey>({
	key: `pile`,
	default: {
		type: `pile`,
		name: ``,
	},
})
export const pileIndex = atom<SetRTX<PileKey>, SetRTXJson<PileKey>>({
	key: `pileIndex`,
	mutable: true,
	default: () => new SetRTX<PileKey>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const groupsOfCards = join({
	key: `groupsOfCards`,
	between: [`group`, `card`],
	cardinality: `1:n`,
	isAType: isCardGroupKey,
	isBType: isCardKey,
})

export const groupsOfCardsJsonMask = selectorFamily<
	SetRTXJson<CardKey<Alias>>,
	CardGroupKey
>({
	key: `cardValueRelationsMask`,
	get:
		(cardGroupKey) =>
		({ get, find, json }) => {
			const cardValueJsonSelector = json(
				find(getInternalRelations(groupsOfCards), cardGroupKey),
			)
			const cardValueJson = get(cardValueJsonSelector) as SetRTXJson<
				CardKey<Alias>
			>
			return {
				...cardValueJson,
				members: cardValueJson.members, // 👀 IMPLEMENT ALIASING
			}
		},
	set: () => () => {},
})

export const groupsOfCardsUpdateMask = selectorFamily<
	Signal<SetRTX<CardKey>>,
	CardKey
>({
	key: `groupsOfCardsUpdateMask`,
	get:
		(cardKey) =>
		({ get, find }) => {
			const updateAtom = getUpdateToken(
				find(getInternalRelations(valuesOfCards), cardKey),
			)
			const update = get(updateAtom)
			return update // 👀 IMPLEMENT ALIASING
		},
	set: () => () => {},
})

export const groupsOfCardsView = selectorFamily<CardGroupKey[], UserKey>({
	key: `groupsOfCardsView`,
	get:
		() =>
		({ get }) => {
			return [
				...get(pileIndex),
				...get(deckIndex),
				...get(handIndex),
				...get(trickIndex),
			]
		},
})

export const ownersOfGroups = join({
	key: `ownersOfGroups`,
	between: [`player`, `group`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export const ownersAndGroupsIndex = selector<string[]>({
	key: `ownersAndGroupsIndex`,
	get: ({ get }) => {
		const playerIds = get(gamePlayerIndex)
		const groupIds = get(groupsOfCardsView, `user::`)
		return [...playerIds, ...groupIds]
	},
	set: () => () => {},
})
