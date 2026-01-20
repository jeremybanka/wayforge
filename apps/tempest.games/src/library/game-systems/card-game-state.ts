import { join, mutableAtom, mutableAtomFamily } from "atom.io"
import { isUserKey } from "atom.io/realtime"
import { OList } from "atom.io/transceivers/o-list"
import { UList } from "atom.io/transceivers/u-list"

export type CardKey = `card::${string}`
export const CardKey = (key: string | (() => string)): CardKey =>
	`card::${typeof key === `function` ? key() : key}`
export const isCardKey = (key: string): key is CardKey =>
	key.startsWith(`card::`)

export const cardOwners = join({
	key: `ownersOfCards`,
	between: [`owner`, `card`],
	cardinality: `1:n`,
	isAType: isUserKey,
	isBType: isCardKey,
})

export const cardKeysAtom = mutableAtom<UList<CardKey>>({
	key: `cardKeys`,
	class: UList,
})

export type DeckKey = `cc-deck::${string}`
export const DeckKey = (key: string | (() => string)): DeckKey =>
	`cc-deck::${typeof key === `function` ? key() : key}`
export const isDeckKey = (key: string): key is DeckKey =>
	key.startsWith(`cc-deck::`)
export type HandKey = `cc-hand::${string}`
export const HandKey = (key: string | (() => string)): HandKey =>
	`cc-hand::${typeof key === `function` ? key() : key}`
export const isHandKey = (key: string): key is HandKey =>
	key.startsWith(`cc-hand::`)
export type PileKey = `cc-pile::${string}`
export const PileKey = (key: string | (() => string)): PileKey =>
	`cc-pile::${typeof key === `function` ? key() : key}`
export const isPileKey = (key: string): key is PileKey =>
	key.startsWith(`cc-pile::`)
export type TrickKey = `cc-trick::${string}`
export const TrickKey = (key: string | (() => string)): TrickKey =>
	`cc-trick::${typeof key === `function` ? key() : key}`
export const isTrickKey = (key: string): key is TrickKey =>
	key.startsWith(`cc-trick::`)
export type CardCollectionKey = DeckKey | HandKey | PileKey | TrickKey
export const isCardCollectionKey = (key: string): key is CardCollectionKey =>
	key.startsWith(`cc-`)

export const deckKeysAtom = mutableAtom<UList<DeckKey>>({
	key: `deckKeys`,
	class: UList,
})

export const handKeysAtom = mutableAtom<UList<HandKey>>({
	key: `handKeys`,
	class: UList,
})

export const pileKeysAtom = mutableAtom<UList<PileKey>>({
	key: `pileKeys`,
	class: UList,
})

export const cardCollectionAtoms = mutableAtomFamily<
	OList<CardKey>,
	CardCollectionKey
>({
	key: `cardList`,
	class: OList,
})

export const ownersOfCollections = join({
	key: `ownersOfCollections`,
	between: [`owner`, `collection`],
	cardinality: `1:n`,
	isAType: isUserKey,
	isBType: isCardCollectionKey,
})
