import { atomFamily } from "atom.io"
import { createMutableAtom } from "atom.io/internal"

import { TransceiverSet } from "atom.io/transceivers/set-io"
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
	TransceiverSet<string>,
	string[]
>({
	key: `cardGroupsIndex::mutable`,
	mutable: true,
	default: () => new TransceiverSet<string>(),
	toJson: (set) => [...set],
	fromJson: (array) => new TransceiverSet<string>(array),
})

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
