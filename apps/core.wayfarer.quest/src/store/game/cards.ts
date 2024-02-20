import { atomFamily } from "atom.io"
import { join } from "atom.io/data"
import { IMPLICIT, createMutableAtom } from "atom.io/internal"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"

import { Perspective } from "~/packages/occlusion/src"

export const cardOwners = join({
	key: `ownersOfCards`,
	between: [`owner`, `card`],
	cardinality: `1:n`,
})

export const findPlayerPerspectiveState = atomFamily<Perspective, string>({
	key: `findPlayerPerspective`,
	default: new Perspective(),
})

export type Card = {
	rotation: number
}
export const findCardState = atomFamily<Card, string>({
	key: `card`,
	default: () => ({
		rotation: 0,
	}),
})
export const cardIndex = createMutableAtom<SetRTX<string>, SetRTXJson<string>>(
	{
		key: `cardIndex`,
		mutable: true,
		default: () => new SetRTX<string>(),
		toJson: (set) => set.toJSON(),
		fromJson: (json) => SetRTX.fromJSON(json),
	},
	undefined,
	IMPLICIT.STORE,
)

export type CardCycle = {
	name: string
}
export const findCardCycleState = atomFamily<CardCycle, string>({
	key: `cardCycle`,
	default: () => ({
		name: ``,
	}),
})

export const cardCycleGroupsAndZones = join({
	key: `groupsAndZonesOfCardCycles`,
	between: [`cardCycle`, `groupOrZone`],
	cardinality: `1:n`,
})
