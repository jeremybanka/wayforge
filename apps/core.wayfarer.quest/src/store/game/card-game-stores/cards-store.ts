import { atom, atomFamily } from "atom.io"
import { join } from "atom.io/data"
import type { Actual, Alias } from "atom.io/realtime-server"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export type CardKey<K extends Actual | Alias = Actual | Alias> = `card::${K}`
export const isCardKey = (k: string): k is CardKey => k.startsWith(`card::`)
export type Card = {
	rotation: number
}
export const cardAtoms = atomFamily<Card, CardKey>({
	key: `card`,
	default: () => ({
		rotation: 0,
	}),
})
export const cardIndex = atom<SetRTX<CardKey>, SetRTXJson<CardKey>>({
	key: `cardIndex`,
	mutable: true,
	default: () => new SetRTX<CardKey>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const cardOwners = join({
	key: `ownersOfCards`,
	between: [`owner`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: isCardKey,
})

export type CardCycleKey = `cardCycle::${string}`
export const isCardCycleKey = (k: string): k is CardCycleKey =>
	k.startsWith(`cardCycle::`)
export type CardCycle = {
	name: string
}
export const findCardCycleState = atomFamily<CardCycle, CardCycleKey>({
	key: `cardCycle`,
	default: () => ({
		name: ``,
	}),
})

export const cardCycleGroupsAndZones = join({
	key: `groupsAndZonesOfCardCycles`,
	between: [`cardCycle`, `groupOrZone`],
	cardinality: `1:n`,
	isAType: isCardCycleKey,
	isBType: (input): input is string => typeof input === `string`,
})
