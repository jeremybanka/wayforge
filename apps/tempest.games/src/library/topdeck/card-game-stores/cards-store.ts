import { atomFamily, join, mutableAtom } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

export const cardOwners = join({
	key: `ownersOfCards`,
	between: [`owner`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export type Card = {
	rotation: number
}
export const cardAtoms = atomFamily<Card, string>({
	key: `card`,
	default: () => ({
		rotation: 0,
	}),
})
export const cardKeysAtom = mutableAtom<UList<string>>({
	key: `cardKeys`,
	class: UList,
})

export type CardCycle = {
	name: string
}
export const cardCycleAtoms = atomFamily<CardCycle, string>({
	key: `cardCycle`,
	default: () => ({
		name: ``,
	}),
})

export const cardCycleGroupsAndZones = join({
	key: `groupsAndZonesOfCardCycles`,
	between: [`cardCycle`, `groupOrZone`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
