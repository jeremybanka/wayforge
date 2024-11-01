import type { RegularAtomToken } from "atom.io"
import { atom, atomFamily, selector } from "atom.io"
import { join } from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import { isCardKey } from "./cards-store"

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
export type TrickKey = `card_group:trick::${string}`
export const isTrickKey = (k: string): k is TrickKey => k.startsWith(`trick::`)
export type Trick = CardGroup & {
	type: `trick`
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

export const trickStates = atomFamily<Trick, TrickKey>({
	key: `trick`,
	default: {
		type: `trick`,
		name: ``,
	},
})

export const groupsOfCards = join({
	key: `groupsOfCards`,
	between: [`group`, `card`],
	cardinality: `1:n`,
	isAType: isCardGroupKey,
	isBType: isCardKey,
})

export const ownersOfGroups = join({
	key: `ownersOfGroups`,
	between: [`player`, `group`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
