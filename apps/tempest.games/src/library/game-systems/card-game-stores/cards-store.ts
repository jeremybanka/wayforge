import { join, mutableAtom } from "atom.io"
import { isUserKey } from "atom.io/realtime"
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
