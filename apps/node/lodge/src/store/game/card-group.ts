import { atomFamily } from "atom.io"
import { IMPLICIT, createMutableAtom } from "atom.io/internal"

import type { SetRTXJson } from "~/packages/atom.io/transceivers/set-rtx/src"
import { SetRTX } from "~/packages/atom.io/transceivers/set-rtx/src"
import { AtomicJunction } from "../utils/atomic-junction"

export type CardGroup = {
	type: `deck` | `hand` | `pile` | null
	name: string
	rotation: number
}
export const findCardGroupState = atomFamily<CardGroup, string>({
	key: `findCardGroup`,
	default: () => ({
		type: null,
		name: ``,
		rotation: 0,
	}),
})
export const cardGroupIndex = createMutableAtom<
	SetRTX<string>,
	SetRTXJson<string>
>(
	{
		key: `cardGroupsIndex::mutable`,
		mutable: true,
		default: () => new SetRTX<string>(),
		toJson: (set) => set.toJSON(),
		fromJson: (json) => SetRTX.fromJSON(json),
	},
	undefined,
	IMPLICIT.STORE,
)

export const groupsOfCards = new AtomicJunction({
	key: `groupsOfCards`,
	between: [`groupId`, `cardId`],
	cardinality: `1:n`,
})

export const ownersOfGroups = new AtomicJunction({
	key: `ownersOfGroups`,
	between: [`playerId`, `groupId`],
	cardinality: `1:n`,
})
